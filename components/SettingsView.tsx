import React, { useState } from 'react';
import '../styles/settings.css';
import type { SettingsConfig } from '../types'; // Import SettingsConfig from central types file

interface SettingsViewProps {
  config: SettingsConfig;
  onConfigChange: (newConfig: SettingsConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onConfigChange }) => {
    // Local state management for all fields
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (section: string, key: string, value: any) => {
        setLocalConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handleRootChange = (key: string, value: any) => {
        setLocalConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const saveSettings = () => {
        onConfigChange(localConfig);
        alert('Settings Saved');
    };

    return (
        <div className="page-container settings-view">
            <div className="settings-header">
                <h1>Settings</h1>
                <button className="primary-button" onClick={saveSettings}>Save Changes</button>
            </div>

            {/* --- FIREFOX --- */}
            <div className="settings-section">
                <h2>Firefox Configuration</h2>
                
                <div className="setting-item">
                    <label>Windows Profile Directory</label>
                    <input type="text" value={localConfig.firefox?.winProfileDir || ''} onChange={e => handleChange('firefox', 'winProfileDir', e.target.value)} placeholder="%APPDATA%\Mozilla\Firefox\Profiles\" />
                </div>

                <div className="setting-grid-two-col">
                    <div className="setting-item">
                        <label>Windows Places SQLite</label>
                        <input type="text" value={localConfig.firefox?.winPlaces || 'places.sqlite'} onChange={e => handleChange('firefox', 'winPlaces', e.target.value)} />
                    </div>
                    <div className="setting-item">
                        <label>Windows Favicons SQLite</label>
                        <input type="text" value={localConfig.firefox?.winFavicons || 'favicons.sqlite'} onChange={e => handleChange('firefox', 'winFavicons', e.target.value)} />
                    </div>
                </div>

                <div className="setting-item">
                    <label>WSL Profile Directory</label>
                    <input type="text" value={localConfig.firefox?.wslProfileDir || ''} onChange={e => handleChange('firefox', 'wslProfileDir', e.target.value)} placeholder="~/.mozilla/firefox/" />
                </div>

                <div className="setting-grid-two-col">
                    <div className="setting-item">
                        <label>WSL Places SQLite</label>
                        <input type="text" value={localConfig.firefox?.wslPlaces || 'places.sqlite'} onChange={e => handleChange('firefox', 'wslPlaces', e.target.value)} />
                    </div>
                    <div className="setting-item">
                        <label>WSL Favicons SQLite</label>
                        <input type="text" value={localConfig.firefox?.wslFavicons || 'favicons.sqlite'} onChange={e => handleChange('firefox', 'wslFavicons', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* --- CHROME --- */}
            <div className="settings-section">
                <h2>Chrome Configuration</h2>
                
                <div className="setting-item">
                    <label>Windows User Data Directory</label>
                    <input type="text" value={localConfig.chrome?.winUserData || ''} onChange={e => handleChange('chrome', 'winUserData', e.target.value)} placeholder="%LOCALAPPDATA%\Google\Chrome\User Data\" />
                </div>

                <div className="setting-item">
                    <label>WSL User Data Directory</label>
                    <input type="text" value={localConfig.chrome?.wslUserData || ''} onChange={e => handleChange('chrome', 'wslUserData', e.target.value)} placeholder="/mnt/c/Users/.../Chrome/User Data/" />
                </div>

                <div className="setting-item">
                    <label>Profile Names (comma separated)</label>
                    <input type="text" value={localConfig.chrome?.profiles || ''} onChange={e => handleChange('chrome', 'profiles', e.target.value)} placeholder="Default, Profile 1, Profile 2" />
                </div>
            </div>

            {/* --- AI & GENERAL --- */}
            <div className="settings-section">
                <h2>AI & System</h2>
                
                <div className="setting-grid-two-col">
                    <div className="setting-item">
                        <label>Ollama URL</label>
                        <input type="text" value={localConfig.ai?.ollamaUrl || ''} onChange={e => handleChange('ai', 'ollamaUrl', e.target.value)} placeholder="http://127.0.0.1:11434" />
                    </div>
                    <div className="setting-item">
                        <label>Ollama Model</label>
                        <input type="text" value={localConfig.ai?.ollamaModel || ''} onChange={e => handleChange('ai', 'ollamaModel', e.target.value)} placeholder="llama2" />
                    </div>
                </div>

                <div className="setting-item">
                    <label>Import Interval (Minutes)</label>
                    <input type="number" value={localConfig.general?.importInterval || 30} onChange={e => handleChange('general', 'importInterval', Number(e.target.value))} />
                </div>
            </div>

            {/* --- GENERIC INPUTS --- */}
            <div className="settings-section">
                <h2>Custom Parameters</h2>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={`input-${i}`} className="setting-item">
                        <label>Generic Input {i}</label>
                        <input 
                            type="text" 
                            value={localConfig.generic?.[`input${i}`] || ''} 
                            onChange={e => handleChange('generic', `input${i}`, e.target.value)} 
                        />
                    </div>
                ))}
            </div>

            {/* --- GENERIC SWITCHES --- */}
            <div className="settings-section">
                <h2>Feature Toggles</h2>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={`switch-${i}`} className="setting-item-row">
                        <label className="toggle-switch-label">
                            <span>Generic Toggle {i}</span>
                            <div className="toggle-switch"> {/* Wrapper for input and slider */}
                                <input 
                                    type="checkbox" 
                                    checked={localConfig.generic?.[`switch${i}`] || false} 
                                    onChange={e => handleChange('generic', `switch${i}`, e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            <div className="settings-actions">
                <button className="primary-button" onClick={saveSettings}>Save All Settings</button>
            </div>
        </div>
    );
};