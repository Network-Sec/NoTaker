import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
    DailyCounterConfig,
    DailyCounterEntry,
    fetchDailyCounterFullState,
    saveDailyCounterConfig,
    addDailyCounterEntry
} from '../services/dailyCounterService';
import { Plus, Settings } from 'lucide-react';

interface DailyCounterSidebarWidgetProps {
    setMainView: (view: string) => void;
}

export const DailyCounterSidebarWidget = ({ setMainView }: DailyCounterSidebarWidgetProps) => {
    const [config, setConfig] = useState<DailyCounterConfig | null>(null);
    const [entries, setEntries] = useState<DailyCounterEntry[]>([]);
    const [val1Input, setVal1Input] = useState<string>('');
    const [val2Input, setVal2Input] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

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

    const handleAddEntry = async () => {
        if (!config || config.id === null) {
            alert('Please configure the counter first by going to the full view.');
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
        return <div className="p-2 text-center text-gray-400 text-xs">Loading Counter...</div>;
    }

    if (!config || config.id === null) {
        return (
            <div className="tech-panel p-2 mt-4 text-center">
                <h4 className="text-sm font-bold text-white mb-2">Counter Not Configured</h4>
                <button onClick={() => setMainView('daily-counter-full')} className="tech-btn px-2 py-1 text-xs">
                    Configure Now
                </button>
            </div>
        );
    }

    return (
        <div className="tech-panel p-2 mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-white uppercase truncate">{config.name}</h4>
                <button onClick={() => setMainView('daily-counter-full')} className="tech-btn-secondary p-1">
                    <Settings size={14} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-1 text-center text-white text-xs mb-2">
                <div className="p-1 border border-white/10 rounded-sm bg-white/5">
                    <div className="text-gray-400 text-[10px] uppercase">Val1 Left</div>
                    <div className="font-bold text-sm text-techCyan">{currentVal1Display?.toFixed(2)}</div>
                </div>
                <div className="p-1 border border-white/10 rounded-sm bg-white/5">
                    <div className="text-gray-400 text-[10px] uppercase">Val2 Left</div>
                    <div className="font-bold text-sm text-techOrange">{currentVal2Display?.toFixed(2)}</div>
                </div>
            </div>

            <div className="flex gap-1 mb-2">
                <input type="number" step="any" className="tech-input flex-1 text-xs px-2 py-1" placeholder="Val 1" value={val1Input} onChange={e => setVal1Input(e.target.value)} />
                <input type="number" step="any" className="tech-input flex-1 text-xs px-2 py-1" placeholder="Val 2" value={val2Input} onChange={e => setVal2Input(e.target.value)} />
                <button onClick={handleAddEntry} className="tech-btn p-1 flex items-center justify-center">
                    <Plus size={14} />
                </button>
            </div>

            <div className="max-h-28 overflow-y-auto custom-scrollbar"> {/* Limited height for sidebar widget */}
                <table className="w-full text-left text-xs text-gray-400">
                    <thead className="text-[10px] uppercase bg-white/5">
                        <tr>
                            <th scope="col" className="px-1 py-1">Date</th>
                            <th scope="col" className="px-1 py-1 text-center">In1</th>
                            <th scope="col" className="px-1 py-1 text-center">In2</th>
                            <th scope="col" className="px-1 py-1 text-center">Tot1</th>
                            <th scope="col" className="px-1 py-1 text-center">Tot2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.slice().reverse().slice(0, 5).map((entry, index) => ( // Show only last 5 entries
                            <tr key={entry.id || `entry-${index}`} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-1 py-1 font-mono">{moment(entry.date).format('MM-DD')}</td>
                                <td className="px-1 py-1 text-center text-techCyan">{entry.val1_input.toFixed(2)}</td>
                                <td className="px-1 py-1 text-center text-techOrange">{entry.val2_input.toFixed(2)}</td>
                                <td className="px-1 py-1 text-center text-techCyan">{entry.total1?.toFixed(2)}</td>
                                <td className="px-1 py-1 text-center text-techOrange">{entry.total2?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entries.length === 0 && <p className="text-center text-gray-500 text-[10px] mt-2">No entries yet.</p>}
            </div>
        </div>
    );
};
