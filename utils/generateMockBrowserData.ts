import { BrowserHistoryEntry, BrowserBookmarkEntry } from '../types';

export const generateMockBrowserHistory = (count: number): BrowserHistoryEntry[] => {
  const mockHistory: BrowserHistoryEntry[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
    mockHistory.push({
      id: `history-${i}`,
      url: `https://mockhistory.com/page/${i}`,
      title: `Mock History Page ${i}`,
      visitCount: Math.floor(Math.random() * 10) + 1,
      lastVisitTime: timestamp,
      source: Math.random() > 0.5 ? 'firefox' : 'chrome',
    });
  }
  return mockHistory;
};

export const generateMockBrowserBookmarks = (count: number): BrowserBookmarkEntry[] => {
  const mockBookmarks: BrowserBookmarkEntry[] = [];
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(); // Last year
    mockBookmarks.push({
      id: `bookmark-${i}`,
      url: `https://mockbookmark.com/page/${i}`,
      title: `Mock Bookmark Page ${i}`,
      dateAdded: timestamp,
      source: Math.random() > 0.5 ? 'firefox' : 'chrome',
    });
  }
  return mockBookmarks;
};
