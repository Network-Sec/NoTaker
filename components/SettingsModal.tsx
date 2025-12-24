import React from 'react';
import type { BrowserPaths } from '../config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  importInterval: number;
  onImportIntervalChange: (interval: number) => void;
  browserPathsConfig: BrowserPaths;
  onBrowserPathsConfigChange: (newConfig: BrowserPaths) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  importInterval,
  onImportIntervalChange,
  browserPathsConfig,
  onBrowserPathsConfigChange,
}) => {
  if (!isOpen) return null;

  // For now, simple text display
  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-content">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="icon-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div className="settings-modal-body">
          <h3>Browser Import Settings</h3>
          <p>Import Interval: {importInterval} minutes</p>
          {/* Placeholder for input field */}
          <p>Chrome User Data Dir (Windows): {browserPathsConfig.windows.chrome.userDataDir}</p>
          <p>Chrome Profile Names: {browserPathsConfig.windows.chrome.profileNames.join(', ')}</p>
          <p>Firefox Profile Dir (Windows): {browserPathsConfig.windows.firefox.profileDir}</p>
        </div>
        <div className="settings-modal-footer">
          <button className="primary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
