import React, { useState, useEffect } from 'react';
import { SettingsConfig } from '../types';
import { getSettings, saveSettings } from '../services/db';

const SettingsView: React.FC = () => {
    const [config, setConfig] = useState<SettingsConfig>({
        firefox: {},
        chrome: {},
        ai: {},
        general: { importInterval: 30 },
        generic: {}
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSettings().then(data => {
            if (data) setConfig(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await saveSettings(config);
        setSaving(false);
    };

    const handleChange = (section: keyof SettingsConfig, key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    if (loading) return <div className="p-8 text-gray-400">Loading settings...</div>;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800 bg-[#0f0f0f]">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">System Configuration</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global preferences and integrations</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${
                        saving 
                        ? 'bg-blue-900/30 text-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                    }`}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
                
                {/* General Settings */}
                <section className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 bg-[#161616]">
                        <h2 className="text-lg font-semibold text-gray-100">General</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Browser Import Interval (Minutes)
                            </label>
                            <input 
                                type="number" 
                                value={config.general?.importInterval || 30}
                                onChange={(e) => handleChange('general', 'importInterval', parseInt(e.target.value))}
                                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-white placeholder-gray-600"
                            />
                        </div>
                    </div>
                </section>

                {/* Integrations */}
                <section className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 bg-[#161616]">
                        <h2 className="text-lg font-semibold text-gray-100">Browser Integrations</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30">
                            <h3 className="text-blue-400 font-medium mb-2">Automated Import</h3>
                            <p className="text-sm text-gray-400">
                                Chrome, Brave, and Firefox profiles are automatically detected. 
                                Ensure you have enabled the backup service to prevent data loss.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    Chrome Profiles (CSV)
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Default, Profile 1"
                                    value={config.chrome?.profiles || ''}
                                    onChange={(e) => handleChange('chrome', 'profiles', e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    Firefox Profiles (Path)
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Auto-detected"
                                    disabled
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Configuration */}
                <section className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-800 bg-[#161616]">
                        <h2 className="text-lg font-semibold text-gray-100">AI & LLM Settings</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Ollama API URL
                            </label>
                            <input 
                                type="text" 
                                placeholder="http://127.0.0.1:11434"
                                value={config.ai?.ollamaUrl || ''}
                                onChange={(e) => handleChange('ai', 'ollamaUrl', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Default Model
                            </label>
                            <input 
                                type="text" 
                                placeholder="llama3"
                                value={config.ai?.defaultModel || ''}
                                onChange={(e) => handleChange('ai', 'defaultModel', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsView;
