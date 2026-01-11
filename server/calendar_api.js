const axios = require('axios');
const ical = require('ical.js');
const URL = require('url').URL;

// Simple in-memory cache: { url: { data: parsedEvents, timestamp: Date.now() } }
const icalCache = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Fetches and parses iCal data from a given URL with caching.
 * @param {string} icalUrl The URL of the iCal file.
 * @param {string} sourceId The ID of the source (to tag events).
 * @param {string} color The color of the source.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of parsed event objects.
 */
async function fetchAndParseIcal(icalUrl, sourceId, color, sourceName) {
    const now = Date.now();

    // 1. Check Cache
    if (icalCache[icalUrl] && (now - icalCache[icalUrl].timestamp < CACHE_TTL)) {
        console.log(`[CalendarAPI] Cache HIT for ${sourceName} (${icalUrl})`);
        // We need to re-map the sourceId/Color just in case they changed in DB but URL is same, 
        // but typically they stick with the URL. 
        // For safety, we map the cached events to ensure they have the current sourceId/Color requested.
        return icalCache[icalUrl].data.map(e => ({
            ...e,
            sourceId,
            sourceName,
            color
        }));
    }

    console.log(`[CalendarAPI] Cache MISS for ${sourceName} (${icalUrl})`);

    try {
        // Use axios to fetch the iCal content
        const response = await axios.get(icalUrl, { responseType: 'text' });
        
        if (response.status !== 200) {
            console.warn(`Failed to fetch iCal from ${icalUrl}: Status ${response.status}`);
            return [];
        }

        const icalText = response.data;
        const jcalData = ical.parse(icalText);
        const comp = new ical.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const events = [];
        vevents.forEach(vevent => {
            try {
                const event = new ical.Event(vevent);
                // Handle duration/end date
                let duration = '';
                if (event.duration) {
                     duration = event.duration.toString();
                }

                events.push({
                    id: `${sourceId}-${event.uid}`, // Composite ID
                    sourceId: sourceId,
                    sourceName: sourceName, 
                    title: event.summary,
                    date: event.startDate.toJSDate().toISOString(),
                    endDate: event.endDate ? event.endDate.toJSDate().toISOString() : null,
                    time: event.startDate.toJSDate().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    description: event.description || '',
                    location: event.location || '',
                    color: color,
                    isExternal: true,
                    allDay: event.startDate.isDate // Check if it is an all-day event
                });
            } catch (eventParseError) {
                // partial failure is acceptable for external feeds
            }
        });

        // 2. Update Cache
        icalCache[icalUrl] = {
            data: events,
            timestamp: now
        };

        return events;
    } catch (error) {
        console.error(`Error fetching or parsing iCal from ${icalUrl}:`, error.message);
        return [];
    }
}

/**
 * Sets up API routes for calendar event processing and source management.
 * @param {object} app The Express app instance.
 * @param {object} db The SQLite database instance.
 */
function setupCalendarApiRoutes(app, db) {
    
    // 1. Initialize Database Table for Sources
    db.run(`CREATE TABLE IF NOT EXISTS calendar_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        url TEXT UNIQUE, 
        name TEXT, 
        color TEXT, 
        type TEXT
    )`, (err) => {
        if (err) {
            console.error("[CalendarAPI] Error creating calendar_sources table:", err);
            return;
        }

        // 2. Sync with ENV
        const googleCalendarUrlsEnv = process.env.GOOGLE_CALENDAR_URLS;
        const envUrls = googleCalendarUrlsEnv 
            ? googleCalendarUrlsEnv.split(',').map(u => u.trim()).filter(u => u.length > 0)
            : [];

        db.all("SELECT id, url FROM calendar_sources WHERE type = 'google'", (err, rows) => {
            if (err) {
                console.error("[CalendarAPI] Error fetching existing sources for sync:", err);
                return;
            }

            const existingUrls = new Set(rows.map(r => r.url));
            const envUrlsSet = new Set(envUrls);

            // A. Remove stale sources (in DB but not in ENV)
            rows.forEach(row => {
                if (!envUrlsSet.has(row.url)) {
                    console.log(`[CalendarAPI] Removing stale calendar source: ${row.url}`);
                    db.run("DELETE FROM calendar_sources WHERE id = ?", [row.id], (delErr) => {
                        if (delErr) console.error(`[CalendarAPI] Failed to delete stale source ${row.id}:`, delErr);
                    });
                }
            });

            // B. Add new sources (in ENV but not in DB)
            envUrls.forEach(url => {
                if (!existingUrls.has(url)) {
                    const defaultName = new URL(url).pathname.split('/')[3] || 'External Calendar';
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    console.log(`[CalendarAPI] Adding new calendar source from ENV: ${defaultName}`);
                    db.run('INSERT INTO calendar_sources (url, name, color, type) VALUES (?, ?, ?, ?)', 
                        [url, decodeURIComponent(defaultName), randomColor, 'google'], 
                        (insErr) => {
                             if(insErr) console.error("[CalendarAPI] Failed to insert env calendar:", insErr.message);
                        }
                    );
                }
            });
        });
    });

    // --- ROUTES ---

    // Get all sources
    app.get('/api/calendar/sources', (req, res) => {
        db.all('SELECT * FROM calendar_sources', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

        // Add a source
        app.post('/api/calendar/sources', (req, res) => {
            const { url, name, color, type } = req.body;
    
            // Prevent adding 'google' type calendars via API, enforce ENV sync for them
            if (type === 'google') {
                return res.status(403).json({ error: "Google Calendar sources can only be managed via the GOOGLE_CALENDAR_URLS environment variable." });
            }
    
            db.run('INSERT INTO calendar_sources (url, name, color, type) VALUES (?, ?, ?, ?)',
                [url, name, color || '#3b82f6', type || 'ical'],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, url, name, color, type });
                }
            );
        });
    // Delete a source
    app.delete('/api/calendar/sources/:id', (req, res) => {
        db.run('DELETE FROM calendar_sources WHERE id = ?', req.params.id, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted' });
        });
    });

    // Aggregated Events Endpoint
    // Fetches local events AND fetches external iCals on the fly (caching could be added later)
    app.get('/api/calendar/unified-events', async (req, res) => {
        const { start, end } = req.query; // Optional date range filters

        // 1. Fetch Local Events
        const fetchLocal = new Promise((resolve, reject) => {
            db.all('SELECT * FROM events', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => ({
                    ...r,
                    sourceId: 'local',
                    sourceName: 'My Calendar',
                    color: '#e2e8f0', // Default local color
                    isExternal: false
                })));
            });
        });

        // 2. Fetch Sources
        const fetchSources = new Promise((resolve, reject) => {
            db.all('SELECT * FROM calendar_sources', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        try {
            const [localEvents, sources] = await Promise.all([fetchLocal, fetchSources]);
            
            // 3. Fetch External Events in Parallel
            const externalEventPromises = sources.map(source => 
                fetchAndParseIcal(source.url, source.id, source.color, source.name)
            );
            
            const externalEventsArrays = await Promise.all(externalEventPromises);
            const externalEvents = externalEventsArrays.flat();

            // 4. Combine
            const allEvents = [...localEvents, ...externalEvents];
            
            res.json(allEvents);

        } catch (error) {
            console.error("[CalendarAPI] Error aggregating events:", error);
            res.status(500).json({ error: "Failed to load calendar events" });
        }
    });
}

module.exports = setupCalendarApiRoutes;
