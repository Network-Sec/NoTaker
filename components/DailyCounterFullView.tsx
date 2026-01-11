import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import {
    DailyCounterConfig,
    DailyCounterEntry,
    fetchDailyCounterFullState,
    saveDailyCounterConfig,
    addDailyCounterEntry,
    updateDailyCounterEntry // New import for updating entries
} from '../services/dailyCounterService';
import CalendarInput from './CalendarInput'; // Re-using existing CalendarInput
import { Settings, Plus, Save, Coffee, Minus, Edit, X, Droplet } from 'lucide-react'; // Added Minus, Edit, X icons and Droplet

interface DailyCounterFullViewProps {
    setMainView: (view: string) => void;
}

export const DailyCounterFullView = ({ setMainView }: DailyCounterFullViewProps) => {
    const [config, setConfig] = useState<DailyCounterConfig | null>(null);
    const [entries, setEntries] = useState<DailyCounterEntry[]>([]);
    const [newEntryVal1Input, setNewEntryVal1Input] = useState<string>(''); // For new entry input
    const [newEntryVal2Input, setNewEntryVal2Input] = useState<string>(''); // For new entry input
    const [isConfiguring, setIsConfiguring] = useState<boolean>(false); // State for main config editing
    const [loading, setLoading] = useState<boolean>(true);

    // Form states for configuration (temporary, for inline editing)
    const [tempConfigName, setTempConfigName] = useState<string>('');
    const [tempConfigStartDate, setTempConfigStartDate] = useState<Date>(moment().toDate());
    const [tempConfigInitialVal1, setTempConfigInitialVal1] = useState<string>('100');
    const [tempConfigInitialVal2, setTempConfigInitialVal2] = useState<string>('100');

    const loadFullState = async () => {
        setLoading(true);
        try {
            const fullState = await fetchDailyCounterFullState();
            setConfig(fullState.config);
            setEntries(fullState.entries);

            // Initialize temp config states with fetched data
            if (fullState.config) {
                setTempConfigName(fullState.config.name);
                setTempConfigStartDate(moment(fullState.config.startDate).toDate());
                setTempConfigInitialVal1(fullState.config.initialVal1.toString());
                setTempConfigInitialVal2(fullState.config.initialVal2.toString());
            } else {
                 // Reset temps if no config found (e.g., initial load)
                setTempConfigName('Coffee & Milk Counter');
                setTempConfigStartDate(moment().toDate());
                setTempConfigInitialVal1('100');
                setTempConfigInitialVal2('100');
            }
        } catch (error) {
            console.error("Failed to load full counter state:", error);
            // Fallback to default if loading fails
            setConfig(null);
            setEntries([]);
            setTempConfigName('Coffee & Milk Counter');
            setTempConfigStartDate(moment().toDate());
            setTempConfigInitialVal1('100');
            setTempConfigInitialVal2('100');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFullState();
    }, []);

    const handleSaveConfig = async () => {
        if (!tempConfigName || !tempConfigStartDate || isNaN(parseFloat(tempConfigInitialVal1)) || isNaN(parseFloat(tempConfigInitialVal2))) {
            alert('Please fill all configuration fields with valid values.');
            return;
        }

        const newConfigData: Omit<DailyCounterConfig, 'id'> = {
            name: tempConfigName,
            startDate: moment(tempConfigStartDate).format('YYYY-MM-DD'),
            initialVal1: parseFloat(tempConfigInitialVal1),
            initialVal2: parseFloat(tempConfigInitialVal2)
        };

        try {
            await saveDailyCounterConfig(newConfigData);
            await loadFullState(); // Reload to get updated config and re-calculate totals
            setIsConfiguring(false);
        } catch (error) {
            console.error("Failed to save config:", error);
            alert('Failed to save configuration.');
        }
    };

    const handleCancelConfig = () => {
        // Revert temp states to last saved config
        if (config) {
            setTempConfigName(config.name);
            setTempConfigStartDate(moment(config.startDate).toDate());
            setTempConfigInitialVal1(config.initialVal1.toString());
            setTempConfigInitialVal2(config.initialVal2.toString());
        }
        setIsConfiguring(false);
    };


    const handleAddNewEntry = async () => {
        if (!config || config.id === null) {
            alert('Please configure the counter first.');
            return;
        }
        // If both inputs are empty, don't add
        if (newEntryVal1Input === '' && newEntryVal2Input === '') {
            return; 
        }
        
        const entryVal1 = parseFloat(newEntryVal1Input || '0');
        const entryVal2 = parseFloat(newEntryVal2Input || '0');

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
            setNewEntryVal1Input('');
            setNewEntryVal2Input('');
            await loadFullState(); // Reload to get updated entries and re-calculate totals
        } catch (error) {
            console.error("Failed to add entry:", error);
            alert('Failed to add entry.');
        }
    };

    // Callback for updating an existing entry
    const handleUpdateEntry = async (updatedEntry: DailyCounterEntry) => {
        if (!config || config.id === null || !updatedEntry.id) return;
        
        const { id, date, val1_input, val2_input, timestamp } = updatedEntry;

        try {
            await updateDailyCounterEntry(id, {
                date: moment(date).format('YYYY-MM-DD'), // Ensure consistent date format
                val1_input: val1_input,
                val2_input: val2_input,
                timestamp: timestamp // Pass the timestamp
            });
            await loadFullState(); // Reload to re-calculate totals
        } catch (error) {
            console.error("Failed to update entry:", error);
            alert('Failed to update entry.');
        }
    };


    const currentVal1Display = entries.length > 0 ? entries[entries.length - 1].total1 : (config ? config.initialVal1 : 0);
    const currentVal2Display = entries.length > 0 ? entries[entries.length - 1].total2 : (config ? config.initialVal2 : 0);

    if (loading) {
        return <div className="p-4 text-center text-gray-400">Loading Counter...</div>;
    }

    // Editable Table Row Component for Entries
    const EditableEntryRow = ({ entry, onUpdate }: { entry: DailyCounterEntry, onUpdate: (e: DailyCounterEntry) => void }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editVal1, setEditVal1] = useState(entry.val1_input.toString());
        const [editVal2, setEditVal2] = useState(entry.val2_input.toString());
        const [editDate, setEditDate] = useState(moment(entry.date).toDate());
        const [editTime, setEditTime] = useState(moment(entry.timestamp).toDate());
        
        const handleSave = async () => {
            const newVal1 = parseFloat(editVal1);
            const newVal2 = parseFloat(editVal2);

            if (isNaN(newVal1) || isNaN(newVal2)) {
                alert('Please enter valid numbers.');
                return;
            }

            // Combine date and time
            const combinedTimestamp = moment(editDate).set({
                hour: moment(editTime).hour(),
                minute: moment(editTime).minute(),
                second: moment(editTime).second()
            }).toISOString();
            
            const formattedDate = moment(editDate).format('YYYY-MM-DD');

            onUpdate({ 
                ...entry, 
                val1_input: newVal1, 
                val2_input: newVal2,
                date: formattedDate,
                timestamp: combinedTimestamp
            });
            setIsEditing(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        };

        return (
            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 group">
                <td className="px-4 py-3 font-mono">
                    {isEditing ? (
                         <CalendarInput 
                            mode="date" 
                            value={editDate} 
                            onChange={d => d && setEditDate(d)} 
                            hideIcon={true}
                        />
                    ) : (
                        moment(entry.date).format('YYYY-MM-DD')
                    )}
                </td>
                <td className="px-4 py-3 font-mono">
                    {isEditing ? (
                        <CalendarInput 
                            mode="time" 
                            value={editTime} 
                            onChange={d => d && setEditTime(d)} 
                            hideIcon={true}
                        />
                    ) : (
                        moment(entry.timestamp).format('HH:mm')
                    )}
                </td>
                <td className="px-4 py-3 text-center text-techCyan">
                    {isEditing ? (
                        <input
                            type="number"
                            step="any"
                            value={editVal1}
                            onChange={e => setEditVal1(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="tech-input w-full bg-transparent border-none text-techCyan text-center p-0 focus:ring-0"
                            autoFocus
                        />
                    ) : (
                        <span onClick={() => setIsEditing(true)} className="inline-block w-full cursor-pointer">{entry.val1_input.toFixed(2)}</span>
                    )}
                </td>
                <td className="px-4 py-3 text-center text-techOrange">
                    {isEditing ? (
                        <input
                            type="number"
                            step="any"
                            value={editVal2}
                            onChange={e => setEditVal2(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="tech-input w-full bg-transparent border-none text-techOrange text-center p-0 focus:ring-0"
                        />
                    ) : (
                        <span onClick={() => setIsEditing(true)} className="inline-block w-full cursor-pointer">{entry.val2_input.toFixed(2)}</span>
                    )}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{entry.total1?.toFixed(2)}</td>
                <td className="px-4 py-3 text-center text-gray-400">{entry.total2?.toFixed(2)}</td>
                <td className="px-2 py-3 text-right">
                    {isEditing ? (
                        <div className="flex justify-end gap-2">
                             <button onClick={handleSave} className="text-green-500 hover:text-green-400"><Save size={14} /></button>
                             <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400"><X size={14} /></button>
                        </div>
                    ) : (
                         <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"><Edit size={14} /></button>
                    )}
                </td>
            </tr>
        );
    };

    // Full View UI
    return (
        <div className="page-container flex-col space-y-6">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Coffee size={32} className="text-yellow-500" />
                {isConfiguring ? 'Configure Counter' : (config?.name || 'Daily Counter')}
                
                {isConfiguring ? (
                    <div className="flex gap-2 ml-4">
                        <button onClick={handleSaveConfig} className="tech-btn p-2 flex items-center justify-center gap-2">
                            <Save size={18} /> Save
                        </button>
                        <button onClick={handleCancelConfig} className="tech-btn-secondary p-2 flex items-center justify-center gap-2">
                            <X size={18} /> Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsConfiguring(true)} className="tech-btn-secondary p-2 ml-4">
                        <Settings size={18} /> Configure
                    </button>
                )}
                
                <button onClick={() => setMainView('dashboard')} className="tech-btn-secondary p-2 ml-2">
                    Back to Dashboard
                </button>
            </h1>

            {isConfiguring && (
                <div className="tech-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-4 uppercase">Configuration Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Counter Name:</label>
                            <input type="text" className="tech-input w-full p-2" value={tempConfigName} onChange={e => setTempConfigName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Start Date:</label>
                            <CalendarInput 
                                mode="date" 
                                value={tempConfigStartDate} 
                                onChange={date => setTempConfigStartDate(date || moment().toDate())} 
                                hideIcon={true}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Initial Coffee Amount:</label>
                            <input type="number" step="any" className="tech-input w-full p-2" value={tempConfigInitialVal1} onChange={e => setTempConfigInitialVal1(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Initial Milk Amount:</label>
                            <input type="number" step="any" className="tech-input w-full p-2" value={tempConfigInitialVal2} onChange={e => setTempConfigInitialVal2(e.target.value)} />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={handleSaveConfig} className="tech-btn flex-1 flex items-center justify-center gap-2">
                                <Save size={18} /> Save Configuration
                            </button>
                            <button onClick={handleCancelConfig} className="tech-btn-secondary flex-1 flex items-center justify-center gap-2">
                                <X size={18} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {!isConfiguring && (
                <> {/* Added Fragment here */}
                    <div className="tech-panel p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 border border-white/10 bg-white/5 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-1">
                                <Coffee size={20} className="text-techCyan" />
                                <div className="font-bold text-4xl text-techCyan">{currentVal1Display?.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="p-4 border border-white/10 bg-white/5 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-1">
                                <Droplet size={20} className="text-techOrange" />
                                <div className="font-bold text-4xl text-techOrange">{currentVal2Display?.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="p-4 border border-white/10 rounded-md bg-white/5 flex flex-col items-center justify-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Used Today</div>
                            <div className="flex gap-2 w-full mt-2">
                                <input type="number" step="any" className="tech-input flex-1 p-2" placeholder="Coffee" value={newEntryVal1Input} onChange={e => setNewEntryVal1Input(e.target.value)} />
                                <input type="number" step="any" className="tech-input flex-1 p-2" placeholder="Milk" value={newEntryVal2Input} onChange={e => setNewEntryVal2Input(e.target.value)} />
                                <button onClick={handleAddNewEntry} className="tech-btn p-2 flex items-center justify-center">
                                    <Minus size={20} /> Used
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
                                    <th scope="col" className="px-4 py-3 text-center">Coffee Used</th>
                                    <th scope="col" className="px-4 py-3 text-center">Milk Used</th>
                                    <th scope="col" className="px-4 py-3 text-center">Coffee Left</th>
                                    <th scope="col" className="px-4 py-3 text-center">Milk Left</th>
                                    <th scope="col" className="px-4 py-3 text-right"></th> {/* For edit button */}
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => ( // Show newest last (at bottom)
                                    <EditableEntryRow key={entry.id} entry={entry} onUpdate={handleUpdateEntry} />
                                ))}
                                {entries.length === 0 && <p className="text-center text-gray-500 mt-4">No entries yet. Add your first entry or configure the counter.</p>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};