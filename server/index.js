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
const { startBackupService } = require('./backup_service');
const setupSettingsRoutes = require('./settings_api');

// --- ROUTE IMPORTS ---
const notebookRoutes = require('./notebooks_api');
const identityRoutes = require('./identity_api');
const setupCalendarRoutes = require('./calendar_api');
const setupDailyCounterRoutes = require('./daily_counter_api'); // New

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
     
    // Safety: Rollback any stuck transactions from a previous crash
    appDb.run("ROLLBACK", () => {}); 

    appDb.serialize(() => {
        // Core Tables
        appDb.run(`CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, tags TEXT, link_preview TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT, title TEXT, description TEXT, timestamp TEXT, source TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, content TEXT, quadrant TEXT, date TEXT, completed INTEGER DEFAULT 0)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS notebooks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, timestamp TEXT, blocks TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, title TEXT, description TEXT, time TEXT, duration TEXT, link TEXT)`);
        
        // CHANGED: Using browser_history as requested
        appDb.run(`CREATE TABLE IF NOT EXISTS browser_history (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, title TEXT, visit_time TEXT, source TEXT)`); 
        
        appDb.run(`CREATE TABLE IF NOT EXISTS ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, type TEXT, content TEXT, model TEXT)`); 
        
        // New table for explicit empty task days
        appDb.run(`CREATE TABLE IF NOT EXISTS task_day_states (date TEXT PRIMARY KEY, is_explicitly_empty INTEGER DEFAULT 0)`);
        
        // Identity & Credentials Tables
        appDb.run(`CREATE TABLE IF NOT EXISTS identities (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, username TEXT, headline TEXT, email TEXT, phone TEXT, location TEXT, about TEXT, avatarUrl TEXT, bannerUrl TEXT, experience TEXT, education TEXT, skills TEXT, personalCredentials TEXT, linkedVaultIds TEXT, connections INTEGER)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS credential_groups (id TEXT PRIMARY KEY, name TEXT, description TEXT, pairs TEXT, updatedAt TEXT)`);
        appDb.run(`CREATE TABLE IF NOT EXISTS toolbox_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, url TEXT, description TEXT, icon_url TEXT, image_url TEXT, timestamp TEXT)`);

        // Migrations
        appDb.run("ALTER TABLE memos ADD COLUMN link_preview TEXT", (err) => {});
        appDb.run("ALTER TABLE bookmarks ADD COLUMN source TEXT", (err) => {});
        appDb.run("ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0", (err) => {});
        appDb.run("ALTER TABLE tasks ADD COLUMN deleted_on TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) console.error("Error altering tasks table to add deleted_on:", err);
        });
        appDb.run("ALTER TABLE notebooks ADD COLUMN parent_id INTEGER", (err) => {}); // New migration for subpages
    });
    
    // Task Migration Logic
    appDb.serialize(() => {
        appDb.all("PRAGMA table_info(tasks)", (err, rows) => {
            if (!err && rows && !rows.some(r => r.name === 'date')) {
                 appDb.run("ALTER TABLE tasks ADD COLUMN date TEXT", () => {});
            }
        });
    });

    // --- START BACKUP SERVICE ---
    startBackupService(appDb);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// --- SERVE FRONTEND (STATIC) ---
// This allows the server to host the built frontend, enabling a single-app deployment.
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
    console.log(`[Setup] Serving static files from: ${PUBLIC_DIR}`);
    app.use(express.static(PUBLIC_DIR));
    
    // SPA Fallback: Serve index.html for any unknown route not handled by API
    // Must be after API routes!
}

// --- MOUNT ROUTES ---
app.use('/api/ai', aiRoutes(appDb, ollamaClient));
app.use('/api/notebooks', notebookRoutes(appDb)); 
app.use('/api', identityRoutes(appDb));
setupCalendarRoutes(app, appDb);
setupDailyCounterRoutes(app, appDb); // New
setupSettingsRoutes(app);

// Toolbox
app.get('/api/toolbox', (req, res) => {
    appDb.all('SELECT * FROM toolbox_items ORDER BY timestamp DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({
            id: r.id,
            title: r.title,
            url: r.url,
            description: r.description,
            iconUrl: r.icon_url,
            imageUrl: r.image_url,
            timestamp: r.timestamp
        })));
    });
});
app.post('/api/toolbox', async (req, res) => {
    const { url, title, description } = req.body;
    try {
        const preview = await fetchLinkPreview(url);
        const finalTitle = title || preview.title || url;
        const finalDesc = description || preview.description || '';
        const iconUrl = preview.faviconUrl || '';
        const imageUrl = preview.imageUrl || '';
        const timestamp = new Date().toISOString();

        appDb.run(`INSERT INTO toolbox_items (title, url, description, icon_url, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
            [finalTitle, url, finalDesc, iconUrl, imageUrl, timestamp],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, title: finalTitle, url, description: finalDesc, iconUrl, imageUrl, timestamp });
            }
        );
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.delete('/api/toolbox/:id', (req, res) => {
    appDb.run('DELETE FROM toolbox_items WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});
app.put('/api/toolbox/:id', (req, res) => {
    const { title, url, description } = req.body;
    appDb.run('UPDATE toolbox_items SET title = ?, url = ?, description = ? WHERE id = ?', 
        [title, url, description, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
    });
});

// --- CORE ROUTES ---

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

// Bookmarks
app.get('/api/bookmarks', (req, res) => {
    appDb.all('SELECT * FROM bookmarks ORDER BY timestamp DESC', (err, rows) => res.json(err ? [] : rows));
});

// --- FIXED HISTORY ENDPOINT ---
app.get('/api/history', (req, res) => {
    // Explicitly querying browser_history as requested
    appDb.all('SELECT * FROM browser_history ORDER BY visit_time DESC LIMIT 2000', (err, rows) => {
        if (err) {
            console.error("[API] Error fetching browser_history:", err.message);
            return res.status(500).json([]);
        }
        res.json(rows);
    });
});

// Tasks
app.get('/api/tasks', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });

    // Function to filter tasks based on deleted_on logic
    const filterTasks = (tasks, forDate) => {
        const queryDate = new Date(forDate);
        return tasks.filter(task => {
            if (task.deleted_on) {
                const deletedOnDate = new Date(task.deleted_on);
                return queryDate < deletedOnDate; // Keep task if queryDate is before deletedOnDate
            }
            return true; // Keep task if not deleted
        });
    };

    // Step 1: Check if this date has an explicitly empty task state
    appDb.get('SELECT is_explicitly_empty FROM task_day_states WHERE date = ?', [date], (err, dayState) => {
        if (err) {
            console.error(`[Backend] Error checking task_day_states for date ${date}:`, err.message);
            return res.status(500).json({ error: err.message });
        }

        if (dayState && dayState.is_explicitly_empty === 1) {
            console.log(`[Backend] Tasks for date ${date} are explicitly empty.`);
            return res.json([]); // Explicitly empty, return no tasks
        }

        // Step 2: If not explicitly empty, check for tasks directly for this date
        appDb.all('SELECT id, content, quadrant, completed, deleted_on FROM tasks WHERE date = ?', [date], (err, rows) => {
            if (err) {
                console.error(`[Backend] Error fetching tasks for date ${date}:`, err.message);
                return res.status(500).json({ error: err.message });
            }
            const filteredRows = filterTasks(rows, date);
            if (filteredRows.length > 0) {
                console.log(`[Backend] Found ${filteredRows.length} tasks for date ${date}.`);
                return res.json(filteredRows); // If tasks exist for date, return them
            }
            
            // Step 3: If no tasks for this date (and not explicitly empty), inherit from the most recent previous day
            // Only inherit from a day that has tasks that are not marked as deleted for the current 'date'
            const inheritQuery = `
                SELECT date FROM tasks 
                WHERE date < ? 
                ORDER BY date DESC LIMIT 1
            `;
            appDb.get(inheritQuery, [date], (err, row) => {
                if (err) {
                    console.error(`[Backend] Error fetching previous day for inheritance for date ${date}:`, err.message);
                    return res.status(500).json({ error: err.message });
                }
                if (!row) {
                    console.log(`[Backend] No previous tasks to inherit for date ${date}.`);
                    return res.json([]); // No prior tasks, return empty
                }
                // Inherit tasks from most recent previous day, applying deletion filter
                appDb.all('SELECT id, content, quadrant, completed, deleted_on FROM tasks WHERE date = ?', [row.date], (err, inherited) => {
                    if (err) {
                        console.error(`[Backend] Error inheriting tasks from ${row.date} for date ${date}:`, err.message);
                        return res.status(500).json({ error: err.message });
                    }
                    const filteredInherited = filterTasks(inherited, date);
                    console.log(`[Backend] Inherited ${filteredInherited.length} tasks from ${row.date} for date ${date}.`);
                    res.json(filteredInherited); // Return tasks from most recent previous day
                });
            });
        });
    });
});
app.post('/api/tasks', (req, res) => {
    const { date, tasks } = req.body;
    console.log(`[Backend] Received /api/tasks POST for date: ${date}, tasks count: ${tasks.length}`);
    if (!date || !tasks) {
        console.error('[Backend] /api/tasks POST: Missing date or tasks in request body.');
        return res.status(400).json({ error: 'Data missing' });
    }

    appDb.serialize(() => {
        // Step 1: Delete existing tasks for this date
        appDb.run('DELETE FROM tasks WHERE date = ?', [date], function(err) {
            if (err) {
                console.error(`[Backend] Error deleting tasks for date ${date}:`, err.message);
                // Even on error, try to proceed with state update if this.changes isn't defined
            }
            console.log(`[Backend] Deleted ${this ? this.changes : 'N/A'} existing tasks for date ${date}.`);

            // Step 2: Update task_day_states to record if this day is explicitly empty
            const isExplicitlyEmpty = tasks.length === 0 ? 1 : 0;
            appDb.run('INSERT OR REPLACE INTO task_day_states (date, is_explicitly_empty) VALUES (?, ?)', 
                      [date, isExplicitlyEmpty], function(err) {
                if (err) {
                    console.error(`[Backend] Error updating task_day_states for date ${date}:`, err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log(`[Backend] task_day_states updated for ${date}: explicitly empty = ${isExplicitlyEmpty}.`);

                if (tasks.length === 0) {
                    console.log(`[Backend] No tasks to insert for date ${date}. Save complete.`);
                    return res.json({ message: 'Saved (no tasks to insert)' });
                }
                
                // Step 3: Insert or replace new tasks for this date
                const stmt = appDb.prepare('INSERT OR REPLACE INTO tasks (id, content, quadrant, date, completed, deleted_on) VALUES (?, ?, ?, ?, ?, ?)');
                tasks.forEach(t => stmt.run(t.id, t.content, t.quadrant, date, t.completed ? 1 : 0, t.deletedOn || null));
                stmt.finalize(function(err) {
                    if (err) {
                        console.error(`[Backend] Error inserting tasks for date ${date}:`, err.message);
                        return res.status(500).json({ error: err.message });
                    }
                    console.log(`[Backend] Inserted ${this ? this.changes : 'N/A'} new tasks for date ${date}. Save complete.`);
                    res.json({ message: 'Saved' });
                });
            });
        });
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

// SPA Fallback (After all API routes)
const PUBLIC_DIR_FALLBACK = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR_FALLBACK)) {
    app.get('*', (req, res) => {
        res.sendFile(path.join(PUBLIC_DIR_FALLBACK, 'index.html'));
    });
}

// --- SERVER STARTUP ---
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        if(browserImporter && browserImporter.startScheduledImport) {
            browserImporter.startScheduledImport(appDb);
        }
    });
};

// CRITICAL FIX: Ensure Import finishes before server starts to prevent DB Locked errors
if(browserImporter && browserImporter.performBrowserDataImport) {
    console.log('[Main] Running initial browser data import...');
    browserImporter.performBrowserDataImport(appDb)
        .then(() => {
            console.log('[Main] Initial import completed.');
            startServer();
        })
        .catch(err => {
            console.error('[Main] Initial import encountered an error (continuing startup):', err);
            startServer();
        });
} else {
    startServer();
}