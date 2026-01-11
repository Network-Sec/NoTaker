const express = require('express');
const router = express.Router();

module.exports = (appDb) => {

    // GET /api/notebooks
    router.get('/', (req, res) => {
        appDb.all('SELECT * FROM notebooks', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const nbs = rows.map(r => {
                let parsedBlocks = [];
                try {
                    parsedBlocks = JSON.parse(r.blocks || '[]');
                } catch (parseError) {
                    console.error(`[API] Error parsing blocks for notebook ID ${r.id}:`, parseError.message);
                }
                return {...r, blocks: parsedBlocks};
            });
            res.json(nbs);
        });
    });

    // PUT /api/notebooks - ROBUST TRANSACTION HANDLING
    router.put('/', (req, res) => {
        const notebooks = req.body;
        
        // Input validation
        if (!Array.isArray(notebooks)) {
            return res.status(400).json({ error: "Invalid payload: notebooks must be an array." });
        }

        // We use serialize to ensure the sequence: BEGIN -> DELETE -> INSERT(s) -> COMMIT
        appDb.serialize(() => {
            // 1. Start Transaction
            appDb.run('BEGIN TRANSACTION', (beginErr) => {
                if (beginErr) {
                    console.error("[API] Notebooks Transaction Begin Error:", beginErr.message);
                    return res.status(500).json({ error: "DB Busy" });
                }

                const rollback = (errorMsg, clientRes) => {
                    console.error(`[API] Notebooks Error: ${errorMsg}. Rolling back.`);
                    appDb.run('ROLLBACK', () => {
                        if (!clientRes.headersSent) {
                            clientRes.status(500).json({ error: errorMsg });
                        }
                    });
                };

                // 2. Clear existing table
                appDb.run('DELETE FROM notebooks', (delErr) => {
                    if (delErr) return rollback(delErr.message, res);

                    // 3. If empty, commit and exit
                    if (notebooks.length === 0) {
                        appDb.run('COMMIT', (commitErr) => {
                            if (commitErr) return rollback(commitErr.message, res);
                            return res.json({ message: 'All notebooks deleted.' });
                        });
                        return;
                    }

                    // 4. Insert all notebooks
                    const stmt = appDb.prepare('INSERT INTO notebooks (id, title, timestamp, blocks, parent_id) VALUES (?, ?, ?, ?, ?)');
                    
                    let insertErrors = null;

                    notebooks.forEach(nb => {
                        stmt.run(nb.id, nb.title, nb.timestamp, JSON.stringify(nb.blocks), nb.parentId || null, (err) => {
                            if (err) insertErrors = err;
                        });
                    });

                    stmt.finalize((finalizeErr) => {
                        if (finalizeErr || insertErrors) {
                            return rollback(finalizeErr ? finalizeErr.message : insertErrors.message, res);
                        }

                        // 5. Commit
                        appDb.run('COMMIT', (commitErr) => {
                            if (commitErr) return rollback(commitErr.message, res);
                            res.json({ message: 'Notebooks saved successfully.', count: notebooks.length });
                        });
                    });
                });
            });
        });
    });

    return router;
};