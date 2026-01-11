async function getGraphData(db) {
    // Ensure db object is valid
    if (!db || typeof db.all !== 'function') {
        throw new Error("Invalid database object provided.");
    }

    const dbAllPromise = (sql, params) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("DB Error:", err);
                reject(err);
            }
            resolve(rows || []);
        });
    });

    // Use Promise.all to fetch in parallel, provide empty arrays as fallback
    const [memos, bookmarks, history] = await Promise.all([
        dbAllPromise('SELECT tags FROM memos', []),
        dbAllPromise('SELECT title FROM bookmarks', []),
        dbAllPromise('SELECT title FROM history', [])
    ]);

    const tagCounts = {};
    const nodes = [];
    const links = new Set();

    // Process memo tags
    if (memos) {
        memos.forEach(memo => {
            try {
                const tags = JSON.parse(memo.tags);
                if (tags && Array.isArray(tags) && tags.length > 0) {
                    tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                    for (let i = 0; i < tags.length; i++) {
                        for (let j = i + 1; j < tags.length; j++) {
                            const link = [tags[i], tags[j]].sort().join('-');
                            links.add(link);
                        }
                    }
                }
            } catch (e) {
                // Ignore memos with invalid JSON in tags
            }
        });
    }

    // Add tags as nodes
    for (const tag in tagCounts) {
        nodes.push({ id: tag, value: tagCounts[tag] });
    }

    // Process bookmarks and history for tag connections
    const allItems = [...(bookmarks || []), ...(history || [])];
    allItems.forEach(item => {
        if (item && item.title) {
            const itemTags = Object.keys(tagCounts).filter(tag => 
                item.title.toLowerCase().includes(tag.toLowerCase())
            );

            if (itemTags.length > 1) {
                for (let i = 0; i < itemTags.length; i++) {
                    for (let j = i + 1; j < itemTags.length; j++) {
                        const link = [itemTags[i], itemTags[j]].sort().join('-');
                        links.add(link);
                    }
                }
            }
        }
    });

    const finalLinks = Array.from(links).map(link => {
        const [source, target] = link.split('-');
        return { source, target };
    });

    // Collect all tags that are sources or targets of links
    const allLinkedTags = new Set();
    finalLinks.forEach(link => {
        allLinkedTags.add(link.source);
        allLinkedTags.add(link.target);
    });

    // Ensure all linked tags are also present as nodes
    allLinkedTags.forEach(tag => {
        if (!tagCounts[tag]) {
            tagCounts[tag] = 0; // Initialize count for tags only found in links
        }
    });
    
    // Clear and re-add nodes to include any newly discovered linked tags
    nodes.length = 0;
    for (const tag in tagCounts) {
        nodes.push({ id: tag, value: tagCounts[tag] });
    }

    return { nodes, links: finalLinks };
}

module.exports = { getGraphData };
