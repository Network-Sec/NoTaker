
import React from 'react';
import type { MainView } from '../types';

interface IconSidebarProps {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  setCenterContentMode: (mode: 'memo' | 'ai_conv') => void;
  centerContentMode: 'memo' | 'ai_conv'; // Add this line
} 

export const IconSidebar = ({ mainView, setMainView, setCenterContentMode, centerContentMode }: IconSidebarProps) => (
    <div className="icon-sidebar">
        <button className={`icon-button ${mainView === 'dashboard' && centerContentMode === 'memo' ? 'active' : ''}`} title="Dashboard" onClick={() => { setMainView('dashboard'); setCenterContentMode('memo'); }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        </button>
         <button className={`icon-button ${mainView === 'notebooks' ? 'active' : ''}`} title="Notebooks" onClick={() => setMainView('notebooks')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
        </button>
        <button className={`icon-button ${mainView === 'bookmarks' ? 'active' : ''}`} title="Bookmarks" onClick={() => setMainView('bookmarks')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <button className={`icon-button ${mainView === 'gallery' ? 'active' : ''}`} title="Gallery" onClick={() => setMainView('gallery')}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zM11 9l2.5 4L17 9l4 8H3l4-5.33zM2 20h20v2H2v-2z"/></svg>
        </button>
        <button className={`icon-button ${mainView === 'full-calendar' ? 'active' : ''}`} title="Full Calendar" onClick={() => setMainView('full-calendar')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5z"/></svg>
        </button>
        <button className={`icon-button ${mainView === 'knowledge-graph' ? 'active' : ''}`} title="Knowledge Graph" onClick={() => setMainView('knowledge-graph')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.23-.09.46-.09.7s.04.47.09.7l-7.05 4.11c-.54-.5-1.25-.81-2.04-.81-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3c0-.24-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3z"/></svg>
        </button>
         <button className={`icon-button ${mainView === 'ai-notes' || (mainView === 'dashboard' && centerContentMode === 'ai_conv') ? 'active' : ''}`} title="AI Notes" onClick={() => { setMainView('dashboard'); setCenterContentMode('ai_conv'); }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5zm-5.5 5.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 13c-1.04 0-1.99-.41-2.73-1.09L5.09 6.27C5.59 5.04 6.74 4.13 8 3.74l7.64 7.64c.59.76 1.36 1.34 2.22 1.62h-.36zm-7-7c1.04 0 1.99.41 2.73 1.09l7.68 7.64c-.5 1.23-1.65 2.14-3.02 2.53L7.36 8.38c-.59-.76-1.36-1.34-2.22-1.62h.36z"/></svg>
        </button>
        <button className={`icon-button ${mainView === 'toolbox' ? 'active' : ''}`} title="Toolbox" onClick={() => setMainView('toolbox')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>
        </button>
    </div>
);