// utils.js (CommonJS format)

const { browserPaths } = require('./config'); // Adjusted path and CommonJS require

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const isToday = (date) => isSameDay(date, new Date());

const formatUrl = (urlString) => {
    try {
        const url = new URL(urlString);
        return (url.hostname + url.pathname).replace(/^www\./, '').replace(/\/$/, '');
    } catch {
        return urlString;
    }
};

const CODE_BLOCK_REGEX = /^\s*```(\w+)?\n([\s\S]+?)\n```\s*$/;

const blocksToMarkdown = (blocks) => {
    return blocks.map(block => {
        const content = block.content;

        switch (block.type) {
            case 'h1': return `# ${content}`;
            case 'h2': return `## ${content}`;
            case 'h3': return `### ${content}`;
            case 'checklist': return `- [${block.checked ? 'x' : ' '}] ${content}`;
            case 'code': return `\
${content}\
`;
            case 'ul': return `* ${content}`;
            case 'ol': return `1. ${content}`;
            case 'blockquote': return `> ${content}`;
            case 'paragraph':
            default: return content;
        }
    }).join('\n\n');
};

const getPlatform = () => {
  const isWindows = navigator.platform.startsWith('Win');
  const isWSL = isWindows && (navigator.userAgent.includes('WSL') || navigator.userAgent.includes('Windows NT'));
  
  if (isWSL) return 'wsl';
  if (isWindows) return 'windows';
  return 'linux';
};

// Client-side friendly path resolver (simplified)
const resolveBrowserPath = (pathString, platform) => {
  let resolvedPath = pathString;

  if (platform === 'windows') {
    resolvedPath = resolvedPath.replace(/%APPDATA%/g, 'C:\\Users\\<your-user>\\AppData\\Roaming');
    resolvedPath = resolvedPath.replace(/%LOCALAPPDATA%/g, 'C:\\Users\\<your-user>\\AppData\\Local');
  } else {
    resolvedPath = resolvedPath.replace(/^~/, '/home/<your-user>');
  }

  if (platform === 'wsl' && resolvedPath.startsWith('/mnt/')) {
    const driveLetter = resolvedPath.charAt(5).toUpperCase();
    resolvedPath = driveLetter + ':' + resolvedPath.substring(6).replace(/\//g, '\\');
  } else if (platform === 'windows' && resolvedPath.match(/^[A-Z]:\\/i)) {
      const driveLetter = resolvedPath.charAt(0).toLowerCase();
      resolvedPath = `/mnt/${driveLetter}${resolvedPath.substring(2).replace(/\\/g, '/')}`;
  }

  return resolvedPath;
};

const getServerUrl = () => {
  // In development, the backend runs on port 3001
  // In production, it might be served from the same domain
  // This cannot use import.meta.env.DEV in a CommonJS file,
  // so we'll need to pass an environment variable from Node.js or a fixed value.
  // For now, let's assume it's always development for the backend.
  return 'http://localhost:3001'; // Fixed for backend context
};

// --- Browser Data Transformation ---
const transformHistoryToMemo = (entry) => ({
  id: Date.now() + Math.random(),
  timestamp: entry.lastVisitTime,
  type: 'text',
  content: `Visited: [${entry.title || entry.url}](${entry.url}) - (Source: ${entry.source}, Visits: ${entry.visitCount})`,
  tags: ['history', entry.source],
});

const transformBookmarkToBookmark = (entry) => ({
  id: entry.id,
  url: entry.url,
  title: entry.title,
  description: `Source: ${entry.source}`,
  timestamp: entry.dateAdded,
});

module.exports = {
  isSameDay,
  isToday,
  formatUrl,
  CODE_BLOCK_REGEX,
  blocksToMarkdown,
  getPlatform,
  resolveBrowserPath,
  getServerUrl,
  transformHistoryToMemo,
  transformBookmarkToBookmark,
};