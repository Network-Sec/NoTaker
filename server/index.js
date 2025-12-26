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
const { Ollama } = require('ollama'); 
const aiRoutes = require('./ai_api');

// --- NEW ROUTE IMPORTS ---
const notebookRoutes = require('./notebooks_api');
const identityRoutes = require('./identity_api');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// --- OLLAMA CLIENT SETUP ---
let ollamaClient;
try {
    const ollamaHost = process.env.OLLAMA_API_URL || 'http://192.168.2.204:9350';
    ollamaClient = new Ollama({ host: ollamaHost });
    console.log(`[Setup] Ollama client initialized for host: ${ollamaHost}`);
} catch (error) {
    console.error('[Setup] Failed to initialize Ollama client.', error);
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
    
    // Ensure any stuck transactions are rolled back on startup
    appDb.run("ROLLBACK", () => {}); 

    appDb.serialize(() => {
        // Core Tables
        appDb.run(`CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, tags TEXT, link_preview TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT, title TEXT, description TEXT, timestamp TEXT, source TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, content TEXT, quadrant TEXT, date TEXT, completed INTEGER DEFAULT 0)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS notebooks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, timestamp TEXT, blocks TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, title TEXT, description TEXT, time TEXT, duration TEXT, link TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, title TEXT, visit_time TEXT, source TEXT)`); 
        appDb.run(`CREATE TABLE IF NOT EXISTS ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, model TEXT)`); 
        
        // Identity & Credentials Tables
        appDb.run(`CREATE TABLE IF NOT EXISTS identities (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, username TEXT, headline TEXT, email TEXT, phone TEXT, location TEXT, about TEXT, avatarUrl TEXT, bannerUrl TEXT, experience TEXT, education TEXT, skills TEXT, personalCredentials TEXT, linkedVaultIds TEXT, connections INTEGER)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS credential_groups (id TEXT PRIMARY KEY, name TEXT, description TEXT, pairs TEXT, updatedAt TEXT)`);

        // Migrations
        appDb.run("ALTER TABLE memos ADD COLUMN link_preview TEXT", (err) => {});
        appDb.run("ALTER TABLE bookmarks ADD COLUMN source TEXT", (err) => {});
        appDb.run("ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0", (err) => {});
    });
    
    // Task Migration Logic (Simplified for brevity, assuming established)
    appDb.serialize(() => {
        appDb.all("PRAGMA table_info(tasks)", (err, rows) => {
            if (!err && rows && !rows.some(r => r.name === 'date')) {
                 appDb.run("ALTER TABLE tasks ADD COLUMN date TEXT", () => {});
            }
        });
    });
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// --- MOUNT ROUTES ---
app.use('/api/ai', aiRoutes(appDb, ollamaClient));
app.use('/api/notebooks', notebookRoutes(appDb)); // Notebooks isolated
app.use('/api', identityRoutes(appDb));           // Identities isolated

// --- CORE ROUTES (Memos, Tasks, etc) ---
// Keep these here or move to another file if needed, but Index is fine for generic stuff

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/upload/image', uploadMemory.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const date = new Date();
    const datePath = path.join(UPLOAD_DIR, `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`);
    if (!fs.existsSync(datePath)) fs.mkdirSync(datePath, { recursive: true });

    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const newFilename = `${Date.now()}_${baseName}.webp`;
    const finalFilePath = path.join(datePath, newFilename);

    try {
        const buffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
        await fs.promises.writeFile(finalFilePath, buffer);
        res.json({ url: `/uploads/${path.basename(datePath)}/${newFilename}` });
    } catch (writeError) {
        res.status(500).send('Error saving file.');
    }
});

// Memos
app.get('/api/memos', (req, res) => {
    appDb.all('SELECT * FROM memos ORDER BY timestamp DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]'), linkPreview: row.link_preview ? JSON.parse(row.link_preview) : null })));
    });
});
app.post('/api/memos', (req, res) => {
    const { timestamp, type, content, tags = [], linkPreview } = req.body;
    appDb.run(`INSERT INTO memos (timestamp, type, content, tags, link_preview) VALUES (?, ?, ?, ?, ?)`, 
        [timestamp, type, content, JSON.stringify(tags), linkPreview ? JSON.stringify(linkPreview) : null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/memos/:id', (req, res) => {
    const { content, tags } = req.body;
    appDb.run(`UPDATE memos SET content = ?, tags = ? WHERE id = ?`, [content, JSON.stringify(tags || []), req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated', changes: this.changes });
    });
});
app.put('/api/memos/:id/link-preview', (req, res) => {
    const { linkPreview } = req.body;
    appDb.run(`UPDATE memos SET link_preview = ? WHERE id = ?`, [linkPreview ? JSON.stringify(linkPreview) : null, req.params.id], function(err) {
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

// Bookmarks & History
app.get('/api/bookmarks', (req, res) => {
    appDb.all('SELECT * FROM bookmarks ORDER BY timestamp DESC', (err, rows) => res.json(err ? [] : rows));
});
app.get('/api/history', (req, res) => {
    appDb.all('SELECT * FROM history ORDER BY visit_time DESC LIMIT 2000', (err, rows) => res.json(err ? [] : rows));
});

// Tasks
app.get('/api/tasks', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });
    appDb.all('SELECT id, content, quadrant, completed FROM tasks WHERE date = ?', [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length > 0) return res.json(rows);
        // Fallback inheritance logic...
        appDb.get('SELECT date FROM tasks WHERE date < ? ORDER BY date DESC LIMIT 1', [date], (err, row) => {
            if (!row) return res.json([]);
            appDb.all('SELECT id, content, quadrant, completed FROM tasks WHERE date = ?', [row.date], (err, inherited) => {
                res.json(err ? [] : inherited);
            });
        });
    });
});
app.post('/api/tasks', (req, res) => {
    const { date, tasks } = req.body;
    if (!date || !tasks) return res.status(400).json({ error: 'Data missing' });
    appDb.serialize(() => {
        appDb.run('DELETE FROM tasks WHERE date = ?', [date]);
        const stmt = appDb.prepare('INSERT OR REPLACE INTO tasks (id, content, quadrant, date, completed) VALUES (?, ?, ?, ?, ?)');
        tasks.forEach(t => stmt.run(t.id, t.content, t.quadrant, date, t.completed ? 1 : 0));
        stmt.finalize(() => res.json({ message: 'Saved' }));
    });
});

// Events
app.get('/api/events', (req, res) => {
    appDb.all('SELECT * FROM events ORDER BY date, time', (err, rows) => res.json(err ? [] : rows));
});
app.post('/api/events', (req, res) => {
    const { date, title, description, time, duration, link } = req.body;
    appDb.run(`INSERT INTO events (date, title, description, time, duration, link) VALUES (?, ?, ?, ?, ?, ?)`,
        [date, title, description, time, duration, link], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Utils
app.get('/api/link-preview', async (req, res) => {
    try { res.json(await fetchLinkPreview(req.query.url)); } catch (e) { res.status(500).json({}); }
});
app.get('/api/graph-data', async (req, res) => {
    try { res.json(await getGraphData(appDb)); } catch (e) { res.status(500).json({}); }
});
app.get('/api/search', async (req, res) => {
    try { res.json(await searchAll(appDb, req.query.q)); } catch (e) { res.status(500).json({}); }
});

// Settings
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
app.get('/api/settings', (req, res) => {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
        if (err) return res.json({ firefox: {}, chrome: {}, ai: {}, general: { importInterval: 30 }, generic: {} });
        try { res.json(JSON.parse(data)); } catch (e) { res.status(500).json({}); }
    });
});
app.put('/api/settings', (req, res) => {
    fs.writeFile(SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json({ message: 'Saved' });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if(browserImporter && browserImporter.performBrowserDataImport) {
        browserImporter.startScheduledImport(appDb);
    }
});