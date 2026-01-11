const express = require('express');
const moment = require('moment'); // For date manipulation

function setupDailyCounterApiRoutes(app, db) {
    // Ensure tables exist
    db.serialize(() => {
        // Table for global configuration of the counter (e.g., initial values, start date)
        db.run(`CREATE TABLE IF NOT EXISTS daily_counters_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            startDate TEXT,
            initialVal1 REAL,
            initialVal2 REAL
        )`, (err) => {
            if (err) console.error("[DailyCounterAPI] Error creating daily_counters_config table:", err);
        });

        // Table for daily entries (user inputs)
        db.run(`CREATE TABLE IF NOT EXISTS daily_counter_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER,
            date TEXT,
            val1_input REAL,
            val2_input REAL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (config_id) REFERENCES daily_counters_config(id)
        )`, (err) => {
            if (err) console.error("[DailyCounterAPI] Error creating daily_counter_entries table:", err);
        });
    });

    // --- API ENDPOINTS ---

    // Get or create counter config
    app.get('/api/daily-counter/config', (req, res) => {
        db.get('SELECT * FROM daily_counters_config LIMIT 1', (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) {
                res.json(row);
            } else {
                // Return default/empty config if none exists, client can then create it
                res.json({ id: null, name: 'Coffee & Milk', startDate: moment().format('YYYY-MM-DD'), initialVal1: 100, initialVal2: 100 });
            }
        });
    });

    // Save/Update counter config
    app.post('/api/daily-counter/config', (req, res) => {
        const { name, startDate, initialVal1, initialVal2 } = req.body;
        db.run('INSERT OR REPLACE INTO daily_counters_config (id, name, startDate, initialVal1, initialVal2) VALUES ((SELECT id FROM daily_counters_config LIMIT 1), ?, ?, ?, ?)',
            [name, startDate, initialVal1, initialVal2],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.get('SELECT * FROM daily_counters_config LIMIT 1', (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json(row);
                });
            }
        );
    });

    // Get all daily entries for a config
    app.get('/api/daily-counter/entries', (req, res) => {
        const { config_id } = req.query; // Expect config_id
        if (!config_id) return res.status(400).json({ error: 'config_id is required' });

        db.all('SELECT * FROM daily_counter_entries WHERE config_id = ? ORDER BY date ASC, timestamp ASC', [config_id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // Add a new daily entry
    app.post('/api/daily-counter/entries', (req, res) => {
        const { config_id, date, val1_input, val2_input, timestamp } = req.body;
        if (!config_id || !date || (val1_input === undefined) || (val2_input === undefined)) {
            return res.status(400).json({ error: 'config_id, date, val1_input, and val2_input are required' });
        }

        const entryTimestamp = timestamp || new Date().toISOString();

        db.run('INSERT INTO daily_counter_entries (config_id, date, val1_input, val2_input, timestamp) VALUES (?, ?, ?, ?, ?)',
            [config_id, date, val1_input, val2_input, entryTimestamp],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, config_id, date, val1_input, val2_input, timestamp: entryTimestamp });
            }
        );
    });

    // Update an existing daily entry
    app.put('/api/daily-counter/entries/:id', (req, res) => {
        const { date, val1_input, val2_input, timestamp } = req.body;
        const { id } = req.params;
        if (!id || !date || (val1_input === undefined) || (val2_input === undefined)) {
            return res.status(400).json({ error: 'id, date, val1_input, and val2_input are required' });
        }

        // Build query dynamically based on whether timestamp is provided
        let query = 'UPDATE daily_counter_entries SET date = ?, val1_input = ?, val2_input = ?';
        let params = [date, val1_input, val2_input];

        if (timestamp) {
            query += ', timestamp = ?';
            params.push(timestamp);
        }

        query += ' WHERE id = ?';
        params.push(id);

        db.run(query, params,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Entry not found' });
                res.json({ id, date, val1_input, val2_input, timestamp, changes: this.changes });
            }
        );
    });

    // Get full counter state (config + calculated entries)
    app.get('/api/daily-counter/full-state', async (req, res) => {
        try {
            const config = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM daily_counters_config LIMIT 1', (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!config) {
                // Return default/empty config with no entries if none exists
                return res.json({
                    config: { id: null, name: 'Coffee & Milk', startDate: moment().format('YYYY-MM-DD'), initialVal1: 100, initialVal2: 100 },
                    entries: []
                });
            }

            const entries = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM daily_counter_entries WHERE config_id = ? ORDER BY date ASC, timestamp ASC', [config.id], (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            // Calculate totals
            const processedEntries = [];
            let currentVal1 = config.initialVal1;
            let currentVal2 = config.initialVal2;

            const startDateMoment = moment(config.startDate);

            // Group entries by date for display
            const entriesByDate = {};
            entries.forEach(entry => {
                if (!entriesByDate[entry.date]) {
                    entriesByDate[entry.date] = [];
                }
                entriesByDate[entry.date].push(entry);
            });

            // Iterate from startDate to today to ensure all days are represented, even if no entries
            const today = moment();
            let currentDate = moment(config.startDate);

            while (currentDate.isSameOrBefore(today, 'day')) {
                const dateKey = currentDate.format('YYYY-MM-DD');
                const dayEntries = entriesByDate[dateKey] || [];
                
                dayEntries.forEach(entry => {
                    currentVal1 -= entry.val1_input;
                    currentVal2 -= entry.val2_input;
                    processedEntries.push({
                        ...entry,
                        total1: parseFloat(currentVal1.toFixed(2)),
                        total2: parseFloat(currentVal2.toFixed(2)),
                    });
                });
                
                currentDate.add(1, 'day');
            }

            // If there are no entries at all, initialize with the config as the first "state"
            if (processedEntries.length === 0) {
                 processedEntries.push({
                    id: 'initial', // Special ID for initial state
                    config_id: config.id,
                    date: config.startDate,
                    val1_input: 0, // No input on day 0
                    val2_input: 0, // No input on day 0
                    timestamp: moment(config.startDate).toISOString(),
                    total1: config.initialVal1,
                    total2: config.initialVal2,
                 });
            }


            res.json({
                config: config,
                entries: processedEntries
            });

        } catch (error) {
            console.error("[DailyCounterAPI] Error fetching full state:", error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = setupDailyCounterApiRoutes;
