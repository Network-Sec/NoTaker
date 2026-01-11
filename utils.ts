import type { Block, Memo, Bookmark } from './types';
export const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const isToday = (date: Date) => isSameDay(date, new Date());

export const formatUrl = (urlString: string) => {
    try {
        const url = new URL(urlString);
        return (url.hostname + url.pathname).replace(/^www\./, '').replace(/\/$/, '');
    } catch {
        return urlString;
    }
};

export const CODE_BLOCK_REGEX = /^\s*```(\w+)?\n([\s\S]+?)\n```\s*$/;

export const blocksToMarkdown = (blocks: Block[]): string => {
    return blocks.map(block => {
        const content = block.content; // block.content is now assumed to be plain Markdown

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

export const getServerUrl = (): string => {
  // In development, the backend runs on port 3001
  // In production, it might be served from the same domain
  return import.meta.env.DEV ? 'http://localhost:3001' : '';
};

