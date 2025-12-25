import React from 'react';
import { 
  MapPin, Link as LinkIcon, Download, MoreHorizontal, 
  MessageSquare, Plus, Building2, GraduationCap, Award, 
  Globe, Mail, Phone, ExternalLink, Cpu, Activity 
} from 'lucide-react';
import { Identity } from '../types';

interface Props {
  identity: Identity;
}

export const IdentityDetailView: React.FC<Props> = ({ identity }) => {
  return (
    <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-20 px-4 pt-4">
        
        {/* --- HERO SECTION --- */}
        <div className="tech-panel mb-4 p-[1px]"> {/* wrapper for potential border effect */}
          
          {/* Banner */}
          <div className="h-48 md:h-64 w-full relative overflow-hidden">
            <img 
              src={identity.bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-techCyan/30"></div>
          </div>

          <div className="px-6 md:px-8 pb-8 bg-surface/50 backdrop-blur-sm relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 relative z-10 mb-6">
              
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-48 md:h-48 bg-background border border-techCyan/30 p-1 shadow-[0_0_30px_rgba(77,238,234,0.15)]">
                  <img 
                    src={identity.avatarUrl} 
                    alt={identity.firstName} 
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                {/* Tech corners for Avatar */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-techCyan"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-techCyan"></div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 md:mt-0 md:mb-2">
                <button className="px-6 py-2 tech-btn flex items-center gap-2 font-bold tracking-wider hover:bg-techCyan/20">
                  <MessageSquare size={16} />
                  Connect
                </button>
                <button className="px-6 py-2 tech-btn-secondary flex items-center gap-2 font-bold tracking-wider hover:border-techOrange hover:text-techOrange">
                  <Plus size={16} />
                  Follow
                </button>
                <button className="p-2 tech-btn-secondary hover:border-white hover:text-white">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-bold text-white uppercase tracking-tight font-mono">
                    {identity.firstName} <span className="text-gray-500">{identity.lastName}</span>
                    </h1>
                    <span className="text-xs text-techCyan border border-techCyan/30 px-2 py-1 bg-techCyan/5 font-mono">
                    ID: {identity.id.padStart(4, '0')}
                    </span>
                </div>
                
                <p className="text-lg text-techCyan font-medium tracking-wide">{identity.headline}</p>
                <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">{identity.location}</p>

                <div className="flex flex-wrap gap-y-1 gap-x-6 text-sm text-gray-400 mt-4 border-t border-white/5 pt-4">
                   <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-techOrange" />
                      <span>{identity.experience[0]?.company || 'FREE_AGENT'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Activity size={14} className="text-techOrange" />
                      <span>{identity.connections} NODES LINKED</span>
                   </div>
                </div>
              </div>

              {/* Sidebar within Hero (Mini Stats) */}
              <div className="hidden md:flex flex-col gap-2 justify-end border-l border-white/5 pl-8">
                 <div className="text-xs text-gray-500 uppercase font-mono mb-1">System Status</div>
                 <div className="flex items-center gap-2 text-techCyan">
                    <div className="w-2 h-2 bg-techCyan animate-pulse"></div>
                    <span className="font-mono text-sm">ONLINE</span>
                 </div>
                 <div className="h-1 w-full bg-white/5 mt-2 overflow-hidden">
                    <div className="h-full bg-techCyan/50 w-2/3"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-4">
              
              {/* ABOUT */}
              <section className="tech-panel p-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-wider border-b border-white/5 pb-2">
                    <span className="text-techCyan">//</span> BIO_DATA
                </h2>
                <p className="text-gray-400 leading-relaxed font-light whitespace-pre-line text-sm">
                  {identity.about}
                </p>
              </section>

              {/* EXPERIENCE */}
              <section className="tech-panel p-8">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                    <span className="text-techCyan">//</span> EXPERIENCE_LOG
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <Download size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6 relative ml-2">
                  {/* Timeline Vertical Line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/10"></div>

                  {identity.experience.map((exp, index) => (
                    <div key={exp.id} className="relative pl-8 group">
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1.5 w-4 h-4 bg-background border border-techCyan/50 group-hover:bg-techCyan group-hover:shadow-[0_0_10px_#4deeea] transition-all z-10"></div>
                      
                      <div className="mb-1 flex flex-col sm:flex-row sm:items-baseline justify-between">
                        <h3 className="text-base font-bold text-white group-hover:text-techCyan transition-colors font-mono">{exp.title}</h3>
                        <span className="text-xs text-gray-500 font-mono">{exp.startDate} — {exp.endDate}</span>
                      </div>
                      <div className="text-sm text-techOrange mb-2 font-mono uppercase">{exp.company}</div>
                      <p className="text-sm text-gray-400 font-light">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* EDUCATION */}
              <section className="tech-panel p-8">
                 <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                     <span className="text-techCyan">//</span> EDUCATION_DB
                  </h2>
                </div>
                
                <div className="grid gap-4">
                  {identity.education.map((edu) => (
                    <div key={edu.id} className="flex gap-4 p-4 border border-white/5 bg-white/[0.02] hover:border-techCyan/30 transition-colors">
                      <div className="w-10 h-10 flex-shrink-0 bg-techCyan/10 flex items-center justify-center text-techCyan">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">{edu.school}</h3>
                        <div className="text-xs text-gray-400 mt-1">{edu.degree}, {edu.fieldOfStudy}</div>
                        <div className="text-xs text-gray-600 font-mono mt-1">{edu.startDate} – {edu.endDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-4">
              
              {/* SKILLS */}
              <section className="tech-panel p-6">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Cpu size={16} className="text-techCyan" /> SKILL_MATRIX
                </h2>
                
                <div className="flex flex-wrap gap-2">
                  {identity.skills.map(skill => (
                    <div key={skill} className="px-3 py-1 bg-transparent border border-gray-700 text-xs text-gray-300 font-mono hover:border-techCyan hover:text-techCyan hover:bg-techCyan/5 transition-all cursor-default">
                      {skill}
                    </div>
                  ))}
                </div>
              </section>

              {/* PERSONAL DATA & CREDENTIALS (Internal) */}
              <section className="tech-panel p-6 border-t-2 border-t-techOrange">
                
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-sm font-bold text-techOrange uppercase tracking-wider flex items-center gap-2">
                     <Award size={16} /> RESTRICTED_DATA
                   </h2>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Communication Channels</div>
                      <div className="p-3 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-techCyan/30 transition-colors">
                        <span className="text-xs text-gray-400 font-mono">EMAIL</span>
                        <span className="text-xs font-mono text-white group-hover:text-techCyan truncate ml-2">{identity.email}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-techCyan/30 transition-colors">
                        <span className="text-xs text-gray-400 font-mono">PHONE</span>
                        <span className="text-xs font-mono text-white group-hover:text-techCyan truncate ml-2">{identity.phone}</span>
                      </div>
                   </div>
                   
                   <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Security Keys</div>
                      {identity.personalCredentials.slice(0, 3).map(cred => (
                        <div key={cred.id} className="p-2 bg-black/60 border border-white/5 flex flex-col group hover:border-techOrange/50 transition-colors">
                          <span className="text-[10px] text-gray-500 font-mono mb-1">{cred.key}</span>
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-mono text-techOrange truncate max-w-[150px]">
                               {cred.isSecret ? '••••••••••••••••' : cred.value}
                             </span>
                             <ExternalLink size={10} className="text-gray-600 group-hover:text-white" />
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                
                <div className="mt-4 pt-4 text-center">
                   <button className="text-xs font-mono text-gray-500 hover:text-white flex items-center justify-center gap-2 transition-colors w-full border border-transparent hover:border-white/10 p-2">
                     ACCESS_FULL_VAULT <MoreHorizontal size={12} />
                   </button>
                </div>
              </section>

          </div>

        </div>
      </div>
    </div>
  );
};