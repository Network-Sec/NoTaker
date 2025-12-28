const fs = require('fs');
const fsPromises = require('fs').promises; // Use promises for non-blocking I/O
const path = require('path');
const dotenv = require('dotenv');

// Define paths
const envPath = path.resolve(__dirname, '.env');
const settingsJsonPath = path.resolve(__dirname, 'settings.json');

/**
 * UTILITY: Serializes an object into .env format.
 * Handles quoting for values with spaces, newlines, or special characters.
 */
function serializeEnv(envObj) {
    return Object.entries(envObj).map(([key, value]) => {
        // Ensure value is a string
        let stringValue = value === null || value === undefined ? '' : String(value);

        // Check if value needs quotes (spaces, newlines, #, or existing quotes)
        const needsQuotes = /[\s#'"\n]/.test(stringValue);

        if (needsQuotes) {
            // Escape existing double quotes and wrap in double quotes
            stringValue = `"${stringValue.replace(/"/g, '\\"')}"`;
        }

        return `${key}=${stringValue}`;
    }).join('\n');
}

/**
 * UTILITY: Business logic for parsing the raw env content
 * and handling specific type conversions (like Arrays).
 */
function parseEnvContent(rawContent) {
    const parsed = dotenv.parse(rawContent);
    const settings = {};

    for (const key in parsed) {
        // Special Handling: GOOGLE_CALENDAR_URLS -> Array
        if (key === 'GOOGLE_CALENDAR_URLS') {
            settings[key] = parsed[key]
                ? parsed[key].split(',').map(url => url.trim()).filter(url => url.length > 0)
                : [];
        } else {
            settings[key] = parsed[key];
        }
    }
    return settings;
}

/**
 * UTILITY: Business logic for preparing data to be saved.
 * Converts Arrays back to strings.
 */
function prepareEnvForSave(existingEnv, newUpdates) {
    // Merge existing with updates
    const merged = { ...existingEnv, ...newUpdates };
    const finalEnv = {};

    for (const key in merged) {
        let value = merged[key];

        // Special Handling: GOOGLE_CALENDAR_URLS Array -> String
        if (key === 'GOOGLE_CALENDAR_URLS' && Array.isArray(value)) {
            value = value.filter(url => url && typeof url === 'string' && url.length > 0).join(',');
        }

        finalEnv[key] = value;
    }
    
    return finalEnv;
}

/**
 * Sets up API routes for settings management.
 * @param {object} app The Express app instance.
 */
function setupSettingsRoutes(app) {

    // ---------------------------------------------------------
    // .ENV Settings Editor Routes
    // ---------------------------------------------------------

    // GET: Retrieve all .env settings
    app.get('/api/settingsEditor', async (req, res) => {
        try {
            // Check if file exists, if not, return empty object
            try {
                await fsPromises.access(envPath);
            } catch (e) {
                return res.json({});
            }

            const envFileContent = await fsPromises.readFile(envPath, 'utf8');
            const settings = parseEnvContent(envFileContent);
            
            res.json(settings);
        } catch (error) {
            console.error('Error reading .env file:', error);
            res.status(500).json({ message: 'Failed to read settings.' });
        }
    });

    // POST: Update .env settings (Upsert)
    app.post('/api/settingsEditor', async (req, res) => {
        try {
            const updates = req.body; // Expecting object { KEY: "Value", KEY2: ["Array"] }

            // 1. Read existing file to ensure we don't lose keys not included in the update
            let currentRaw = '';
            try {
                currentRaw = await fsPromises.readFile(envPath, 'utf8');
            } catch (e) {
                // File might not exist yet, which is fine
                currentRaw = '';
            }

            const currentParsed = dotenv.parse(currentRaw);

            // 2. Prepare the new object (Merge & Convert Types)
            const envObjectToSave = prepareEnvForSave(currentParsed, updates);

            // 3. Serialize to .env format (Handle escaping)
            const fileContent = serializeEnv(envObjectToSave);

            // 4. Write to disk
            await fsPromises.writeFile(envPath, fileContent, 'utf8');

            console.log('Successfully updated .env file.');
            res.status(200).json({ 
                message: 'Settings updated successfully. Server restart may be required for changes to take full effect.',
                updatedSettings: envObjectToSave
            });

        } catch (error) {
            console.error('Error updating .env file:', error);
            res.status(500).json({ message: 'Failed to update settings.' });
        }
    });

    // ---------------------------------------------------------
    // Legacy settings.json Routes (Kept As-Is)
    // ---------------------------------------------------------

    app.get('/api/settings', (req, res) => {
        fs.readFile(settingsJsonPath, 'utf8', (err, data) => {
            if (err) return res.json({ firefox: {}, chrome: {}, ai: {}, general: { importInterval: 30 }, generic: {} });
            try { res.json(JSON.parse(data)); } catch (e) { res.status(500).json({}); }
        });
    });

    app.put('/api/settings', (req, res) => {
        fs.writeFile(settingsJsonPath, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.json({ message: 'Saved' });
        });
    });
}

module.exports = setupSettingsRoutes;