import { CalendarEvent } from "../services/calendarService";

const COLORS = [
    '#B91C1C', // Red 700
    '#C2410C', // Orange 700
    '#B45309', // Amber 700
    '#15803D', // Green 700
    '#047857', // Emerald 700
    '#0F766E', // Teal 700
    '#0369A1', // Sky 700
    '#1D4ED8', // Blue 700
    '#4338CA', // Indigo 700
    '#6D28D9', // Violet 700
    '#7E22CE', // Purple 700
    '#A21CAF', // Fuchsia 700
    '#BE185D', // Pink 700
    '#9F1239'  // Rose 700
];

const STOP_WORDS = new Set([
    'the', 'at', 'in', 'on', 'with', 'for', 'to', 'and', 'a', 'of', 'is', 'are', 
    'my', 'by', 'it', 'via', 'from', 'an', 'as', 'be', 'do', 'go', 'if', 'me', 
    'no', 'ok', 'or', 'so', 'up', 'we'
]);

/**
 * Generates a consistent index from a string to pick a color.
 */
const getHashIndex = (str: string, max: number): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % max);
};

/**
 * Assigns a color based on the event title hash.
 * This ensures identical titles always get the same color.
 */
export const assignTitleBasedColor = (event: CalendarEvent): CalendarEvent => {
    const key = event.title ? event.title.trim() : (event.id || 'unknown').toString();
    const colorIndex = getHashIndex(key, COLORS.length);
    
    return {
        ...event,
        color: COLORS[colorIndex]
    };
};

/**
 * Advanced function to scan event titles, extract keywords,
 * group events by these keywords, and assign consistent colors to each group.
 *
 * Logic:
 * 1. Tokenize all titles.
 * 2. Count frequency of meaningful words (keywords).
 * 3. Identify keywords appearing in >= 2 events.
 * 4. Assign a consistent color to each keyword.
 * 5. For each event, if it contains a keyword, use that color.
 *    Prioritize the most specific (longest) keyword if multiple match.
 * 6. Fallback to title-based hashing.
 */
export const assignGroupedColors = (events: CalendarEvent[]): CalendarEvent[] => {
    const wordCounts: { [word: string]: number } = {};
    const eventsByWord: { [word: string]: CalendarEvent[] } = {};

    // 1. Analyze frequencies
    events.forEach(event => {
        if (!event.title) return;
        
        // Normalize: lowercase, remove special chars, split by space
        const words = event.title.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w));

        // Count unique words per event (don't double count "Project Project")
        const uniqueWords = new Set(words);
        uniqueWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
    });

    // 2. Determine "Keywords" (Frequency >= 2)
    // Sort keywords by frequency (desc) then length (desc) to prioritize strong groups
    const keywords = Object.keys(wordCounts)
        .filter(word => wordCounts[word] >= 2)
        .sort((a, b) => {
            const freqDiff = wordCounts[b] - wordCounts[a];
            if (freqDiff !== 0) return freqDiff;
            return b.length - a.length; // Secondary sort: longer words
        });

    // 3. Map Keywords to Colors (Consistent hashing for keywords)
    const keywordColors: { [word: string]: string } = {};
    keywords.forEach(word => {
        const colorIndex = getHashIndex(word, COLORS.length);
        keywordColors[word] = COLORS[colorIndex];
    });

    // 4. Assign Colors
    return events.map(event => {
        if (!event.title) return assignTitleBasedColor(event);

        const lowerTitle = event.title.toLowerCase();
        
        // Find the first matching keyword (since they are sorted by importance)
        const matchedKeyword = keywords.find(keyword => {
            // Ensure full word match (e.g., "win" shouldn't match "winter")
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(lowerTitle);
        });

        if (matchedKeyword) {
            return {
                ...event,
                color: keywordColors[matchedKeyword]
                // Optional: We could add a 'groupLabel' property here if the UI supported it
            };
        }

        // Fallback: Title-based color
        return assignTitleBasedColor(event);
    });
};