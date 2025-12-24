import React from 'react';

// --- MOCK DATA & CONSTANTS ---
const TOOLBOX_ITEMS = [
    { title: "AI Code Assistant", description: "Boost your productivity with an AI pair programmer.", url: "https://github.com/features/copilot", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg> },
    { title: "Image Generator", description: "Generate high-quality images from text prompts.", url: "https://www.midjourney.com/", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> },
    { title: "Presentation Maker", description: "Create stunning presentations from a simple prompt.", url: "https://gamma.app/", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 14h16v2H4v-2z"/></svg> },
    { title: "AI Writing Assistant", description: "Grammar checking, style editing, and content generation.", url: "https://www.grammarly.com/", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 4.93 16.24 6.34 9.22 13.36 7.8 11.95 6.39 13.36 9.22 16.19 17.65 7.75l1.41-1.41zM21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.31 0 4.41.87 6 2.3l-1.42 1.42C14.53 5.67 12.86 5 11 5c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7h-2l3-4 3 4h-2z"/></svg> },
    { title: "Diagramming Tool", description: "Create diagrams, wireframes, and flowcharts.", url: "https://www.figma.com/figjam/", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8c0-1.11-.89-2-2-2h-3V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H5c-1.11 0-2 .89-2 2v3H1v4c0 1.11.89 2 2 2h2v3c0 1.11.89 2 2 2h4c1.11 0 2-.89 2-2v-2h3c1.11 0 2-.89 2-2v-3h2v-4h-2V8z"/></svg> },
    { title: "Video Summarizer", description: "Get summaries of long videos in seconds.", url: "https://www.summarize.tech/", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 16.5v-9l6 4.5-6 4.5zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2z"/></svg> },
];

export const ToolboxView = () => (
    <div className="page-container">
        <h1>Toolbox</h1>
        <div className="toolbox-grid">
            {TOOLBOX_ITEMS.map(tool => (
                <a key={tool.title} href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-card">
                    <div className="tool-card-header"><div className="tool-card-icon">{tool.icon}</div><span className="tool-card-title">{tool.title}</span></div>
                    <p className="tool-card-description">{tool.description}</p>
                </a>
            ))} 
        </div>
    </div>
);