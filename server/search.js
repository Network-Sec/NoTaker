async function searchAll(db, query) {
    // Ensure db object is valid
    if (!db || typeof db.all !== 'function') {
        throw new Error("Invalid database object provided.");
    }

    const searchQuery = `%${query}%`;

    const dbAllPromise = (sql, params) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("DB Error:", err);
                reject(err);
            }
            resolve(rows || []);
        });
    });

    // Use Promise.all to fetch in parallel
    const [memos, bookmarks, history] = await Promise.all([
        dbAllPromise('SELECT id, content, tags, timestamp FROM memos WHERE content LIKE ? OR tags LIKE ?', [searchQuery, searchQuery]),
        dbAllPromise('SELECT id, title, url, timestamp FROM bookmarks WHERE title LIKE ? OR url LIKE ?', [searchQuery, searchQuery]),
        dbAllPromise('SELECT id, title, url, visit_time as timestamp FROM history WHERE title LIKE ? OR url LIKE ?', [searchQuery, searchQuery])
    ]);

    const results = [
        ...(memos || []).map(m => ({ ...m, type: 'memo' })),
        ...(bookmarks || []).map(b => ({ ...b, type: 'bookmark' })),
        ...(history || []).map(h => ({ ...h, type: 'history' }))
    ];

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = { searchAll };
