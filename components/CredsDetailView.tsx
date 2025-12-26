import React, { useState } from 'react';
import { Plus, Trash2, Key, Copy, Check, Lock, Unlock, Terminal } from 'lucide-react';
import { SharedCredentialGroup, CredentialPair } from '../types';

interface Props {
  group: SharedCredentialGroup;
  onUpdate: (updatedGroup: SharedCredentialGroup) => void;
}

export const CredsDetailView: React.FC<Props> = ({ group, onUpdate }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePairChange = (id: string, field: keyof CredentialPair, value: string | boolean) => {
    const updatedPairs = group.pairs.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    // Auto-save simulation
    onUpdate({ ...group, pairs: updatedPairs, updatedAt: new Date().toISOString() });
  };

  const addNewPair = () => {
    const newPair: CredentialPair = {
      id: Math.random().toString(36).substr(2, 9),
      key: '',
      value: '',
      isSecret: false
    };
    onUpdate({ 
      ...group, 
      pairs: [...group.pairs, newPair],
      updatedAt: new Date().toISOString() 
    });
  };

  const removePair = (id: string) => {
    onUpdate({
      ...group,
      pairs: group.pairs.filter(p => p.id !== id),
      updatedAt: new Date().toISOString()
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="tech-panel p-8 relative overflow-hidden border-l-4 border-l-techCyan">
           {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(77,238,234,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(77,238,234,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 text-techCyan font-mono">
              <Key className="w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase">/ SYS / CREDENTIAL_MANAGER</span>
            </div>
            
            {/* Editable Header */}
            <input 
              value={group.name} 
              onChange={(e) => onUpdate({ ...group, name: e.target.value, updatedAt: new Date().toISOString() })}
              className="text-3xl font-bold text-white mb-2 font-mono uppercase bg-transparent border-b border-transparent hover:border-white/10 focus:border-techCyan outline-none w-full"
              placeholder="VAULT_NAME"
            />
            <textarea 
              value={group.description} 
              onChange={(e) => onUpdate({ ...group, description: e.target.value, updatedAt: new Date().toISOString() })}
              className="text-gray-400 font-light max-w-2xl bg-transparent border-b border-transparent hover:border-white/10 focus:border-techCyan outline-none w-full resize-none h-16"
              placeholder="Vault Description..."
            />

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-mono">
              <div className="w-2 h-2 bg-green-500"></div>
              <span>LAST_SYNC: {new Date(group.updatedAt).toISOString()}</span>
            </div>
          </div>
        </div>

        {/* Key Value Store */}
        <div className="tech-panel p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal size={18} className="text-techOrange" />
                ENV_VARIABLES
            </h2>
            <button 
              onClick={addNewPair}
              className="tech-btn px-4 py-2 flex items-center gap-2"
            >
              <Plus size={14} />
              NEW_ENTRY
            </button>
          </div>

          <div className="space-y-1">
            {group.pairs.length === 0 && (
              <div className="text-center py-16 text-gray-600 border border-dashed border-gray-800 bg-black/20 font-mono">
                &gt; NO DATA ENTRIES FOUND <br/>
                &gt; INITIATE NEW VARIABLE SEQUENCE
              </div>
            )}

            {group.pairs.map((pair) => (
              <div key={pair.id} className="group flex flex-col md:flex-row gap-0 md:gap-4 items-start md:items-stretch bg-black/40 border border-transparent hover:border-techCyan/30 transition-all p-1">
                
                {/* Key Input */}
                <div className="flex-1 w-full md:w-1/3">
                  <div className="relative h-full">
                    <input
                      type="text"
                      value={pair.key}
                      onChange={(e) => handlePairChange(pair.id, 'key', e.target.value)}
                      placeholder="KEY_IDENTIFIER"
                      className="w-full h-full bg-surfaceHighlight/50 text-techCyan placeholder-techCyan/20 px-4 py-3 border border-transparent focus:border-techCyan focus:bg-black/80 outline-none font-mono text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Separator visual for desktop */}
                <div className="hidden md:flex items-center text-gray-700 font-mono">::</div>

                {/* Value Input */}
                <div className="flex-[2] w-full flex items-center gap-2 bg-surfaceHighlight/20 pr-2">
                  <input
                    type={pair.isSecret ? "password" : "text"}
                    value={pair.value}
                    onChange={(e) => handlePairChange(pair.id, 'value', e.target.value)}
                    placeholder="VALUE_STRING"
                    className={`flex-1 bg-transparent ${pair.isSecret ? 'text-techOrange' : 'text-gray-300'} placeholder-gray-700 px-4 py-3 outline-none font-mono text-sm`}
                  />
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handlePairChange(pair.id, 'isSecret', !pair.isSecret)}
                      className={`p-2 transition-colors hover:text-white ${pair.isSecret ? 'text-techOrange' : 'text-gray-500'}`}
                      title="Toggle Secret"
                    >
                      {pair.isSecret ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    
                    <button 
                      onClick={() => handleCopy(pair.value, pair.id)}
                      className="p-2 text-gray-500 hover:text-techCyan transition-colors"
                      title="Copy Value"
                    >
                      {copiedId === pair.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>

                    <button 
                      onClick={() => removePair(pair.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};