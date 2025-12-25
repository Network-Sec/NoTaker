require('dotenv').config({ path: '.env' });
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const browserImporter = require('./browser_importer');
const multer = require('multer');
const sharp = require('sharp');
const { fetchLinkPreview } = require('./website_preload');
const { getGraphData } = require('./graph_data');
const { searchAll } = require('./search');
const { Ollama } = require('ollama'); // Correctly destructure the Ollama class
const aiRoutes = require('./ai_api'); // Import AI routes

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// --- OLLAMA CLIENT SETUP ---
// Initialize Ollama client with host from env
let ollamaClient;
try {
    const ollamaHost = process.env.OLLAMA_API_URL || 'http://192.168.2.204:9350';
    ollamaClient = new Ollama({ host: ollamaHost });
    console.log(`[Setup] Ollama client initialized for host: ${ollamaHost}`);
} catch (error) {
    console.error('[Setup] Failed to initialize Ollama client. AI features may be unavailable.', error);
    // Fallback: try to use the default export if constructor failed (compatibility mode)
    try {
        ollamaClient = require('ollama').default || require('ollama');
    } catch (e) {
        console.error('[Setup] Ollama fallback failed:', e);
    }
}

// --- DATABASE SETUP ---
const appDbPath = path.resolve(__dirname, 'notetaker.db');

if (!fs.existsSync(appDbPath)) {
    console.log('[Setup] Creating database file...');
    try { fs.closeSync(fs.openSync(appDbPath, 'w')); } catch(e) {}
}

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const appDb = new sqlite3.Database(appDbPath, (err) => {
    if (err) {
        console.error('[Setup] Failed to connect to DB:', err.message);
        process.exit(1);
    }
    console.log('[Setup] Connected to SQLite.');
    
    appDb.run("PRAGMA journal_mode = WAL;", (err) => {
        if(err) console.warn("Could not enable WAL mode:", err);
    });
    
    appDb.serialize(() => {
        // 1. Define Tables
        appDb.run(`CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, tags TEXT, link_preview TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT, title TEXT, description TEXT, timestamp TEXT, source TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, content TEXT, quadrant TEXT, date TEXT, completed INTEGER DEFAULT 0)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS notebooks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, timestamp TEXT, blocks TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, title TEXT, description TEXT, time TEXT, duration TEXT, link TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, title TEXT, visit_time TEXT, source TEXT)`); 
        appDb.run(`CREATE TABLE IF NOT EXISTS ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, model TEXT)`); 


        // 2. FORCE MIGRATION: Link Preview Column
        appDb.run("ALTER TABLE memos ADD COLUMN link_preview TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.warn("[Migration Warning] Issue adding link_preview:", err.message);
            } else if (!err) {
                console.log("[Migration] Successfully added 'link_preview' column.");
            }
        });

        // 3. FORCE MIGRATION: Bookmarks Source
        appDb.run("ALTER TABLE bookmarks ADD COLUMN source TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) { /* ignore */ }
        });

        // 4. FORCE MIGRATION: Tasks Completed Column
        appDb.run("ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.warn("[Migration Warning] Issue adding completed column to tasks:", err.message);
            } else if (!err) {
                console.log("[Migration] Successfully added 'completed' column to tasks.");
            }
        });
    });

    // --- Complex Migrations (Tasks) ---
    appDb.serialize(() => {
        appDb.all("PRAGMA table_info(tasks)", (err, rows) => {
            if (err) return;
            if (rows && !rows.some(r => r.name === 'date')) {
                // Task table needs full recreation for PK change/new column
                appDb.run("ALTER TABLE tasks ADD COLUMN date TEXT", (alterErr) => {
                    if (alterErr) {
                         // Fallback recreation
                        appDb.run(`CREATE TABLE IF NOT EXISTS tasks_new (id TEXT, content TEXT, quadrant TEXT, date TEXT, PRIMARY KEY (id, date))`, (createErr) => {
                            if (createErr) return;
                            appDb.run("INSERT INTO tasks_new (id, content, quadrant, date) SELECT id, content, quadrant, '' FROM tasks", (insertErr) => {
                                if (insertErr) return;
                                appDb.run("DROP TABLE tasks", (dropErr) => {
                                    if (dropErr) return;
                                    appDb.run("ALTER TABLE tasks_new RENAME TO tasks");
                                });
                            });
                        });
                        return;
                    }
                    // Recreate PK
                    appDb.run(`
                        CREATE TABLE tasks_backup (id TEXT, content TEXT, quadrant TEXT, date TEXT);
                        INSERT INTO tasks_backup SELECT id, content, quadrant, DATE('now') FROM tasks;
                        DROP TABLE tasks;
                        CREATE TABLE tasks (id TEXT, content TEXT, quadrant TEXT, date TEXT, PRIMARY KEY (id, date));
                        INSERT INTO tasks (id, content, quadrant, date) SELECT id, content, quadrant, date FROM tasks_backup;
                        DROP TABLE tasks_backup;
                    `);
                });
            } else if (rows && !rows.some(r => r.pk && r.name === 'id' && rows.some(r2 => r2.name === 'date' && r2.pk))) {
                 appDb.run(`
                    CREATE TABLE tasks_backup (id TEXT, content TEXT, quadrant TEXT, date TEXT);
                    INSERT INTO tasks_backup SELECT id, content, quadrant, date FROM tasks;
                    DROP TABLE tasks;
                    CREATE TABLE tasks (id TEXT, content TEXT, quadrant TEXT, date TEXT, PRIMARY KEY (id, date));
                    INSERT INTO tasks (id, content, quadrant, date) SELECT id, content, quadrant, date FROM tasks_backup;
                    DROP TABLE tasks_backup;
                `);
            }
        });
    });
});


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api/ai', aiRoutes(appDb, ollamaClient)); // Pass the initialized ollamaClient

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- IMAGE UPLOAD ROUTE ---
app.post('/api/upload/image', uploadMemory.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const datePath = path.join(UPLOAD_DIR, `${year}-${month}-${day}`);
    
    if (!fs.existsSync(datePath)) fs.mkdirSync(datePath, { recursive: true });

    const ms = date.getMilliseconds().toString().padStart(4, '0');
    const readableTimestamp = `${date.getHours()}${date.getMinutes()}${date.getSeconds()}${ms}`;
    const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const baseName = path.basename(originalname, path.extname(originalname));
    
    let newFilename = `${readableTimestamp}_${baseName}.webp`;
    let processedBuffer;

    try {
        processedBuffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
    } catch (error) {
        processedBuffer = req.file.buffer;
        newFilename = `${readableTimestamp}_${baseName}${path.extname(originalname)}`;
    }

    const finalFilePath = path.join(datePath, newFilename);

    try {
        await fs.promises.writeFile(finalFilePath, processedBuffer);
        res.json({ url: `/uploads/${path.basename(datePath)}/${newFilename}` });
    } catch (writeError) {
        console.error('[Multer] Error writing file:', writeError);
        res.status(500).send('Error saving file.');
    }
});

// --- ROUTES ---

app.get('/api/memos', (req, res) => {
    appDb.all('SELECT * FROM memos ORDER BY timestamp DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const memos = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            linkPreview: row.link_preview ? JSON.parse(row.link_preview) : null
        }));
        res.json(memos);
    });
});

app.get('/api/bookmarks', (req, res) => {
    appDb.all('SELECT * FROM bookmarks ORDER BY timestamp DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/history', (req, res) => {
    appDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='browser_history'", (err, row) => {
        if(err || !row) return res.json([]);
        appDb.all('SELECT * FROM browser_history ORDER BY visit_time DESC LIMIT 2000', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });
});

app.get('/api/tasks', (req, res) => {
    const { date } = req.query;
    if (!date) {
        console.warn("[API] GET /tasks: Date parameter is missing.");
        return res.status(400).json({ error: 'Date required' });
    }
    console.log(`[API] GET /tasks: Request for date: ${date}`);

    const queryForDate = (targetDate, callback) => {
        // 1. Try to get tasks specifically for the targetDate
        appDb.all('SELECT id, content, quadrant, completed FROM tasks WHERE date = ?', [targetDate], (err, rows) => {
            if (err) {
                console.error(`[API] GET /tasks: Error querying for targetDate ${targetDate}:`, err.message);
                return callback(err);
            }
            if (rows && rows.length > 0) {
                console.log(`[API] GET /tasks: Found ${rows.length} tasks for targetDate ${targetDate}. (Direct Load)`);
                return callback(null, rows);
            }

            console.log(`[API] GET /tasks: No direct tasks for ${targetDate}. Attempting inheritance.`);

            // 2. If no direct tasks, find tasks from the most recent day BEFORE targetDate
            appDb.get('SELECT date FROM tasks WHERE date < ? ORDER BY date DESC LIMIT 1', [targetDate], (err, row) => {
                if (err) {
                    console.error("[API] GET /tasks: Error finding most recent previous date:", err.message);
                    return callback(err, []);
                }
                if (row && row.date) {
                    const inheritedDate = row.date;
                    console.log(`[API] GET /tasks: Inheriting tasks from most recent previous day: ${inheritedDate}.`);
                    appDb.all('SELECT id, content, quadrant, completed FROM tasks WHERE date = ?', [inheritedDate], (err, inheritedRows) => {
                        if (err) {
                            console.error(`[API] GET /tasks: Error inheriting tasks from ${inheritedDate}:`, err.message);
                            return callback(err, []);
                        }
                        return callback(null, inheritedRows);
                    });
                } else {
                    console.log(`[API] GET /tasks: No tasks found on or before ${targetDate}. Returning empty.`);
                    return callback(null, []); // No tasks found for current or previous days
                }
            });
        });
    };

    queryForDate(date, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.get('/api/notebooks', (req, res) => {
    appDb.all('SELECT * FROM notebooks', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const nbs = rows.map(r => {
            let parsedBlocks = [];
            try {
                parsedBlocks = JSON.parse(r.blocks || '[]');
            } catch (parseError) {
                console.error(`[API] Error parsing blocks for notebook ID ${r.id}:`, parseError.message);
                // Optionally, log the malformed blocks content: console.error("Malformed blocks content:", r.blocks);
            }
            return {...r, blocks: parsedBlocks};
        });
        res.json(nbs);
    });
});

app.get('/api/events', (req, res) => {
    appDb.all('SELECT * FROM events ORDER BY date, time', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/link-preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const previewData = await fetchLinkPreview(url); 
    res.json(previewData);
  } catch (error) {
    console.error('Error fetching link preview:', error.message);
    res.status(500).json({ error: 'Failed to fetch link preview', details: error.message });
  }
});

app.get('/api/graph-data', async (req, res) => {
    try {
        const data = await getGraphData(appDb);
        res.json(data);
    } catch (error) {
        console.error('Error fetching graph data:', error.message);
        res.status(500).json({ error: 'Failed to fetch graph data' });
    }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    try {
        const results = await searchAll(appDb, q);
        res.json(results);
    } catch (error) {
        console.error('Error performing search:', error.message);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

app.post('/api/memos', (req, res) => {
    const { timestamp, type, content, tags = [], linkPreview } = req.body;
    
    const linkPreviewJson = linkPreview ? JSON.stringify(linkPreview) : null;
    const tagsJson = JSON.stringify(tags);

    appDb.run(`INSERT INTO memos (timestamp, type, content, tags, link_preview) VALUES (?, ?, ?, ?, ?)`, 
        [timestamp, type, content, tagsJson, linkPreviewJson], function(err) {
        if (err) {
            console.error("[API] POST /memos error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

app.post('/api/tasks', (req, res) => {
    const { date, tasks } = req.body;
    if (!date || !tasks) return res.status(400).json({ error: 'Data missing' });

    appDb.run('DELETE FROM tasks WHERE date = ?', [date], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (tasks.length === 0) return res.json({ message: 'Saved' });

        const stmt = appDb.prepare('INSERT OR REPLACE INTO tasks (id, content, quadrant, date) VALUES (?, ?, ?, ?)');
        tasks.forEach(task => stmt.run(task.id, task.content, task.quadrant, date));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Saved' });
        });
    });
});

app.post('/api/events', (req, res) => {
    const { date, title, description, time, duration, link } = req.body;
    appDb.run(`INSERT INTO events (date, title, description, time, duration, link) VALUES (?, ?, ?, ?, ?, ?)`,
        [date, title, description, time, duration, link], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/notebooks', (req, res) => {
    const notebooks = req.body; 

    appDb.serialize(() => {
        appDb.run('BEGIN TRANSACTION;');

        appDb.run('DELETE FROM notebooks;', (err) => {
            if (err) {
                appDb.run('ROLLBACK;');
                console.error("[API] PUT /notebooks DELETE error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            if (notebooks.length === 0) {
                appDb.run('COMMIT;');
                return res.json({ message: 'All notebooks deleted.' });
            }

            const stmt = appDb.prepare('INSERT INTO notebooks (id, title, timestamp, blocks) VALUES (?, ?, ?, ?)');
            notebooks.forEach(nb => {
                stmt.run(nb.id, nb.title, nb.timestamp, JSON.stringify(nb.blocks));
            });
            stmt.finalize((err) => {
                if (err) {
                    appDb.run('ROLLBACK;');
                    console.error("[API] PUT /notebooks INSERT error:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                appDb.run('COMMIT;');
                res.json({ message: 'Notebooks saved successfully.', count: notebooks.length });
            });
        });
    });
});


app.put('/api/memos/:id', (req, res) => {
    const { content, tags } = req.body;
    appDb.run(`UPDATE memos SET content = ?, tags = ? WHERE id = ?`, 
        [content, JSON.stringify(tags || []), req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated', changes: this.changes });
    });
});

app.put('/api/memos/:id/link-preview', (req, res) => {
    const { linkPreview } = req.body;
    const linkPreviewJson = linkPreview ? JSON.stringify(linkPreview) : null;
    appDb.run(`UPDATE memos SET link_preview = ? WHERE id = ?`, 
        [linkPreviewJson, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Preview Updated', changes: this.changes });
    });
});

app.delete('/api/memos/:id', (req, res) => {
    appDb.run(`DELETE FROM memos WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

// --- Settings API ---
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Helper to get default settings (should match frontend's initial state)
const getDefaultSettings = () => ({
    firefox: {},
    chrome: {},
    ai: {},
    general: { importInterval: 30, darkMode: false, autoScroll: true },
    generic: {}
});

// GET /api/settings
app.get('/api/settings', (req, res) => {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found, return default settings
                console.log('[API] settings.json not found, returning default settings.');
                return res.json(getDefaultSettings());
            }
            console.error('[API] Error reading settings file:', err);
            return res.status(500).json({ error: 'Failed to read settings' });
        }
        try {
            const settings = JSON.parse(data);
            res.json(settings);
        } catch (parseErr) {
            console.error('[API] Error parsing settings JSON:', parseErr);
            res.status(500).json({ error: 'Failed to parse settings' });
        }
    });
});

// PUT /api/settings
app.put('/api/settings', (req, res) => {
    const newSettings = req.body;
    fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('[API] Error writing settings file:', err);
            return res.status(500).json({ error: 'Failed to save settings' });
        }
        res.json({ message: 'Settings saved successfully.' });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if(browserImporter && browserImporter.performBrowserDataImport) {
        browserImporter.performBrowserDataImport(appDb)
            .then(() => console.log('[Main] Initial import finished.'))
            .catch(e => console.error('[Main] Import error:', e));
        browserImporter.startScheduledImport(appDb);
    }
});