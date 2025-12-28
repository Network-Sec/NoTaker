import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
    DailyCounterConfig,
    DailyCounterEntry,
    fetchDailyCounterFullState,
    saveDailyCounterConfig,
    addDailyCounterEntry
} from '../services/dailyCounterService';
import CalendarInput from './CalendarInput';
import { Settings, Plus, Save, Coffee } from 'lucide-react'; // Added Coffee icon for potentially linking to main view

// Define props for the full view, including setMainView to allow navigation back to dashboard if needed
interface DailyCounterViewProps {
    setMainView: (view: string) => void;
}

export const DailyCounterView = ({ setMainView }: DailyCounterViewProps) => {
    const [config, setConfig] = useState<DailyCounterConfig | null>(null);
    const [entries, setEntries] = useState<DailyCounterEntry[]>([]);
    const [val1Input, setVal1Input] = useState<string>('');
    const [val2Input, setVal2Input] = useState<string>('');
    const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // Form states for configuration
    const [configName, setConfigName] = useState<string>('');
    const [configStartDate, setConfigStartDate] = useState<Date>(moment().toDate());
    const [configInitialVal1, setConfigInitialVal1] = useState<string>('100');
    const [configInitialVal2, setConfigInitialVal2] = useState<string>('100');

    const loadFullState = async () => {
        setLoading(true);
        const fullState = await fetchDailyCounterFullState();
        setConfig(fullState.config);
        setEntries(fullState.entries);

        // Initialize config form with fetched data
        if (fullState.config) {
            setConfigName(fullState.config.name);
            setConfigStartDate(moment(fullState.config.startDate).toDate());
            setConfigInitialVal1(fullState.config.initialVal1.toString());
            setConfigInitialVal2(fullState.config.initialVal2.toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFullState();
    }, []);

    const handleSaveConfig = async () => {
        if (!configName || !configStartDate || isNaN(parseFloat(configInitialVal1)) || isNaN(parseFloat(configInitialVal2))) {
            alert('Please fill all configuration fields with valid values.');
            return;
        }

        const newConfig: Omit<DailyCounterConfig, 'id'> = {
            name: configName,
            startDate: moment(configStartDate).format('YYYY-MM-DD'),
            initialVal1: parseFloat(configInitialVal1),
            initialVal2: parseFloat(configInitialVal2)
        };

        try {
            await saveDailyCounterConfig(newConfig);
            await loadFullState(); // Reload to get updated config and re-calculate totals
            setIsConfiguring(false);
        } catch (error) {
            console.error("Failed to save config:", error);
            alert('Failed to save configuration.');
        }
    };

    const handleAddEntry = async () => {
        if (!config || config.id === null) {
            alert('Please configure the counter first.');
            return;
        }
        if (val1Input === '' && val2Input === '') {
            alert('Please enter at least one value.');
            return;
        }
        
        const entryVal1 = parseFloat(val1Input || '0');
        const entryVal2 = parseFloat(val2Input || '0');

        if (isNaN(entryVal1) || isNaN(entryVal2)) {
            alert('Please enter valid numbers for the values.');
            return;
        }

        const newEntry: Omit<DailyCounterEntry, 'id' | 'timestamp'> = {
            config_id: config.id,
            date: moment().format('YYYY-MM-DD'),
            val1_input: entryVal1,
            val2_input: entryVal2
        };

        try {
            await addDailyCounterEntry(newEntry);
            setVal1Input('');
            setVal2Input('');
            await loadFullState(); // Reload to get updated entries and re-calculate totals
        } catch (error) {
            console.error("Failed to add entry:", error);
            alert('Failed to add entry.');
        }
    };

    const currentVal1Display = entries.length > 0 ? entries[entries.length - 1].total1 : (config ? config.initialVal1 : 0);
    const currentVal2Display = entries.length > 0 ? entries[entries.length - 1].total2 : (config ? config.initialVal2 : 0);

    if (loading) {
        return <div className="p-4 text-center text-gray-400">Loading Counter...</div>;
    }

    // Full View UI
    return (
        <div className="page-container flex-col space-y-6">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Coffee size={32} className="text-yellow-500" />
                {config?.name || 'Daily Counter'}
                <button onClick={() => setIsConfiguring(!isConfiguring)} className="tech-btn-secondary p-2 ml-4">
                    <Settings size={18} /> {isConfiguring ? 'Exit Config' : 'Configure'}
                </button>
                <button onClick={() => setMainView('dashboard')} className="tech-btn-secondary p-2 ml-2">
                    Back to Dashboard
                </button>
            </h1>

            {isConfiguring ? (
                <div className="tech-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-4 uppercase">Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Counter Name:</label>
                            <input type="text" className="tech-input w-full p-2" value={configName} onChange={e => setConfigName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Start Date:</label>
                            <CalendarInput 
                                mode="date" 
                                value={configStartDate} 
                                onChange={date => setConfigStartDate(date || moment().toDate())} 
                                hideIcon={true}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Initial Value 1:</label>
                            <input type="number" step="any" className="tech-input w-full p-2" value={configInitialVal1} onChange={e => setConfigInitialVal1(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Initial Value 2:</label>
                            <input type="number" step="any" className="tech-input w-full p-2" value={configInitialVal2} onChange={e => setConfigInitialVal2(e.target.value)} />
                        </div>
                        <button onClick={handleSaveConfig} className="tech-btn w-full mt-4 flex items-center justify-center gap-2">
                            <Save size={18} /> Save Configuration
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="tech-panel p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 border border-white/10 rounded-md bg-white/5 flex flex-col items-center justify-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Current {config?.name.split(' ')[0] || 'Value 1'}</div>
                            <div className="font-bold text-4xl text-techCyan">{currentVal1Display?.toFixed(2)}</div>
                        </div>
                        <div className="p-4 border border-white/10 rounded-md bg-white/5 flex flex-col items-center justify-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Current {config?.name.split(' ')[2] || 'Value 2'}</div>
                            <div className="font-bold text-4xl text-techOrange">{currentVal2Display?.toFixed(2)}</div>
                        </div>
                        <div className="p-4 border border-white/10 rounded-md bg-white/5 flex flex-col items-center justify-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Add New Entry for Today</div>
                            <div className="flex gap-2 w-full mt-2">
                                <input type="number" step="any" className="tech-input flex-1 p-2" placeholder="Val 1" value={val1Input} onChange={e => setVal1Input(e.target.value)} />
                                <input type="number" step="any" className="tech-input flex-1 p-2" placeholder="Val 2" value={val2Input} onChange={e => setVal2Input(e.target.value)} />
                                <button onClick={handleAddEntry} className="tech-btn p-2 flex items-center justify-center">
                                    <Plus size={20} /> Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="tech-panel p-6 overflow-x-auto custom-scrollbar">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase">Entry History</h3>
                        <table className="w-full text-left text-sm text-gray-300 border-collapse">
                            <thead className="text-xs text-gray-400 uppercase bg-white/5">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Date</th>
                                    <th scope="col" className="px-4 py-3">Time</th>
                                    <th scope="col" className="px-4 py-3 text-center">Input 1</th>
                                    <th scope="col" className="px-4 py-3 text-center">Input 2</th>
                                    <th scope="col" className="px-4 py-3 text-center">Total 1</th>
                                    <th scope="col" className="px-4 py-3 text-center">Total 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.slice().reverse().map((entry, index) => ( // Reverse to show latest first
                                    <tr key={entry.id || `entry-${index}`} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="px-4 py-3 font-mono">{moment(entry.date).format('YYYY-MM-DD')}</td>
                                        <td className="px-4 py-3 font-mono">{moment(entry.timestamp).format('HH:mm')}</td>
                                        <td className="px-4 py-3 text-center text-techCyan">{entry.val1_input.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center text-techOrange">{entry.val2_input.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center text-techCyan">{entry.total1?.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center text-techOrange">{entry.total2?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {entries.length === 0 && <p className="text-center text-gray-500 mt-4">No entries yet. Add your first entry or configure the counter.</p>}
                    </div>
                </>
            )}
        </div>
    );
};
