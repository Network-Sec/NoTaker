import React from 'react';

export const AiNotesView = ({ onAddMemo }) => {
    return (
        <div className="page-container">
            <h1>AI Notes</h1>
            <div className="ai-notes-view">
                <div className="no-items-placeholder">
                    <h2>AI Features Coming Soon</h2>
                    <p>Local Ollama integration is planned for a future update.</p>
                </div>
            </div>
        </div>
    );
}; 