const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- CONSTANTS ---
const CHROME_EPOCH_DIFF = 11644473600000;
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

// Helper to get config
function getImportInterval() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            if (settings.general && settings.general.importInterval) {
                return parseInt(settings.general.importInterval);
            }
        }
    } catch (e) { /* ignore */ }
    return parseInt(process.env.IMPORT_INTERVAL_MINUTES || '30');
}

const LOCAL_TMP_DIR = path.join(__dirname, 'tmp');

// Ensure tmp dir exists
if (!fs.existsSync(LOCAL_TMP_DIR)) {
    try { fs.mkdirSync(LOCAL_TMP_DIR); } catch (e) { console.error("[Importer] Could not create tmp dir", e); }
}

// --- HELPERS ---

// Webkit/Chrome: Microseconds since 1601-01-01
function fromWebkitTime(micro) {
    if (!micro || isNaN(micro)) return new Date().toISOString();
    const ms = (micro / 1000) - CHROME_EPOCH_DIFF;
    return new Date(ms).toISOString();
}

function fromChromeBookmarkTime(dateValue) {
    if (!dateValue) return new Date().toISOString();
    const intVal = parseInt(dateValue);
    if (isNaN(intVal)) return new Date().toISOString();
    
    // Webkit time
    const ms = (intVal / 1000) - CHROME_EPOCH_DIFF;
    return new Date(ms).toISOString();
}

// Firefox: Microseconds since 1970-01-01
function fromFirefoxTime(micro) {
    if (!micro || isNaN(micro)) return new Date().toISOString();
    return new Date(micro / 1000).toISOString();
}

function getBrowserPaths() {
    const isWsl = !!process.env.WSL_DISTRO_NAME;
    const home = os.homedir();
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    
    // Helper to resolve WSL path to Windows path if needed
    // In WSL, typically /mnt/c/Users/<User>/...
    // We assume standard Windows mounts in WSL for simplicity or use specific ENV vars.
    
    // Basic detection strategies
    const targets = [
        { name: 'Chrome', path: process.env.CHROME_USER_DATA_DIR || path.join(localAppData, 'Google', 'Chrome', 'User Data'), type: 'chrome' },
        { name: 'Brave', path: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data'), type: 'chrome' },
        { name: 'Firefox', path: path.join(appData, 'Mozilla', 'Firefox', 'Profiles'), type: 'firefox' }
    ];

    if (isWsl) {
        // Adjust for WSL if paths are not explicitly set via ENV
        // Trying to guess Windows user from /mnt/c/Users
        // This is tricky without user config. 
        // We will rely on CHROME_WSL_USER_DATA_DIR for specific overrides or just check if the env var exists.
        // For now, we keep the original Logic for Chrome if ENV exists
        if(process.env.CHROME_WSL_USER_DATA_DIR) {
             targets[0].path = process.env.CHROME_WSL_USER_DATA_DIR;
        }
        // Add more WSL path mappings here if needed or requested
    }
    
    return targets;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function copyFileWithRetry(src, dest, maxRetries = 3) {
    if (!fs.existsSync(src)) return false;

    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.copyFileSync(src, dest);
            return true;
        } catch (err) {
            if (i === maxRetries - 1) {
                // console.warn(`[Importer] Failed to copy ${path.basename(src)}: ${err.message}`);
                return false;
            }
            await sleep(200 * Math.pow(2, i));
        }
    }
    return false;
}

async function stageBrowserDb(userDataDir, profileName, dbName) {
    const safeProfile = profileName.replace(/[^a-z0-9]/gi, '_');
    // Chrome/Brave structure: User Data/Default/History
    // Firefox structure: Profiles/xxxx.default/places.sqlite
    
    const srcDb = path.join(userDataDir, profileName, dbName);
    
    // Firefox path might be direct if 'userDataDir' is the profile folder itself
    const srcDbDirect = path.join(userDataDir, dbName);

    let finalSrc = srcDb;
    if (!fs.existsSync(srcDb) && fs.existsSync(srcDbDirect)) {
        finalSrc = srcDbDirect;
    } else if (!fs.existsSync(srcDb)) {
        return null;
    }

    const destDb = path.join(LOCAL_TMP_DIR, `import_${safeProfile}_${Date.now()}.sqlite`);
    
    const success = await copyFileWithRetry(finalSrc, destDb);
    if (!success) return null;

    // Best-effort copy for WAL/SHM
    await copyFileWithRetry(finalSrc + '-wal', destDb + '-wal', 1);
    await copyFileWithRetry(finalSrc + '-shm', destDb + '-shm', 1);

    return destDb;
}

// --- CHROME / BRAVE IMPORTERS ---

async function importChromeHistory(appDb, userDataDir, profileName, sourceLabel = 'Chrome') {
    let tempPath = null;
    let browserDb = null;

    try {
        tempPath = await stageBrowserDb(userDataDir, profileName, 'History');
        if (!tempPath) return;

        browserDb = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY);
        
        const rows = await new Promise((resolve) => {
            const query = `
                SELECT u.url, u.title, v.visit_time 
                FROM visits v
                JOIN urls u ON v.url = u.id
                ORDER BY v.visit_time DESC
                LIMIT 2000 
            `;
            browserDb.all(query, (err, rows) => {
                if (err) resolve([]); 
                else resolve(rows);
            });
        });

        if (rows && rows.length > 0) {
            const sourceTag = `${sourceLabel}-${profileName}`;
            // console.log(`[Importer] Importing ${rows.length} history items from ${sourceTag}`);

            await new Promise((resolve, reject) => {
                const stmt = appDb.prepare(`
                    INSERT OR IGNORE INTO browser_history (id, url, title, visit_time, source)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                appDb.serialize(() => {
                    appDb.run("BEGIN TRANSACTION");
                    rows.forEach(row => {
                        try {
                            const isoDate = fromWebkitTime(row.visit_time);
                            // ID construction to avoid duplicates
                            const id = `${sourceTag}_${row.visit_time}_${row.url}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);
                            stmt.run(id, row.url, row.title, isoDate, sourceTag);
                        } catch (e) { }
                    });
                    appDb.run("COMMIT", (err) => {
                        stmt.finalize();
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        }

    } catch (err) {
        console.error(`[Importer] Error processing history for ${profileName}:`, err.message);
    } finally {
        if (browserDb) await new Promise(resolve => browserDb.close(resolve));
        if (tempPath) {
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
            try { if (fs.existsSync(tempPath + '-wal')) fs.unlinkSync(tempPath + '-wal'); } catch(e) {}
            try { if (fs.existsSync(tempPath + '-shm')) fs.unlinkSync(tempPath + '-shm'); } catch(e) {}
        }
    }
}

async function importChromeBookmarks(appDb, userDataDir, profileName, sourceLabel = 'Chrome') {
    const bookmarksPath = path.join(userDataDir, profileName, 'Bookmarks');
    const sourceTag = `${sourceLabel}-${profileName}`;

    if (!fs.existsSync(bookmarksPath)) return;

    let json;
    try {
        const data = fs.readFileSync(bookmarksPath, 'utf8');
        json = JSON.parse(data);
    } catch (e) { return; }

    const bookmarksToInsert = [];

    function traverse(node) {
        if (node.type === 'url') {
            bookmarksToInsert.push({
                id: `bm_${sourceTag}_${node.id}`.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 100),
                url: node.url,
                title: node.name,
                date_added: fromChromeBookmarkTime(node.date_added)
            });
        } else if (node.children) {
            node.children.forEach(traverse);
        }
    }

    if (json.roots) Object.values(json.roots).forEach(traverse);
    
    if (bookmarksToInsert.length > 0) {
        await new Promise((resolve, reject) => {
            const stmt = appDb.prepare(`
                INSERT OR IGNORE INTO bookmarks (id, url, title, timestamp, source)
                VALUES (?, ?, ?, ?, ?)
            `);

            appDb.serialize(() => {
                appDb.run("BEGIN TRANSACTION");
                bookmarksToInsert.forEach(bm => {
                    stmt.run(bm.id, bm.url, bm.title, bm.date_added, sourceTag);
                });
                appDb.run("COMMIT", (err) => {
                    stmt.finalize();
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }
}

// --- FIREFOX IMPORTER ---

async function importFirefoxData(appDb, profilePath, profileName = 'Default') {
    let tempPath = null;
    let browserDb = null;
    const sourceTag = `Firefox-${profileName}`;

    try {
        // Firefox stores both history and bookmarks in places.sqlite
        tempPath = await stageBrowserDb(profilePath, '', 'places.sqlite'); // Empty profileName as profilePath is full
        if (!tempPath) return;

        browserDb = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY);

        // 1. History
        const historyRows = await new Promise((resolve) => {
            const query = `
                SELECT h.url, h.title, v.visit_date
                FROM moz_historyvisits v
                JOIN moz_places h ON v.place_id = h.id
                ORDER BY v.visit_date DESC
                LIMIT 2000
            `;
            browserDb.all(query, (err, rows) => resolve(err ? [] : rows));
        });

        if (historyRows.length > 0) {
             await new Promise((resolve, reject) => {
                const stmt = appDb.prepare(`INSERT OR IGNORE INTO browser_history (id, url, title, visit_time, source) VALUES (?, ?, ?, ?, ?)`);
                appDb.serialize(() => {
                    appDb.run("BEGIN TRANSACTION");
                    historyRows.forEach(row => {
                        const isoDate = fromFirefoxTime(row.visit_date);
                        // Using 'visit_date' which is microseconds
                        const id = `${sourceTag}_${row.visit_date}_${row.url}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);
                        stmt.run(id, row.url, row.title, isoDate, sourceTag);
                    });
                    appDb.run("COMMIT", (err) => {
                        stmt.finalize();
                        if(err) reject(err) 
                        else resolve();
                    });
                });
            });
        }

        // 2. Bookmarks
        const bookmarkRows = await new Promise((resolve) => {
            const query = `
                SELECT b.title, p.url, b.dateAdded
                FROM moz_bookmarks b
                JOIN moz_places p ON b.fk = p.id
                WHERE b.type = 1
            `;
            browserDb.all(query, (err, rows) => resolve(err ? [] : rows));
        });

        if (bookmarkRows.length > 0) {
             await new Promise((resolve, reject) => {
                const stmt = appDb.prepare(`INSERT OR IGNORE INTO bookmarks (id, url, title, timestamp, source) VALUES (?, ?, ?, ?, ?)`);
                appDb.serialize(() => {
                    appDb.run("BEGIN TRANSACTION");
                    bookmarkRows.forEach(row => {
                        const isoDate = fromFirefoxTime(row.dateAdded);
                        // Construct ID
                        const id = `bm_${sourceTag}_${row.dateAdded}_${row.url}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);
                        stmt.run(id, row.url, row.title, isoDate, sourceTag);
                    });
                    appDb.run("COMMIT", (err) => {
                        stmt.finalize();
                        if(err) reject(err) 
                        else resolve();
                    });
                });
            });
        }

    } catch (err) {
        console.error(`[Importer] Firefox error: ${err.message}`);
    } finally {
        if (browserDb) await new Promise(resolve => browserDb.close(resolve));
        if (tempPath) {
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
            try { if (fs.existsSync(tempPath + '-wal')) fs.unlinkSync(tempPath + '-wal'); } catch(e) {}
            try { if (fs.existsSync(tempPath + '-shm')) fs.unlinkSync(tempPath + '-shm'); } catch(e) {}
        }
    }
}


// --- MAIN ORCHESTRATOR ---

async function performBrowserDataImport(appDb) {
    // 1. Chrome (Default Env or Discovered)
    const chromeDir = getChromeUserDataDir(); // Legacy/ENV support
    if (chromeDir && fs.existsSync(chromeDir)) {
        const profiles = (process.env.CHROME_PROFILE_NAMES || "Default").split(',').map(p => p.trim());
        for (const p of profiles) {
            await importChromeHistory(appDb, chromeDir, p, 'Chrome');
            await importChromeBookmarks(appDb, chromeDir, p, 'Chrome');
        }
    }

    // 2. Brave (Auto-detected if exists)
    if(process.platform === 'win32' || process.env.WSL_DISTRO_NAME) {
         // Basic brave detection logic
         const bravePath = path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'User Data');
         // In WSL we might need manual override or just ignore auto-detect if not configured
         if (fs.existsSync(bravePath)) {
            // Assume Default profile for Brave for now
            await importChromeHistory(appDb, bravePath, 'Default', 'Brave');
            await importChromeBookmarks(appDb, bravePath, 'Default', 'Brave');
         }
    }

    // 3. Firefox (Auto-detected if exists)
    // Looking for profiles.ini or scanning Profiles folder
    const appData = process.env.APPDATA || '';
    const firefoxProfilesDir = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
    
    if (fs.existsSync(firefoxProfilesDir)) {
        const entries = fs.readdirSync(firefoxProfilesDir);
        for (const entry of entries) {
            const fullPath = path.join(firefoxProfilesDir, entry);
            if (fs.statSync(fullPath).isDirectory() && entry.includes('.default')) {
                // Heuristic: treat folders with '.default' as profiles
                await importFirefoxData(appDb, fullPath, entry);
            }
        }
    }
}

function getChromeUserDataDir() {
    if (process.env.WSL_DISTRO_NAME) {
        return process.env.CHROME_WSL_USER_DATA_DIR;
    }
    return process.env.CHROME_WINDOWS_USER_DATA_DIR || path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
}

function startScheduledImport(appDb) {
    const intervalMinutes = getImportInterval();
    console.log(`[Importer] Scheduler started. Interval: ${intervalMinutes}m`);
    
    // Run immediately
    // performBrowserDataImport(appDb); // managed by index.js now
    
    setInterval(() => performBrowserDataImport(appDb), intervalMinutes * 60 * 1000);
}

module.exports = { performBrowserDataImport, startScheduledImport };