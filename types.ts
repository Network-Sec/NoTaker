export interface Memo {
  id: number;
  timestamp: string; // ISO string
  type: 'text' | 'image' | 'link'; // Added 'link' type
  content: string; // text content, base64 data URL, or the raw URL for link type
  tags: string[];
  linkPreview?: LinkPreviewData; // Optional link preview data
}

export interface Bookmark {
    id: string;
    url: string;
    title: string;
    description: string;
    timestamp: string;
}

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'checklist' | 'code' | 'ul' | 'ol' | 'blockquote';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}
 
export interface Notebook {
  id: number;
  title: string;
  timestamp: string;
  blocks: Block[];
  cells?: any[]; // for migration
}

export type StreamItem = (Memo & { itemType: 'memo' }) | (Bookmark & { itemType: 'bookmark' }) | (BrowserHistoryEntry & { itemType: 'history'; timestamp: string; }); // Updated StreamItem

export interface StreamCluster {
    clusterTime: string;
    items: StreamItem[];
}

export type EisenhowerQuadrant = 'important-urgent' | 'important-not-urgent' | 'unimportant-urgent' | 'unimportant-not-urgent';

export interface Task {
    id: string;
    content: string;
    quadrant: EisenhowerQuadrant;
    completed: boolean; // New: To track if a task is completed
}

// FIX: Add Cell and CellType exports for JupyterEditor.tsx
export type CellType = 'code' | 'markdown';

export interface Cell {
  id: string;
  type: CellType;
  content: string;
  isRunning?: boolean;
  output?: string;
}

// New interfaces for browser data
export interface BrowserHistoryEntry {
  id: string;
  url: string;
  title: string;
  visit_time: string; // Corrected to match db and usage
  source: 'firefox' | 'chrome';
}

export interface BrowserBookmarkEntry {
  id: string;
  url: string;
  title: string;
  dateAdded: string; // ISO string
  source: 'firefox' | 'chrome';
}

export interface Event {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  time: string; // HH:mm
  duration?: string; // e.g., "1h 30m"
  link?: string;
}

// New types for interleaved right-side content
export interface InterleavedTimestampMarker {
  id: string; // Unique ID for React key
  type: 'timestamp-marker';
  timestamp: string;
  label: string;
}

export interface LinkPreviewData {
  url: string; // Original URL
  title?: string; // og:title, twitter:title, <title>
  description?: string; // og:description, twitter:description, <meta name="description">
  imageUrl?: string; // og:image, twitter:image
  faviconUrl?: string; // <link rel="icon">
  siteName?: string; // og:site_name
  mediaType?: string; // og:type (e.g., article, video, website)
  videoUrl?: string; // og:video:url, twitter:player
  keywords?: string; // <meta name="keywords">
  // Additional comprehensive metadata fields
  ogTags?: Record<string, string>; // All Open Graph tags
  twitterTags?: Record<string, string>; // All Twitter Card tags
  metaTags?: Record<string, string>; // All other <meta name="..."> tags
  linkTags?: Array<{ rel: string; href: string; type?: string; sizes?: string }>; // All <link> tags (e.g., canonical, alternate, icons)
}

export type RightSideContentItem = Bookmark | BrowserHistoryEntry; // Renamed for clarity

export type InterleavedRightSideItem = RightSideContentItem | InterleavedTimestampMarker;

export type MainView = 'dashboard' | 'gallery' | 'notebooks' | 'bookmarks' | 'ai-notes' | 'toolbox' | 'full-calendar' | 'knowledge-graph' | 'settings' | 'identity-overview'; // Added 'identity-overview'

export interface AIConversationItem {
  id: number;
  timestamp: string; // ISO string
  type: 'user' | 'ai';
  content: string;
  model?: string; // Which AI model was used
}

// New interface for SettingsView configuration
export interface SettingsConfig {
  firefox?: {
    winProfileDir?: string;
    winPlaces?: string;
    winFavicons?: string;
    wslProfileDir?: string;
    wslPlaces?: string;
    wslFavicons?: string;
  };
  chrome?: {
    winUserData?: string;
    wslUserData?: string;
    profiles?: string; // comma separated
  };
  ai?: {
    ollamaUrl?: string;
    ollamaModel?: string;
  };
  general?: {
    importInterval?: number;
    darkMode?: boolean;
    autoScroll?: boolean;
  };
  generic?: {
    [key: string]: string | boolean; // For generic inputs/switches (input1, switch1, etc.)
  };
}

// --- Interfaces from @extDev/types.ts ---
export interface Experience {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  startDate: string;
  endDate: string; // or 'Present'
  location: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  logoUrl?: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface CredentialPair {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface Identity {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  about: string;
  avatarUrl: string;
  bannerUrl: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  personalCredentials: CredentialPair[]; // Personal keys/ids
  linkedVaultIds?: string[]; // IDs of SharedCredentialGroups linked to this profile
  connections: number;
}

export interface SharedCredentialGroup {
  id: string;
  name: string;
  description: string;
  pairs: CredentialPair[];
  updatedAt: string;
}

export type ViewState = 
  | { type: 'overview' }
  | { type: 'identity-detail'; id: string }
  | { type: 'creds-detail'; id: string };
