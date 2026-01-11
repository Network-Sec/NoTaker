import React, { useState, useEffect } from 'react';
import { getEnvSettings, updateEnvSettings, EnvSettings } from '../services/settings';
import { Plus, X, Save, RefreshCw } from 'lucide-react';

// --- Configuration ---
const BOOLEAN_KEYS = ['DARK_MODE', 'AUTO_SCROLL_STREAM', 'ENABLE_AI'];
const ARRAY_KEYS = ['GOOGLE_CALENDAR_URLS'];

// --- Components ---
const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center cursor-pointer select-none group">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-gray-700 border border-gray-600'}`}></div>
            <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-full bg-cyan-100' : 'bg-gray-400'}`}></div>
        </div>
        <div className="ml-3 text-gray-300 font-sans text-xs group-hover:text-cyan-400 transition-colors uppercase tracking-wider">{label}</div>
    </label>
);

const SettingsView: React.FC = () => {
    const [envSettings, setEnvSettings] = useState<EnvSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Inputs for new variables
    const [newKey, setNewKey] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');

    // --- Data Loading ---
    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getEnvSettings();
            if (data && typeof data === 'object') {
                setEnvSettings(data);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    // --- Save Logic ---
    const executeSave = async (settingsToSave: EnvSettings) => {
        setSaving(true);
        try {
            const updatedData = await updateEnvSettings(settingsToSave);
            setEnvSettings(updatedData);
        } catch (error) {
            alert("Failed to save. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBtn = () => executeSave(envSettings);

    // --- Change Handlers ---
    const handleSingleChange = (key: string, value: string | boolean) => {
        setEnvSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleArrayChange = (key: string, index: number, value: string) => {
        setEnvSettings(prev => {
            const currentArray = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : [];
            currentArray[index] = value;
            return { ...prev, [key]: currentArray };
        });
    };

    const addArrayItem = (key: string) => {
        setEnvSettings(prev => {
            const currentArray = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : [];
            return { ...prev, [key]: [...currentArray, ''] };
        });
    };

    const removeArrayItem = (key: string, index: number) => {
        setEnvSettings(prev => {
            const currentArray = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : [];
            const newArray = currentArray.filter((_, i) => i !== index);
            return { ...prev, [key]: newArray };
        });
    };

    // --- Add New Key Logic ---
    const handleAddNewKey = () => {
        const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'); // Strict sanitization
        
        if (!key) return;
        if (key in envSettings) {
            alert("Key already exists.");
            return;
        }

        const updatedSettings = { ...envSettings, [key]: newValue };
        setEnvSettings(updatedSettings); // Optimistic update
        setNewKey('');
        setNewValue('');
        
        executeSave(updatedSettings); // Persist
    };

    // --- Strict Type Logic ---
    // Only return 'ARRAY' if the key is explicitly known to be an array.
    // This prevents "Add Item" buttons from appearing on unknown keys.
    const getRenderType = (key: string, value: any) => {
        if (ARRAY_KEYS.includes(key)) return 'ARRAY';
        if (BOOLEAN_KEYS.includes(key)) return 'BOOLEAN';
        return 'STRING'; // Default to string for everything else
    };

    if (loading && Object.keys(envSettings).length === 0) {
        return <div className="p-8 text-cyan-500 font-mono">LOADING_CONFIGURATION...</div>;
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0a] font-sans text-gray-300 overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col gap-4 px-8 py-6 border-b border-white/10 bg-[#0a0a0a] z-10">
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">System Config</h1>
                    </div>
                    <button 
                        onClick={handleSaveBtn}
                        disabled={saving}
                        className={`px-4 py-2 text-sm rounded font-mono uppercase tracking-wide flex items-center gap-2 transition-all ${
                            saving 
                            ? 'bg-yellow-900/20 text-yellow-500 cursor-not-allowed' 
                            : 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 border border-cyan-800/50'
                        }`}
                    >
                        {saving ? <RefreshCw className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar pb-32">
                
                {/* Variable List */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 font-mono">
                        Active Variables
                    </h2>

                    {Object.entries(envSettings).map(([key, value]) => {
                        const type = getRenderType(key, value);

                        return (
                            <div key={key} className="bg-white/[0.03] border border-white/5 p-4 rounded-lg hover:border-white/10 transition-colors flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 font-mono tracking-wide select-text">
                                    {key}
                                </label>

                                {type === 'BOOLEAN' && (
                                    <ToggleSwitch
                                        label={String(value) === 'true' ? 'ENABLED' : 'DISABLED'}
                                        checked={value === true || value === 'true'}
                                        onChange={(val) => handleSingleChange(key, val)}
                                    />
                                )}

                                {type === 'ARRAY' && (
                                    <div className="space-y-2 mt-1">
                                        {(Array.isArray(value) ? value : []).map((item: string, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange(key, index, e.target.value)}
                                                    className="flex-grow bg-black/50 border border-white/10 text-gray-300 text-sm px-3 py-2 rounded focus:border-cyan-500/50 focus:outline-none font-mono"
                                                    placeholder="Value..."
                                                />
                                                <button onClick={() => removeArrayItem(key, index)} className="text-gray-600 hover:text-red-400 p-2">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => addArrayItem(key)} 
                                            className="text-xs text-cyan-500 hover:text-cyan-300 flex items-center gap-1 mt-1 font-mono uppercase"
                                        >
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                )}

                                {type === 'STRING' && (
                                    <input
                                        type="text"
                                        value={value as string}
                                        onChange={(e) => handleSingleChange(key, e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 text-gray-300 text-sm px-3 py-2 rounded focus:border-cyan-500/50 focus:outline-none font-mono"
                                        placeholder="Empty"
                                    />
                                )}
                            </div>
                        );
                    })}
                </section>

                {/* Add New Key */}
                <section className="bg-cyan-900/10 border border-cyan-900/30 p-6 rounded-lg">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 font-mono">
                        Add New Variable
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full md:w-1/3 bg-black/50 border border-cyan-900/30 text-cyan-100 text-sm px-3 py-2 rounded focus:border-cyan-500 focus:outline-none uppercase font-mono placeholder-cyan-900/50"
                            placeholder="KEY_NAME"
                        />
                        <div className="flex-grow flex gap-2">
                            <input
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full bg-black/50 border border-cyan-900/30 text-gray-300 text-sm px-3 py-2 rounded focus:border-cyan-500 focus:outline-none font-mono placeholder-cyan-900/50"
                                placeholder="Value"
                            />
                            <button 
                                onClick={handleAddNewKey} 
                                disabled={!newKey.trim() || saving}
                                className="px-4 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-700/50 text-cyan-400 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsView;