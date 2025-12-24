const express = require('express');
const router = express.Router();

module.exports = (appDb, ollama) => { // Accept appDb and ollama instance
    // GET all AI conversations
    router.get('/conversations', (req, res) => {
        appDb.all('SELECT * FROM ai_conversations ORDER BY timestamp ASC', (err, rows) => {
            if (err) {
                console.error("[API] GET /ai/conversations error:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    });

    // POST a new AI conversation turn (user input or AI response)
    router.post('/conversations', (req, res) => {
        const { timestamp, type, content, model } = req.body;
        appDb.run(`INSERT INTO ai_conversations (timestamp, type, content, model) VALUES (?, ?, ?, ?)`,
            [timestamp, type, content, model], function(err) {
            if (err) {
                console.error("[API] POST /ai/conversations error:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, timestamp, type, content, model });
        });
    });

    // POST a prompt to Ollama and get a response
    router.post('/chat', async (req, res) => {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Improved check to ensure ollama is a valid client with the chat method
        if (!ollama || typeof ollama.chat !== 'function') {
            console.error("[API] Ollama client is not valid:", ollama);
            return res.status(500).json({ error: 'Ollama client not properly initialized. Check server logs.' });
        }

        try {
            const response = await ollama.chat({
                model: process.env.OLLAMA_MODEL || 'gpt-oss:20b', // Use model from env or default
                messages: [{ role: 'user', content: prompt }],
                stream: false, // For now, non-streaming
            });
            
            const aiResponseContent = response.message.content;
            const aiModelUsed = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

            res.json({ response: aiResponseContent, model: aiModelUsed });

        } catch (error) {
            console.error("[API] Ollama chat error:", error);
            res.status(500).json({ error: 'Failed to get response from Ollama', details: error.message });
        }
    });

    return router;
};