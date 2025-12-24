const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// --- CONSTANTS ---
const CHROME_EPOCH_DIFF = 11644473600000;
const IMPORT_INTERVAL_MINUTES = process.env.IMPORT_INTERVAL_MINUTES || 30;
const LOCAL_TMP_DIR = path.join(__dirname, 'tmp');

// Ensure tmp dir exists
if (!fs.existsSync(LOCAL_TMP_DIR)) {
    try { fs.mkdirSync(LOCAL_TMP_DIR); } catch (e) { console.error("[Importer] Could not create tmp dir", e); }
}

// --- HELPERS ---

function fromWebkitTime(micro) {
    const ms = (micro / 1000) - CHROME_EPOCH_DIFF;
    return new Date(ms).toISOString();
}

function fromChromeBookmarkTime(dateValue) {
    const ms = (parseInt(dateValue) / 1000) - CHROME_EPOCH_DIFF;
    return new Date(ms).toISOString();
}

function getChromeUserDataDir() {
    if (process.env.WSL_DISTRO_NAME) {
        return process.env.CHROME_WSL_USER_DATA_DIR;
    }
    return process.env.CHROME_WINDOWS_USER_DATA_DIR || path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
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
                console.warn(`[Importer] Failed to copy ${path.basename(src)}: ${err.message}`);
                return false;
            }
            await sleep(200 * Math.pow(2, i));
        }
    }
    return false;
}

async function stageBrowserDb(userDataDir, profileName) {
    const safeProfile = profileName.replace(/[^a-z0-9]/gi, '_');
    const srcDb = path.join(userDataDir, profileName, 'History');
    
    if (!fs.existsSync(srcDb)) return null;

    const destDb = path.join(LOCAL_TMP_DIR, `history_${safeProfile}_${Date.now()}.sqlite`);
    
    const success = await copyFileWithRetry(srcDb, destDb);
    if (!success) return null;

    // Best-effort copy for WAL/SHM
    await copyFileWithRetry(srcDb + '-wal', destDb + '-wal', 1);
    await copyFileWithRetry(srcDb + '-shm', destDb + '-shm', 1);

    return destDb;
}

async function importChromeHistory(appDb, userDataDir, profileName) {
    let tempPath = null;
    let browserDb = null;

    try {
        tempPath = await stageBrowserDb(userDataDir, profileName);
        if (!tempPath) return;

        browserDb = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY);
        
        const rows = await new Promise((resolve) => {
            const query = `
                SELECT u.url, u.title, v.visit_time 
                FROM visits v
                JOIN urls u ON v.url = u.id
                ORDER BY v.visit_time DESC
                LIMIT 5000 
            `;
            browserDb.all(query, (err, rows) => {
                if (err) {
                    console.warn(`[Importer] SQLite Read Error (${profileName}):`, err.message);
                    resolve([]); 
                } else {
                    resolve(rows);
                }
            });
        });

        if (rows && rows.length > 0) {
            console.log(`[Importer] Importing ${rows.length} history entries for ${profileName}...`);
            const sourceTag = `Chrome-${profileName}`;

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
                            const id = `${sourceTag}_${row.visit_time}_${row.url}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);
                            stmt.run(id, row.url, row.title, isoDate, sourceTag);
                        } catch (e) { /* ignore row error */ }
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

async function importChromeBookmarks(appDb, userDataDir, profileName) {
    const bookmarksPath = path.join(userDataDir, profileName, 'Bookmarks');
    const sourceTag = `Chrome-${profileName}`;

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
    
    console.log(`[Importer] Prepared ${bookmarksToInsert.length} bookmarks for insertion for ${profileName}.`);

    if (bookmarksToInsert.length > 0) {
        console.log(`[Importer] Importing ${bookmarksToInsert.length} bookmarks for ${profileName}...`);
        
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

async function performBrowserDataImport(appDb) {
    const userDataDir = getChromeUserDataDir();
    if (!userDataDir || !fs.existsSync(userDataDir)) {
        console.error(`[Importer] Chrome data directory not found: ${userDataDir}`);
        return;
    }

    const profiles = (process.env.CHROME_PROFILE_NAMES || "Default").split(',').map(p => p.trim()).filter(Boolean);

    for (const profile of profiles) {
        await importChromeHistory(appDb, userDataDir, profile);
        await importChromeBookmarks(appDb, userDataDir, profile);
    }
}

function startScheduledImport(appDb) {
    console.log(`[Importer] Scheduler started. Interval: ${IMPORT_INTERVAL_MINUTES}m`);
    setInterval(() => performBrowserDataImport(appDb), IMPORT_INTERVAL_MINUTES * 60 * 1000);
}

module.exports = { performBrowserDataImport, startScheduledImport };