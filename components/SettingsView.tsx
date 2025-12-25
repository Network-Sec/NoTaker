import React, { useState } from 'react';
import type { BrowserPaths } from '../config';

interface SettingsViewProps {
  importInterval: number;
  onImportIntervalChange: (interval: number) => void;
  browserPathsConfig: BrowserPaths;
  onBrowserPathsConfigChange: (newConfig: BrowserPaths) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  importInterval,
  onImportIntervalChange,
  browserPathsConfig,
  onBrowserPathsConfigChange,
}) => {
    // Local state for form inputs to avoid excessive re-renders on every keystroke
    const [localInterval, setLocalInterval] = useState(importInterval);
    const [chromePath, setChromePath] = useState(browserPathsConfig.windows?.chrome?.userDataDir || '');
    const [firefoxPath, setFirefoxPath] = useState(browserPathsConfig.windows?.firefox?.profileDir || '');

    const handleSave = () => {
        onImportIntervalChange(localInterval);
        onBrowserPathsConfigChange({
            ...browserPathsConfig,
            windows: {
                ...browserPathsConfig.windows,
                chrome: {
                    ...browserPathsConfig.windows?.chrome,
                    userDataDir: chromePath
                },
                firefox: {
                    ...browserPathsConfig.windows?.firefox,
                    profileDir: firefoxPath
                }
            }
        });
        alert('Settings Saved');
    };

    return (
        <div className="page-container settings-view">
            <h1>System Settings</h1>
            
            <div className="settings-section">
                <h2>Import Configuration</h2>
                <div className="setting-item">
                    <label>Browser Import Interval (minutes)</label>
                    <input 
                        type="number" 
                        value={localInterval} 
                        onChange={(e) => setLocalInterval(Number(e.target.value))}
                        min="1"
                    />
                    <p className="setting-description">How often the app checks for new bookmarks and history.</p>
                </div>
            </div>

            <div className="settings-section">
                <h2>Data Paths (Windows)</h2>
                <div className="setting-item">
                    <label>Chrome User Data Directory</label>
                    <input 
                        type="text" 
                        value={chromePath} 
                        onChange={(e) => setChromePath(e.target.value)} 
                        placeholder="C:\Users\Name\AppData\Local\Google\Chrome\User Data"
                    />
                </div>
                <div className="setting-item">
                    <label>Firefox Profiles Directory</label>
                    <input 
                        type="text" 
                        value={firefoxPath} 
                        onChange={(e) => setFirefoxPath(e.target.value)} 
                        placeholder="C:\Users\Name\AppData\Roaming\Mozilla\Firefox\Profiles"
                    />
                </div>
            </div>

            <div className="settings-section">
                <h2>Appearance & Behavior</h2>
                <div className="setting-item-row">
                    <label>Dark Mode</label>
                    <div className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                    </div>
                </div>
                <div className="setting-item-row">
                    <label>Auto-scroll to bottom</label>
                    <div className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                    </div>
                </div>
            </div>

            <div className="settings-actions">
                <button className="primary-button" onClick={handleSave}>Save Changes</button>
            </div>
        </div>
    );
};