import nlp from 'https://esm.sh/compromise@14';

// 1. Rainbow Color Generator
export const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    // Adjusted for dark mode visibility: High saturation, mid-lightness
    return `hsl(${h}, 70%, 60%)`; 
};

// 2. Generic Blocklist to prevent "garbage" tags
const TAG_BLOCKLIST = new Set([
    'note', 'notes', 'memo', 'memos', 'test', 'testing', 'input', 'inputs', 
    'output', 'outputs', 'example', 'sample', 'demo',
    'thing', 'things', 'way', 'ways', 'stuff',
    'date', 'time', 'day', 'today', 'tomorrow', 'yesterday',
    'text', 'string', 'file', 'folder', 'data', 'content',
    'start', 'end', 'next', 'prev', 'previous',
    'make', 'create', 'add', 'remove', 'delete', 'update',
    'check', 'todo', 'task', 'list', 'items'
]);

export const generateAutoTags = (content: string, existingTags: string[] = []): string[] => {
    const tags = new Set<string>(existingTags);
    
    // 1. Structural/Format Detection
    if (/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i.test(content)) tags.add('image');
    if (/```[\s\S]*?```/.test(content)) tags.add('snippet');
    if (/(^|\n)#{1,6}\s/.test(content)) tags.add('heading');
    if (/- \[[ x]\]/.test(content)) tags.add('checklist');
    
    // 2. Explicit User Hashtags (e.g. "Meeting with #JohnDoe")
    const explicitHashtags = content.match(/#[a-zA-Z0-9-_]+/g);
    if (explicitHashtags) {
        explicitHashtags.forEach(t => tags.add(t.substring(1).toLowerCase()));
    }

    // 3. NLP Extraction
    const doc = nlp(content);

    // A. Named Entities / Topics (People, Organizations, Places)
    const topics = doc.topics().out('array');
    topics.forEach((topic: string) => {
        // Hyphenate multi-word entities: "New York" -> "new-york"
        const clean = topic.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (clean.length > 2 && !TAG_BLOCKLIST.has(clean)) {
            tags.add(clean);
        }
    });

    // B. General Nouns
    const nouns = doc.nouns().out('array');
    nouns.forEach((phrase: string) => {
        // Split phrases: "Design system" -> "design", "system"
        const words = phrase.split(/\s+/);
        words.forEach(w => {
            const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Filter: Length > 3, not numeric, not in blocklist
            if (clean.length > 3 && isNaN(Number(clean)) && !TAG_BLOCKLIST.has(clean)) {
                tags.add(clean);
            }
        });
    });

    // 4. Return sorted, unique, limited to 6
    return Array.from(tags).slice(0, 6);
};