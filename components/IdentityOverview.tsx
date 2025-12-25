import React, { useState } from 'react';
import { Users, LayoutGrid, Database, Search, Bell, Settings, ChevronRight, Plus, Hexagon } from 'lucide-react';
import { Identity, SharedCredentialGroup, ViewState } from './types';
import { IdentityProfileCard } from './IdentityProfileCard';
import { IdentityDetailView } from './IdentityDetailView';
import { CredsDetailView } from './CredsDetailView';

// --- MOCK DATA ---
const MOCK_IDENTITIES: Identity[] = [
  {
    id: '1',
    firstName: 'Patrick',
    lastName: 'Schäfer',
    username: 'schaeferone',
    headline: 'Senior Frontend Engineer | React | Tailwind',
    email: 'p.schaefer@tech-corp.com',
    phone: '+49 123 456 789',
    location: 'Freiburg im Breisgau, Germany',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    bannerUrl: 'https://picsum.photos/id/132/1200/400',
    about: 'Passionate developer with 8+ years of experience in building scalable web applications. \n\nSpecialized in React, TypeScript, and modern CSS frameworks. I love creating polished user interfaces that provide exceptional user experiences.',
    connections: 582,
    experience: [
      {
        id: 'e1',
        title: 'Senior Frontend Engineer',
        company: 'Europa-Park',
        startDate: 'Sep 2020',
        endDate: 'Present',
        location: 'Rust, Germany',
        description: 'Leading the frontend team for the main ticketing platform. Migrated legacy jQuery codebase to Next.js.'
      },
      {
        id: 'e2',
        title: 'Software Developer',
        company: 'Pyramid Computer GmbH',
        startDate: 'Dec 2018',
        endDate: 'Feb 2020',
        location: 'Freiburg',
        description: 'Developed kiosk touch interfaces for fast food chains using proprietary framework.'
      }
    ],
    education: [
      {
        id: 'edu1',
        school: 'Walter-Rathenau-Gewerbeschule',
        degree: 'Computer Science Expert',
        fieldOfStudy: 'System Integration',
        startDate: '2015',
        endDate: '2018'
      }
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Docker', 'GraphQL', 'PostgreSQL'],
    personalCredentials: [
        { id: 'pc1', key: 'VPN_USER', value: 'pschaefer_vpn', isSecret: false },
        { id: 'pc2', key: 'SSH_KEY_FINGERPRINT', value: 'SHA256:f4:a1:...', isSecret: true }
    ]
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Connor',
    username: 'skynet_hater',
    headline: 'Cybersecurity Analyst at TechDefense',
    email: 's.connor@defense.org',
    phone: '+1 555 999 0000',
    location: 'Los Angeles, USA',
    avatarUrl: 'https://picsum.photos/id/65/200/200',
    bannerUrl: 'https://picsum.photos/id/180/1200/400',
    about: 'Expert in threat detection and mitigation. Focused on securing critical infrastructure.',
    connections: 1200,
    experience: [],
    education: [],
    skills: ['Penetration Testing', 'Network Security', 'Python'],
    personalCredentials: []
  },
  {
    id: '3',
    firstName: 'John',
    lastName: 'Doe',
    username: 'jdoe_dev',
    headline: 'Full Stack Developer',
    email: 'john@example.com',
    phone: '+1 222 333 4444',
    location: 'New York, USA',
    avatarUrl: 'https://picsum.photos/id/91/200/200',
    bannerUrl: 'https://picsum.photos/id/20/1200/400',
    about: 'Building things for the web.',
    connections: 45,
    experience: [],
    education: [],
    skills: ['Java', 'Spring Boot', 'Angular'],
    personalCredentials: []
  },
  {
    id: '4',
    firstName: 'Alice',
    lastName: 'Wonderland',
    username: 'alice_w',
    headline: 'UX Designer',
    email: 'alice@design.io',
    phone: '+44 7700 900077',
    location: 'London, UK',
    avatarUrl: 'https://picsum.photos/id/342/200/200',
    bannerUrl: 'https://picsum.photos/id/119/1200/400',
    about: 'Designing intuitive experiences.',
    connections: 890,
    experience: [],
    education: [],
    skills: ['Figma', 'Sketch', 'User Research'],
    personalCredentials: []
  },
  {
    id: '5',
    firstName: 'Bob',
    lastName: 'Builder',
    username: 'can_we_fix_it',
    headline: 'Civil Engineer',
    email: 'bob@construction.com',
    phone: '+1 555 123 4567',
    location: 'Chicago, USA',
    avatarUrl: 'https://picsum.photos/id/237/200/200',
    bannerUrl: 'https://picsum.photos/id/13/1200/400',
    about: 'Yes we can.',
    connections: 120,
    experience: [],
    education: [],
    skills: ['AutoCAD', 'Project Management'],
    personalCredentials: []
  }
];

const MOCK_CREDS_GROUPS: SharedCredentialGroup[] = [
  {
    id: 'cg1',
    name: 'AWS Production',
    description: 'Keys for the main production environment',
    updatedAt: '2023-10-25T10:00:00Z',
    pairs: [
      { id: 'p1', key: 'AWS_ACCESS_KEY_ID', value: 'AKIAIOSFODNN7EXAMPLE', isSecret: false },
      { id: 'p2', key: 'AWS_SECRET_ACCESS_KEY', value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', isSecret: true },
      { id: 'p3', key: 'REGION', value: 'us-east-1', isSecret: false }
    ]
  },
  {
    id: 'cg2',
    name: 'Stripe API Test',
    description: 'Test credentials for payment gateway',
    updatedAt: '2023-11-02T14:30:00Z',
    pairs: [
      { id: 'p4', key: 'STRIPE_PUBLIC', value: 'pk_test_12345', isSecret: false },
      { id: 'p5', key: 'STRIPE_SECRET', value: 'sk_test_67890', isSecret: true }
    ]
  },
  {
    id: 'cg3',
    name: 'Database (Dev)',
    description: 'Local development database connection strings',
    updatedAt: '2023-09-15T09:15:00Z',
    pairs: []
  }
];

export const IdentityOverview: React.FC = () => {
  const [identities, setIdentities] = useState<Identity[]>(MOCK_IDENTITIES);
  const [credsGroups, setCredsGroups] = useState<SharedCredentialGroup[]>(MOCK_CREDS_GROUPS);
  const [viewState, setViewState] = useState<ViewState>({ type: 'overview' });

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

  const handleUpdateCreds = (updatedGroup: SharedCredentialGroup) => {
    setCredsGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleAddCredsGroup = () => {
    const newGroup: SharedCredentialGroup = {
      id: `new_${Date.now()}`,
      name: 'New Credentials',
      description: 'Description here...',
      updatedAt: new Date().toISOString(),
      pairs: []
    };
    setCredsGroups([...credsGroups, newGroup]);
    setViewState({ type: 'creds-detail', id: newGroup.id });
  };

  // -- Derived State for Main Content --
  const renderMainContent = () => {
    if (viewState.type === 'identity-detail') {
      const identity = identities.find(i => i.id === viewState.id);
      if (!identity) return <div>Not Found</div>;
      return <IdentityDetailView identity={identity} />;
    }

    if (viewState.type === 'creds-detail') {
      const group = credsGroups.find(g => g.id === viewState.id);
      if (!group) return <div>Not Found</div>;
      return <CredsDetailView group={group} onUpdate={handleUpdateCreds} />;
    }

    // Default: Overview Grid
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-background relative">
         {/* Background Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-techCyan/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="mb-8 relative z-10 border-l-4 border-techCyan pl-4">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide uppercase font-mono">Team Overview</h1>
          <p className="text-gray-500 font-mono text-sm">/ SYSTEM / DASHBOARD / MAIN</p>
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
            <span className="text-[10px] text-gray-400 font-mono">[{identities.length}]</span>
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
                    <div className="truncate text-[10px] text-gray-600 font-mono group-hover:text-techCyan/70 uppercase">Status: Active</div>
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
                   <div className="text-[10px] text-gray-600 truncate font-mono group-hover:text-techOrange/80 transition-colors">{">> "}{group.id}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>
        
        

      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        
        {/* Content Render */}
        <main className="flex-1 min-h-0 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
           {renderMainContent()}
        </main>

      </div>
    </div>
  );
};