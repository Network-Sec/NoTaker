import React from 'react';
import { Mail, Phone, MapPin, ArrowRight, Zap } from 'lucide-react';
import { Identity } from '../types';

interface Props {
  identity: Identity;
  onClick: () => void;
}

export const IdentityProfileCard: React.FC<Props> = ({ identity, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group tech-panel p-5 cursor-pointer h-full flex flex-col relative overflow-hidden"
    >
      {/* Tech decoration lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-techCyan/20"></div>

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="relative">
          <img 
            src={identity.avatarUrl} 
            alt={`${identity.firstName} ${identity.lastName}`} 
            className="w-16 h-16 object-cover border border-techCyan/30 shadow-[0_0_10px_rgba(77,238,234,0.15)]"
          />
          {/* Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-techCyan border border-black"></div>
        </div>
        <button className="p-2 bg-surfaceHighlight hover:bg-techCyan/20 text-gray-400 hover:text-techCyan transition-colors border border-white/5 hover:border-techCyan/50">
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mb-4 relative z-10">
        <h3 className="text-xl font-bold text-white group-hover:text-techCyan transition-colors uppercase tracking-tight">
          {identity.firstName} {identity.lastName}
        </h3>
        <p className="text-sm text-techOrange/80 font-mono mt-1">@{identity.username}</p>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[2.5rem] border-l-2 border-white/5 pl-2">
          {identity.headline}
        </p>
      </div>

      <div className="mt-auto space-y-2 border-t border-white/5 pt-4 relative z-10">
        <div className="flex items-center text-xs text-gray-400 gap-2 font-mono">
          <Mail size={12} className="text-techCyan/70" />
          <span className="truncate opacity-80">{identity.email}</span>
        </div>
        <div className="flex items-center text-xs text-gray-400 gap-2 font-mono">
          <Phone size={12} className="text-techCyan/70" />
          <span className="opacity-80">{identity.phone}</span>
        </div>
        <div className="flex items-center text-xs text-gray-400 gap-2 font-mono">
          <MapPin size={12} className="text-techCyan/70" />
          <span className="truncate opacity-80">{identity.location}</span>
        </div>
      </div>
      
      {/* Hover effect background scan */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-techCyan/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none"></div>
    </div>
  );
};