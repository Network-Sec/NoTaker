import React, { useState, useEffect } from 'react';
import { Users, LayoutGrid, Database, Search, Bell, Settings, ChevronRight, Plus, Hexagon } from 'lucide-react';
import { Identity, SharedCredentialGroup, ViewState } from '../types';
import { IdentityProfileCard } from './IdentityProfileCard';
import { IdentityDetailView } from './IdentityDetailView';
import { CredsDetailView } from './CredsDetailView';
import { getIdentities, createIdentity, updateIdentity, deleteIdentity, getCredentialGroups, createCredentialGroup, updateCredentialGroup, deleteCredentialGroup } from '../services/db';

// --- MOCK INITIAL DATA FOR FALLBACK ---
// (Kept for instant visual feedback if backend fails, but logic uses API)
const MOCK_IDENTITIES: Identity[] = [
  {
    id: '1',
    firstName: 'Patricia',
    lastName: 'Casper',
    username: 'kasparrone',
    headline: 'Senior Frontend Fritten Wender',
    email: 'p.casper@tech-corp.com',
    phone: '+49 123 456 789',
    location: 'Germany',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    bannerUrl: 'https://picsum.photos/id/132/1200/400',
    about: 'Passionate Freedom Fryer.',
    connections: 582,
    experience: [],
    education: [],
    skills: ['React', 'TypeScript'],
    personalCredentials: [],
    linkedVaultIds: []
  }
];

export const IdentityOverview: React.FC = () => {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [credsGroups, setCredsGroups] = useState<SharedCredentialGroup[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ type: 'overview' });
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch
      const [ids, grps] = await Promise.all([getIdentities(), getCredentialGroups()]);
      setIdentities(ids.length > 0 ? ids : MOCK_IDENTITIES); // Use mocks if empty (demo mode)
      setCredsGroups(grps);
    } catch (e) {
      console.error("Fetch error", e);
      setIdentities(MOCK_IDENTITIES); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- Handlers --

  const handleIdentityClick = (id: string) => {
    setViewState({ type: 'identity-detail', id });
  };

  const handleCredsClick = (id: string) => {
    setViewState({ type: 'creds-detail', id });
  };

  const handleBackToOverview = () => {
    setViewState({ type: 'overview' });
  };

  // --- Identity Actions ---

  const handleCreateIdentity = async () => {
    const newIdentity: Omit<Identity, 'id'> = {
      firstName: 'NEW',
      lastName: 'USER',
      username: 'user_new',
      headline: 'Role TBD',
      email: '',
      phone: '',
      location: 'Unknown',
      about: '',
      avatarUrl: `https://ui-avatars.com/api/?name=NU&background=random`,
      bannerUrl: 'https://picsum.photos/1200/400?grayscale',
      experience: [],
      education: [],
      skills: [],
      personalCredentials: [],
      linkedVaultIds: [],
      connections: 0
    };
    
    try {
      const id = await createIdentity(newIdentity);
      const created = { ...newIdentity, id } as Identity;
      setIdentities(prev => [...prev, created]);
      setViewState({ type: 'identity-detail', id });
    } catch (e) {
      console.error("Create failed", e);
    }
  };

  const handleSaveIdentity = async (updated: Identity) => {
    try {
      await updateIdentity(updated);
      setIdentities(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDeleteIdentity = async (id: string) => {
    try {
      await deleteIdentity(id);
      setIdentities(prev => prev.filter(i => i.id !== id));
      setViewState({ type: 'overview' });
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // --- Creds Actions ---

  const handleUpdateCreds = async (updatedGroup: SharedCredentialGroup) => {
    try {
      await updateCredentialGroup(updatedGroup);
      setCredsGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    } catch (e) {
      console.error("Update creds failed", e);
    }
  };

  const handleAddCredsGroup = async () => {
    const newGroup: Omit<SharedCredentialGroup, 'id'> = {
      name: 'NEW_VAULT',
      description: 'Secure storage container',
      updatedAt: new Date().toISOString(),
      pairs: []
    };
    try {
      const id = await createCredentialGroup(newGroup);
      const created = { ...newGroup, id } as SharedCredentialGroup;
      setCredsGroups([...credsGroups, created]);
      setViewState({ type: 'creds-detail', id });
    } catch (e) {
      console.error("Create creds failed", e);
    }
  };

  // -- Derived State for Main Content --
  const renderMainContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full text-techCyan font-mono animate-pulse">INITIALIZING_SYSTEM...</div>;
    }

    if (viewState.type === 'identity-detail') {
      const identity = identities.find(i => i.id === viewState.id);
      if (!identity) return <div className="p-8 text-red-500">ERROR: IDENTITY_NOT_FOUND</div>;
      return (
        <IdentityDetailView 
          identity={identity} 
          availableVaults={credsGroups}
          onSave={handleSaveIdentity}
          onDelete={handleDeleteIdentity}
        />
      );
    }

    if (viewState.type === 'creds-detail') {
      const group = credsGroups.find(g => g.id === viewState.id);
      if (!group) return <div className="p-8 text-red-500">ERROR: VAULT_NOT_FOUND</div>;
      return <CredsDetailView group={group} onUpdate={handleUpdateCreds} />;
    }

    // Default: Overview Grid
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background relative">
         {/* Background Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-techCyan/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="mb-8 relative z-10 border-l-4 border-techCyan pl-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide uppercase font-mono">Team Overview</h1>
            <p className="text-gray-500 font-mono text-sm">/ SYSTEM / DASHBOARD / MAIN</p>
          </div>
          <button 
            onClick={handleCreateIdentity}
            className="tech-btn px-4 py-2 flex items-center gap-2"
          >
            <Plus size={16} /> NEW_IDENTITY
          </button>
        </div>
        
        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20 relative z-10">
          {identities.map((identity) => (
            <div key={identity.id} className="h-full">
              <IdentityProfileCard 
                identity={identity} 
                onClick={() => handleIdentityClick(identity.id)} 
              />
            </div>
          ))}
          {/* Add New Card (Empty State) */}
          <div 
            onClick={handleCreateIdentity}
            className="group tech-panel p-5 cursor-pointer h-full flex flex-col items-center justify-center min-h-[300px] border-dashed border-gray-700 hover:border-techCyan/50 bg-transparent hover:bg-techCyan/5 transition-all"
          >
             <div className="w-16 h-16 rounded-full border border-gray-700 flex items-center justify-center text-gray-500 group-hover:text-techCyan group-hover:border-techCyan transition-colors">
               <Plus size={32} />
             </div>
             <span className="mt-4 font-mono text-xs text-gray-500 uppercase tracking-widest group-hover:text-techCyan">Initialize New Unit</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-background font-sans text-gray-200 overflow-hidden selection:bg-techCyan selection:text-black">
      
      {/* --- SIDEBAR --- */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/5 bg-surface z-20 shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
        
        {/* Global Nav for "Overview" */}
        <div className="p-4 border-b border-white/5">
           <button 
             onClick={handleBackToOverview}
             className={`w-full flex items-center gap-3 px-4 py-3 border transition-all duration-200 group uppercase tracking-widest text-xs font-bold ${
               viewState.type === 'overview' 
               ? 'bg-techCyan/10 border-techCyan text-techCyan shadow-[0_0_15px_rgba(77,238,234,0.1)]' 
               : 'bg-transparent border-transparent hover:border-white/10 text-gray-500 hover:text-white'
             }`}
           >
             <LayoutGrid size={16} />
             <span>Dashboard</span>
           </button>
        </div>

        {/* SECTION 1: PROFILES LIST (Upper Half) */}
        <div className="flex-1 flex flex-col min-h-0 border-b border-white/5">
          <div className="px-6 py-4 flex justify-between items-center bg-black/20">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Users size={12} /> Identities
            </h3>
            <button onClick={handleCreateIdentity} className="text-gray-600 hover:text-techCyan"><Plus size={14}/></button>
          </div>
          
          <div className="overflow-y-auto flex-1 px-2 pb-4 space-y-1 custom-scrollbar pt-2">
            {identities.map(identity => (
              <div
                key={identity.id}
                onClick={() => handleIdentityClick(identity.id)}
                className={`tech-item group ${viewState.type === 'identity-detail' && viewState.id === identity.id ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <img src={identity.avatarUrl} alt="" className="w-8 h-8 object-cover border border-gray-700 group-hover:border-techCyan/50" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-bold text-gray-300 group-hover:text-white">{identity.firstName} {identity.lastName}</div>
                    <div className="truncate text-[10px] text-gray-600 font-mono group-hover:text-techCyan/70 uppercase">ID: {identity.id.slice(-4)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: CREDENTIALS MANAGER (Lower Half) */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/40">
          <div className="px-6 py-4 flex justify-between items-center sticky top-0 bg-surface/95 backdrop-blur-sm z-10 border-b border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Database size={12} /> Vaults
            </h3>
            <button 
              onClick={handleAddCredsGroup}
              className="p-1 hover:text-techCyan transition-colors text-gray-500"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-2 pb-4 space-y-1 custom-scrollbar pt-2">
            {credsGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleCredsClick(group.id)}
                className={`tech-item group ${viewState.type === 'creds-detail' && viewState.id === group.id ? 'active' : ''}`}
              >
                 <div className="w-full">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-bold text-sm truncate text-gray-300 group-hover:text-white pr-2">{group.name}</span>
                     <span className="text-[9px] px-1 py-0.5 bg-black/60 text-gray-500 border border-white/5 font-mono">{group.pairs.length} VARS</span>
                   </div>
                   <div className="text-[10px] text-gray-600 truncate font-mono group-hover:text-techOrange/80 transition-colors">&gt;&gt; {group.id}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          
          {/* Breadcrumbs / Title */}
          <div className="flex items-center text-gray-500 text-xs font-mono tracking-widest uppercase">
             <span className="hover:text-techCyan cursor-pointer transition-colors" onClick={handleBackToOverview}>NET</span>
             <ChevronRight size={12} className="mx-2 text-gray-700" />
             <span className="text-techCyan">
               {viewState.type === 'overview' && 'DASHBOARD_VIEW'}
               {viewState.type === 'identity-detail' && 'IDENTITY_PROTOCOL'}
               {viewState.type === 'creds-detail' && 'SECURE_STORAGE'}
             </span>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative hidden md:block group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-techCyan transition-colors" size={14} />
               <input 
                 type="text" 
                 placeholder="SEARCH_DATABASE..." 
                 className="tech-input bg-transparent border border-white/10 pl-10 pr-4 py-1.5 text-xs focus:border-techCyan/50 w-64 transition-all"
               />
             </div>
             <button className="relative p-2 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
               <Bell size={18} />
               <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-techOrange animate-pulse"></span>
             </button>
          </div>
        </header>

        {/* Content Render */}
        <main className="flex-1 min-h-0 relative bg-gray-900 opacity-100">
           {renderMainContent()}
        </main>

      </div>
    </div>
  );
};