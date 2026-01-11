const express = require('express');
const router = express.Router();

module.exports = (appDb) => {

    // --- IDENTITIES ---

    router.get('/identities', (req, res) => {
        appDb.all('SELECT * FROM identities', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                const identities = rows.map(row => ({
                    ...row,
                    experience: JSON.parse(row.experience || '[]'),
                    education: JSON.parse(row.education || '[]'),
                    skills: JSON.parse(row.skills || '[]'),
                    personalCredentials: JSON.parse(row.personalCredentials || '[]'),
                    linkedVaultIds: JSON.parse(row.linkedVaultIds || '[]')
                }));
                res.json(identities);
            } catch (parseError) {
                console.error("[API] Identity Parse Error:", parseError);
                res.status(500).json({ error: "Data corruption detected in identities." });
            }
        });
    });

    router.post('/identities', (req, res) => {
        const id = `id_${Date.now()}`;
        const { firstName, lastName, username, headline, email, phone, location, about, avatarUrl, bannerUrl, experience, education, skills, personalCredentials, linkedVaultIds, connections } = req.body;
        
        const sql = `INSERT INTO identities (id, firstName, lastName, username, headline, email, phone, location, about, avatarUrl, bannerUrl, experience, education, skills, personalCredentials, linkedVaultIds, connections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [id, firstName, lastName, username, headline, email, phone, location, about, avatarUrl, bannerUrl, JSON.stringify(experience), JSON.stringify(education), JSON.stringify(skills), JSON.stringify(personalCredentials), JSON.stringify(linkedVaultIds), connections];

        appDb.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id });
        });
    });

    router.put('/identities/:id', (req, res) => {
        const { firstName, lastName, username, headline, email, phone, location, about, avatarUrl, bannerUrl, experience, education, skills, personalCredentials, linkedVaultIds, connections } = req.body;
        
        const sql = `UPDATE identities SET firstName = ?, lastName = ?, username = ?, headline = ?, email = ?, phone = ?, location = ?, about = ?, avatarUrl = ?, bannerUrl = ?, experience = ?, education = ?, skills = ?, personalCredentials = ?, linkedVaultIds = ?, connections = ? WHERE id = ?`;
        const params = [firstName, lastName, username, headline, email, phone, location, about, avatarUrl, bannerUrl, JSON.stringify(experience), JSON.stringify(education), JSON.stringify(skills), JSON.stringify(personalCredentials), JSON.stringify(linkedVaultIds), connections, req.params.id];

        appDb.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
        });
    });

    router.delete('/identities/:id', (req, res) => {
        appDb.run('DELETE FROM identities WHERE id = ?', req.params.id, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted' });
        });
    });

    // --- CREDENTIAL GROUPS ---

    router.get('/credential-groups', (req, res) => {
        appDb.all('SELECT * FROM credential_groups', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                const groups = rows.map(row => ({
                    ...row,
                    pairs: JSON.parse(row.pairs || '[]')
                }));
                res.json(groups);
            } catch (e) {
                res.json([]);
            }
        });
    });

    router.post('/credential-groups', (req, res) => {
        const id = `group_${Date.now()}`;
        const { name, description, pairs, updatedAt } = req.body;
        
        appDb.run(`INSERT INTO credential_groups (id, name, description, pairs, updatedAt) VALUES (?, ?, ?, ?, ?)`,
            [id, name, description, JSON.stringify(pairs), updatedAt],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id });
            }
        );
    });

    router.put('/credential-groups/:id', (req, res) => {
        const { name, description, pairs, updatedAt } = req.body;
        
        appDb.run(`UPDATE credential_groups SET name = ?, description = ?, pairs = ?, updatedAt = ? WHERE id = ?`,
            [name, description, JSON.stringify(pairs), updatedAt, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Updated' });
            }
        );
    });

    router.delete('/credential-groups/:id', (req, res) => {
        appDb.run('DELETE FROM credential_groups WHERE id = ?', req.params.id, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted' });
        });
    });

    return router;
};