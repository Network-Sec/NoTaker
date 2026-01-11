import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import {
    DailyCounterConfig,
    DailyCounterEntry,
    fetchDailyCounterFullState,
    addDailyCounterEntry,
    updateDailyCounterEntry // We'll need this for inline editing
} from '../services/dailyCounterService';
import { Settings, Coffee, Droplet } from 'lucide-react';

interface DailyCounterSidebarWidgetProps {
    setMainView: (view: string) => void;
}

// Sub-component for an editable table row
const EditableDailyCounterRow = ({ entry, onUpdate }: { entry: DailyCounterEntry, onUpdate: (e: DailyCounterEntry) => void }) => {
    const [editVal1, setEditVal1] = useState(entry.val1_input.toString());
    const [editVal2, setEditVal2] = useState(entry.val2_input.toString());

    const handleSave = async () => {
        const newVal1 = parseFloat(editVal1);
        const newVal2 = parseFloat(editVal2);

        if (isNaN(newVal1) || isNaN(newVal2)) {
            alert('Please enter valid numbers.');
            // Revert to original values if invalid
            setEditVal1(entry.val1_input.toString());
            setEditVal2(entry.val2_input.toString());
            return;
        }

        // Only update if values have actually changed
        if (newVal1 !== entry.val1_input || newVal2 !== entry.val2_input) {
            onUpdate({ ...entry, val1_input: newVal1, val2_input: newVal2 });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // Trigger blur to save
        }
    };

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 group">
            <td className="px-1 py-1 font-mono">{moment(entry.timestamp).format('HH:mm')}</td>
            <td className="px-1 py-1 text-center text-techCyan">
                <input
                    type="number"
                    step="any"
                    value={editVal1}
                    onChange={e => setEditVal1(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="tech-input w-full bg-transparent border-none text-techCyan text-center p-0 focus:ring-0 no-spinners"
                />
            </td>
            <td className="px-1 py-1 text-center text-techOrange">
                <input
                    type="number"
                    step="any"
                    value={editVal2}
                    onChange={e => setEditVal2(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="tech-input w-full bg-transparent border-none text-techOrange text-center p-0 focus:ring-0 no-spinners"
                />
            </td>
            <td className="px-1 py-1 text-center text-gray-500">{entry.total1?.toFixed(2)}</td>
            <td className="px-1 py-1 text-center text-gray-500">{entry.total2?.toFixed(2)}</td>
            <td className="px-1 py-1 text-right">
                {/* No edit button needed as fields are always editable */}
            </td>
        </tr>
    );
};


export const DailyCounterSidebarWidget = ({ setMainView }: DailyCounterSidebarWidgetProps) => {
    const [config, setConfig] = useState<DailyCounterConfig | null>(null);
    const [entries, setEntries] = useState<DailyCounterEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    // State for the blank new entry row
    const [newEntryVal1, setNewEntryVal1] = useState<string>('');
    const [newEntryVal2, setNewEntryVal2] = useState<string>('');
    const [newEntryTimestamp, setNewEntryTimestamp] = useState<string>(''); // New state for dynamic timestamp

    const loadFullState = async () => {
        setLoading(true);
        const fullState = await fetchDailyCounterFullState();
        setConfig(fullState.config);
        setEntries(fullState.entries);
        setLoading(false);
    };

    useEffect(() => {
        loadFullState();
    }, []);

    // Effect to reset timestamp when inputs are cleared
    useEffect(() => {
        if (!newEntryVal1 && !newEntryVal2) {
            setNewEntryTimestamp('');
        }
    }, [newEntryVal1, newEntryVal2]);

    const handleNewEntryChange = (val: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (!newEntryTimestamp && (val !== '' && !isNaN(parseFloat(val)))) {
            setNewEntryTimestamp(new Date().toISOString());
        }
        setter(val);
    };

    const handleNewEntrySave = async () => {
        const val1 = parseFloat(newEntryVal1 || '0');
        const val2 = parseFloat(newEntryVal2 || '0');

        if (!config || config.id === null) {
            alert('Please configure the counter first by going to the full view.');
            setNewEntryVal1('');
            setNewEntryVal2('');
            setNewEntryTimestamp(''); // Reset timestamp too
            return;
        }

        // Only add if at least one value is non-zero or it's not empty string and valid number
        if ((!isNaN(val1) && (val1 !== 0 || newEntryVal1 !== '')) || (!isNaN(val2) && (val2 !== 0 || newEntryVal2 !== ''))) {
            const entryToAdd: Omit<DailyCounterEntry, 'id' | 'timestamp'> = {
                config_id: config.id,
                date: moment(newEntryTimestamp || new Date()).format('YYYY-MM-DD'), // Use dynamic timestamp or current if not set
                val1_input: val1,
                val2_input: val2,
                timestamp: newEntryTimestamp || new Date().toISOString()
            };
            try {
                await addDailyCounterEntry(entryToAdd);
                setNewEntryVal1('');
                setNewEntryVal2('');
                setNewEntryTimestamp(''); // Reset timestamp after save
                await loadFullState(); // Reload to get updated entries and re-calculate totals
            } catch (error) {
                console.error("Failed to add entry:", error);
                alert('Failed to add entry.');
            }
        }
    };
    
    // Callback for updating an existing entry (from EditableDailyCounterRow)
    const handleUpdateEntry = async (updatedEntry: DailyCounterEntry) => {
        if (!config || config.id === null || !updatedEntry.id) return;
        
        const { id, date, val1_input, val2_input, timestamp } = updatedEntry;

        try {
            await updateDailyCounterEntry(id, {
                date: moment(date).format('YYYY-MM-DD'), // Ensure consistent date format
                val1_input: val1_input,
                val2_input: val2_input,
                timestamp: timestamp // Pass existing timestamp to prevent it from changing
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
        return <div className="p-2 text-center text-gray-400 text-xs mt-4">Loading Counter...</div>;
    }

    if (!config || config.id === null) {
        return (
            <div className="tech-panel p-2" style={{marginTop: '20px'}}>
                <h4 className="text-sm font-bold text-white mb-2">Counter Not Configured</h4>
                <button onClick={() => setMainView('daily-counter-full')} className="tech-btn px-2 py-1 text-xs">
                    Configure Now
                </button>
            </div>
        );
    }

    return (
        <div className="tech-panel p-2" style={{marginTop: '20px'}}>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-white uppercase truncate">{config.name || 'Daily Counter'}</h4>
                <button onClick={() => setMainView('daily-counter-full')} className="tech-btn-secondary p-1">
                    <Settings size={14} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-1 text-center text-white text-xs mb-2">
                <div className="p-1 border border-white/10 bg-white/5">
                    <div className="flex items-center justify-center gap-0.5">
                        <Coffee size={12} className="text-techCyan" />
                        <div className="font-bold text-sm text-techCyan">{currentVal1Display?.toFixed(2)}</div>
                    </div>
                </div>
                <div className="p-1 border border-white/10 bg-white/5">
                    <div className="flex items-center justify-center gap-0.5">
                        <Droplet size={12} className="text-techOrange" />
                        <div className="font-bold text-sm text-techOrange">{currentVal2Display?.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div className="max-h-64 overflow-hidden"> {/* Increased height, no scrollbar */}
                <table className="w-full text-left text-xs text-gray-400">
                    <thead className="text-[10px] uppercase bg-white/5">
                        <tr><th scope="col" className="px-1 py-1">Time</th><th scope="col" className="px-1 py-1 text-center">Coffee</th><th scope="col" className="px-1 py-1 text-center">Milk</th><th scope="col" className="px-1 py-1 text-center">TOT Coffee</th><th scope="col" className="px-1 py-1 text-center">TOT Milk</th><th scope="col" className="px-1 py-1 text-right"></th> {/* For edit button */}</tr>
                    </thead>
                    <tbody>
                        {entries.slice(-5).map((entry) => ( // Show only last 5 entries, chronological order
                            <EditableDailyCounterRow key={entry.id} entry={entry} onUpdate={handleUpdateEntry} />
                        ))}
                         {/* Blank line for new entry at BOTTOM */}
                        <tr className="border-b border-white/5 bg-white/5"><td className="px-1 py-1 font-mono">{newEntryTimestamp ? moment(newEntryTimestamp).format('HH:mm') : '--:--'}</td>
                            <td className="px-1 py-1 text-center">
                                <input 
                                    type="number" 
                                    step="any" 
                                    value={newEntryVal1}
                                    onChange={e => handleNewEntryChange(e.target.value, setNewEntryVal1)}
                                    onBlur={handleNewEntrySave} 
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNewEntrySave(); }}
                                    className="tech-input w-full text-xs bg-transparent border-none text-techCyan text-center p-0 focus:ring-0" 
                                    placeholder="0.00" 
                                />
                            </td>
                            <td className="px-1 py-1 text-center">
                                <input 
                                    type="number" 
                                    step="any" 
                                    value={newEntryVal2}
                                    onChange={e => handleNewEntryChange(e.target.value, setNewEntryVal2)}
                                    onBlur={handleNewEntrySave} 
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNewEntrySave(); }}
                                    className="tech-input w-full text-xs bg-transparent border-none text-techOrange text-center p-0 focus:ring-0" 
                                    placeholder="0.00" 
                                />
                            </td>
                            <td className="px-1 py-1 text-center text-gray-500">-</td>
                            <td className="px-1 py-1 text-center text-gray-500">-</td>
                            <td className="px-1 py-1 text-right"></td>
                        </tr>
                    </tbody>
                </table>
                {entries.length === 0 && <p className="text-center text-gray-500 text-[10px] mt-2">No entries yet.</p>}
            </div>
        </div>
    );
};