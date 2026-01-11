export interface Memo {
    id: number;
    timestamp: string;
    type: 'text' | 'code' | 'markdown' | 'image';
    content: string;
    tags: string[];
    linkPreview?: LinkPreviewData;
}

export interface LinkPreviewData {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

export interface Notebook {
    id: number;
    title: string;
    timestamp: string;
    blocks: NotebookBlock[];
    rawMarkdownContent?: string; // New field to store raw markdown content for source editing
    parentId?: number | null; // For nested notebooks
}

export interface NotebookBlock {
    id: string;
    type: 'text' | 'code' | 'markdown' | 'image' | 'excalidraw';
    content: string;
}

export interface Bookmark {
    id: string;
    url: string;
    title: string;
    description?: string;
    timestamp: string;
    source?: string;
    itemType?: 'bookmark'; // Optional discriminator
}

export interface BrowserHistoryEntry {
    id: number | string;
    url: string;
    title: string;
    visit_time: string;
    source?: string;
    itemType?: 'history'; // Optional discriminator
}

export interface Task {
    id: string;
    content: string;
    quadrant: 'do' | 'decide' | 'delegate' | 'delete';
    date: string;
    completed: boolean;
    deletedOn?: string; // New field to mark task as deleted from this date forward
}

export interface Event {
    id: number;
    date: string;
    title: string;
    description: string;
    time: string;
    duration: string;
    link: string;
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
    about: string; // Markdown
    avatarUrl: string;
    bannerUrl: string;
    experience: Experience[];
    education: Education[];
    skills: string[];
    personalCredentials: CredentialPair[]; // Encrypted/Stored securely conceptually
    linkedVaultIds: string[];
    connections: number;
}

export interface Experience {
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Education {
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
}

export interface CredentialPair {
    id: string;
    key: string;
    value: string;
    isSecret: boolean;
}

export interface SharedCredentialGroup {
    id: string;
    name: string;
    description: string;
    pairs: CredentialPair[];
    updatedAt: string;
}

export interface AIConversationItem {
    id: number;
    timestamp: string;
    type: 'user' | 'assistant';
    content: string;
    model: string;
}

export interface ToolboxItem {
    id: number;
    title: string;
    url: string;
    description: string;
    iconUrl: string;
    imageUrl: string;
    timestamp: string;
}

// Settings Configuration
export interface SettingsConfig {
    firefox: {
        winProfileDir?: string;
        winPlaces?: string;
        winFavicons?: string;
        wslProfileDir?: string;
        wslPlaces?: string;
        wslFavicons?: string;
    };
    chrome: {
        winUserData?: string;
        wslUserData?: string;
        profiles?: string; // Comma separated
    };
    ai: {
        ollamaUrl?: string;
        ollamaModel?: string;
        defaultModel?: string; // Unified naming
    };
    general: {
        importInterval?: number;
    };
    generic: {
        [key: string]: any;
    };
}