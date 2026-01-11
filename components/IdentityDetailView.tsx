import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Link as LinkIcon, Download, MoreHorizontal, 
  MessageSquare, Plus, Building2, GraduationCap, Award, 
  Globe, Mail, Phone, ExternalLink, Cpu, Activity, Save, X, Trash2, Camera, Link2, Key
} from 'lucide-react';
import { Identity, Experience, Education, CredentialPair, SharedCredentialGroup } from '../types';
import { uploadImage } from '../services/db';

interface Props {
  identity: Identity;
  availableVaults?: SharedCredentialGroup[];
  onSave: (updatedIdentity: Identity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const IdentityDetailView: React.FC<Props> = ({ identity, availableVaults = [], onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<Identity>(identity);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setData(identity);
    }
  }, [identity, isEditing]);

  const handleChange = (field: keyof Identity, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await onSave(data);
        setIsEditing(false);
    } catch (e) {
        console.error("Save failed", e);
        // Optional: Add toast notification here
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setData(identity);
    setIsEditing(false);
  };

  // --- List Managements ---
  const handleExpChange = (id: string, field: keyof Experience, value: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };
  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [{
        id: `new_${Date.now()}`,
        title: 'New Role',
        company: 'Company',
        location: 'Location',
        startDate: '',
        endDate: '',
        description: 'Description...'
      }, ...prev.experience]
    }));
  };
  const removeExperience = (id: string) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
  };

  const handleEduChange = (id: string, field: keyof Education, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };
  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [{
        id: `new_${Date.now()}`,
        school: 'University',
        degree: 'Degree',
        fieldOfStudy: 'Field',
        startDate: '',
        endDate: ''
      }, ...prev.education]
    }));
  };
  const removeEducation = (id: string) => {
    setData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  // --- Creds / Vars ---
  const addPersonalCred = () => {
    setData(prev => ({
      ...prev,
      personalCredentials: [...prev.personalCredentials, {
        id: `pc_${Date.now()}`,
        key: '',
        value: '',
        isSecret: false
      }]
    }));
  };
  const updatePersonalCred = (id: string, field: keyof CredentialPair, value: any) => {
    setData(prev => ({
      ...prev,
      personalCredentials: prev.personalCredentials.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };
  const removePersonalCred = (id: string) => {
    setData(prev => ({ ...prev, personalCredentials: prev.personalCredentials.filter(p => p.id !== id) }));
  };

  // --- Skills ---
  const addSkill = (skill: string) => {
    if (skill && !data.skills.includes(skill)) {
      setData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };
  const removeSkill = (skill: string) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  // --- Image Upload ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'bannerUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { url } = await uploadImage(file);
        handleChange(field, url);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  // --- Vault Linking ---
  const toggleVaultLink = (vaultId: string) => {
    const currentLinks = data.linkedVaultIds || [];
    if (currentLinks.includes(vaultId)) {
      handleChange('linkedVaultIds', currentLinks.filter(id => id !== vaultId));
    } else {
      handleChange('linkedVaultIds', [...currentLinks, vaultId]);
    }
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-20 px-4 pt-4">
        
        {/* --- HERO SECTION --- */}
        <div className="tech-panel mb-4 p-[1px] relative"> 
          
          {/* Banner */}
          <div className="h-48 md:h-64 w-full relative overflow-hidden group">
            <img 
              src={data.bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-techCyan/30"></div>
            
            {isEditing && (
              <button 
                onClick={() => bannerInputRef.current?.click()}
                className="absolute top-4 right-4 bg-black/60 hover:bg-techCyan/20 text-white p-2 border border-white/10 hover:border-techCyan transition-colors"
              >
                <Camera size={18} />
                <input 
                  type="file" 
                  ref={bannerInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                />
              </button>
            )}
          </div>

          <div className="px-6 md:px-8 pb-8 bg-surface/50 backdrop-blur-sm relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 relative z-10 mb-6">
              
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-48 md:h-48 bg-background border border-techCyan/30 p-1 shadow-[0_0_30px_rgba(77,238,234,0.15)] relative">
                  <img 
                    src={data.avatarUrl} 
                    alt={data.firstName} 
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  {isEditing && (
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="text-white" size={24} />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatarUrl')}
                      />
                    </div>
                  )}
                </div>
                {/* Tech corners for Avatar */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-techCyan"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-techCyan"></div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 md:mt-0 md:mb-2 items-center">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="px-6 py-2 tech-btn flex items-center gap-2 font-bold tracking-wider bg-techCyan/20 text-white hover:bg-techCyan/40"
                    >
                      <Save size={16} />
                      {isSaving ? 'SAVING...' : 'SAVE_CHANGES'}
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="px-6 py-2 tech-btn-secondary flex items-center gap-2 font-bold tracking-wider text-red-400 border-red-900/50 hover:border-red-500 hover:text-red-500"
                    >
                      <X size={16} />
                      CANCEL
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 tech-btn flex items-center gap-2 font-bold tracking-wider hover:bg-techCyan/20"
                    >
                      <MessageSquare size={16} />
                      EDIT_PROFILE
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="p-2 tech-btn-secondary hover:border-red-500 hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                      {showDeleteConfirm && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-red-500 p-2 z-50 shadow-xl">
                          <p className="text-xs text-red-500 mb-2">CONFIRM DELETION?</p>
                          <button 
                            onClick={() => onDelete(data.id)}
                            className="w-full text-center bg-red-900/50 text-red-200 text-xs py-1 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            YES, DELETE
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-3">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="tech-input p-2 text-2xl font-bold uppercase" 
                      value={data.firstName} 
                      onChange={e => handleChange('firstName', e.target.value)}
                      placeholder="First Name"
                    />
                    <input 
                      className="tech-input p-2 text-2xl font-bold uppercase" 
                      value={data.lastName} 
                      onChange={e => handleChange('lastName', e.target.value)}
                      placeholder="Last Name"
                    />
                    <input 
                      className="tech-input p-2 col-span-2 text-lg text-techCyan" 
                      value={data.headline} 
                      onChange={e => handleChange('headline', e.target.value)}
                      placeholder="Headline / Role"
                    />
                     <input 
                      className="tech-input p-2 text-sm uppercase" 
                      value={data.location} 
                      onChange={e => handleChange('location', e.target.value)}
                      placeholder="Location"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-bold text-white uppercase tracking-tight font-mono">
                        {data.firstName} <span className="text-gray-500">{data.lastName}</span>
                        </h1>
                        <span className="text-xs text-techCyan border border-techCyan/30 px-2 py-1 bg-techCyan/5 font-mono">
                        ID: {data.id.slice(-4)}
                        </span>
                    </div>
                    
                    <p className="text-lg text-techCyan font-medium tracking-wide">{data.headline}</p>
                    <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">{data.location}</p>
                  </>
                )}

                <div className="flex flex-wrap gap-y-1 gap-x-6 text-sm text-gray-400 mt-4 border-t border-white/5 pt-4">
                   <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-techOrange" />
                      <span>{data.experience[0]?.company || 'FREE_AGENT'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Activity size={14} className="text-techOrange" />
                      <span>{data.connections} NODES LINKED</span>
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
                {isEditing ? (
                  <textarea 
                    className="tech-input p-4 w-full h-40 text-sm leading-relaxed"
                    value={data.about}
                    onChange={e => handleChange('about', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-400 leading-relaxed font-light whitespace-pre-line text-sm">
                    {data.about || "No bio data available."}
                  </p>
                )}
              </section>

              {/* EXPERIENCE */}
              <section className="tech-panel p-8">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                    <span className="text-techCyan">//</span> EXPERIENCE_LOG
                  </h2>
                  {isEditing && (
                    <button onClick={addExperience} className="text-xs flex items-center gap-1 text-techCyan hover:text-white">
                      <Plus size={12} /> ADD ENTRY
                    </button>
                  )}
                </div>
                
                <div className="space-y-6 relative ml-2">
                  {!isEditing && <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/10"></div>}

                  {data.experience.map((exp, index) => (
                    <div key={exp.id} className={`relative ${isEditing ? 'p-4 border border-white/5 bg-black/20 mb-4' : 'pl-8 group'}`}>
                      {isEditing ? (
                         <div className="space-y-2">
                           <div className="flex justify-between">
                              <input className="tech-input w-2/3 p-1 font-bold" value={exp.title} onChange={e => handleExpChange(exp.id, 'title', e.target.value)} placeholder="Title" />
                              <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-400"><X size={14}/></button>
                           </div>
                           <input className="tech-input w-full p-1 text-sm" value={exp.company} onChange={e => handleExpChange(exp.id, 'company', e.target.value)} placeholder="Company" />
                           <div className="flex gap-2">
                             <input className="tech-input w-1/2 p-1 text-xs" value={exp.startDate} onChange={e => handleExpChange(exp.id, 'startDate', e.target.value)} placeholder="Start Date" />
                             <input className="tech-input w-1/2 p-1 text-xs" value={exp.endDate} onChange={e => handleExpChange(exp.id, 'endDate', e.target.value)} placeholder="End Date" />
                           </div>
                           <textarea className="tech-input w-full p-1 text-xs h-16" value={exp.description} onChange={e => handleExpChange(exp.id, 'description', e.target.value)} placeholder="Description" />
                         </div>
                      ) : (
                        <>
                          <div className="absolute left-0 top-1.5 w-4 h-4 bg-background border border-techCyan/50 group-hover:bg-techCyan group-hover:shadow-[0_0_10px_#4deeea] transition-all z-10"></div>
                          <div className="mb-1 flex flex-col sm:flex-row sm:items-baseline justify-between">
                            <h3 className="text-base font-bold text-white group-hover:text-techCyan transition-colors font-mono">{exp.title}</h3>
                            <span className="text-xs text-gray-500 font-mono">{exp.startDate} — {exp.endDate}</span>
                          </div>
                          <div className="text-sm text-techOrange mb-2 font-mono uppercase">{exp.company}</div>
                          <p className="text-sm text-gray-400 font-light">{exp.description}</p>
                        </>
                      )}
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
                  {isEditing && (
                    <button onClick={addEducation} className="text-xs flex items-center gap-1 text-techCyan hover:text-white">
                      <Plus size={12} /> ADD ENTRY
                    </button>
                  )}
                </div>
                
                <div className="grid gap-4">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="flex gap-4 p-4 border border-white/5 bg-white/[0.02] hover:border-techCyan/30 transition-colors">
                      <div className="w-10 h-10 flex-shrink-0 bg-techCyan/10 flex items-center justify-center text-techCyan">
                        <GraduationCap size={20} />
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                             <input className="tech-input w-full p-1 text-sm font-bold" value={edu.school} onChange={e => handleEduChange(edu.id, 'school', e.target.value)} placeholder="School" />
                             <div className="flex gap-2">
                                <input className="tech-input w-1/2 p-1 text-xs" value={edu.degree} onChange={e => handleEduChange(edu.id, 'degree', e.target.value)} placeholder="Degree" />
                                <input className="tech-input w-1/2 p-1 text-xs" value={edu.fieldOfStudy} onChange={e => handleEduChange(edu.id, 'fieldOfStudy', e.target.value)} placeholder="Field" />
                             </div>
                             <div className="flex gap-2 items-center">
                                <input className="tech-input w-1/3 p-1 text-xs" value={edu.startDate} onChange={e => handleEduChange(edu.id, 'startDate', e.target.value)} placeholder="Start" />
                                <span className="text-gray-500">-</span>
                                <input className="tech-input w-1/3 p-1 text-xs" value={edu.endDate} onChange={e => handleEduChange(edu.id, 'endDate', e.target.value)} placeholder="End" />
                                <button onClick={() => removeEducation(edu.id)} className="ml-auto text-red-500 hover:text-red-300"><Trash2 size={12}/></button>
                             </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-bold text-white font-mono">{edu.school}</h3>
                            <div className="text-xs text-gray-400 mt-1">{edu.degree}, {edu.fieldOfStudy}</div>
                            <div className="text-xs text-gray-600 font-mono mt-1">{edu.startDate} – {edu.endDate}</div>
                          </>
                        )}
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
                  {data.skills.map(skill => (
                    <div key={skill} className="group relative px-3 py-1 bg-transparent border border-gray-700 text-xs text-gray-300 font-mono hover:border-techCyan hover:text-techCyan hover:bg-techCyan/5 transition-all cursor-default">
                      {skill}
                      {isEditing && (
                        <button onClick={() => removeSkill(skill)} className="ml-2 text-red-500 font-bold hover:text-white">x</button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <input 
                         className="tech-input w-24 p-1 text-xs" 
                         placeholder="NEW SKILL"
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             addSkill(e.currentTarget.value);
                             e.currentTarget.value = '';
                           }
                         }}
                      />
                    </div>
                  )}
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
                      {isEditing ? (
                        <div className="space-y-2">
                           <input className="tech-input w-full p-2 text-xs" value={data.email} onChange={e => handleChange('email', e.target.value)} placeholder="EMAIL" />
                           <input className="tech-input w-full p-2 text-xs" value={data.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="PHONE" />
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-techCyan/30 transition-colors">
                            <span className="text-xs text-gray-400 font-mono">EMAIL</span>
                            <span className="text-xs font-mono text-white group-hover:text-techCyan truncate ml-2">{data.email}</span>
                          </div>
                          <div className="p-3 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-techCyan/30 transition-colors">
                            <span className="text-xs text-gray-400 font-mono">PHONE</span>
                            <span className="text-xs font-mono text-white group-hover:text-techCyan truncate ml-2">{data.phone}</span>
                          </div>
                        </>
                      )}
                   </div>
                   
                   <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Arbitrary Attributes / Keys</div>
                        {isEditing && <button onClick={addPersonalCred} className="text-techCyan hover:text-white"><Plus size={12}/></button>}
                      </div>

                      {data.personalCredentials.map(cred => (
                        <div key={cred.id} className="p-2 bg-black/60 border border-white/5 flex flex-col group hover:border-techOrange/50 transition-colors">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                               <input className="tech-input p-1 text-[10px]" value={cred.key} onChange={e => updatePersonalCred(cred.id, 'key', e.target.value)} placeholder="KEY" />
                               <div className="flex gap-1">
                                  <input className="tech-input p-1 text-[10px] flex-1" value={cred.value} onChange={e => updatePersonalCred(cred.id, 'value', e.target.value)} placeholder="VALUE" />
                                  <button onClick={() => updatePersonalCred(cred.id, 'isSecret', !cred.isSecret)} className={`${cred.isSecret ? 'text-techOrange' : 'text-gray-500'}`}><Key size={12}/></button>
                                  <button onClick={() => removePersonalCred(cred.id)} className="text-red-500"><X size={12}/></button>
                               </div>
                            </div>
                          ) : (
                            <>
                              <span className="text-[10px] text-gray-500 font-mono mb-1">{cred.key}</span>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-techOrange truncate max-w-[150px]">
                                  {cred.isSecret ? '••••••••••••••••' : cred.value}
                                </span>
                                <ExternalLink size={10} className="text-gray-600 group-hover:text-white" />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                   </div>

                   {/* LINKED VAULTS */}
                   <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Linked Vaults</div>
                      {isEditing ? (
                        <div className="space-y-1">
                           {availableVaults.map(vault => (
                             <div key={vault.id} onClick={() => toggleVaultLink(vault.id)} className={`cursor-pointer p-2 border text-xs font-mono flex items-center gap-2 ${data.linkedVaultIds?.includes(vault.id) ? 'border-techCyan bg-techCyan/10 text-white' : 'border-gray-800 text-gray-500'}`}>
                                <div className={`w-3 h-3 border ${data.linkedVaultIds?.includes(vault.id) ? 'bg-techCyan border-techCyan' : 'border-gray-600'}`}></div>
                                {vault.name}
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(data.linkedVaultIds || []).map(vid => {
                             const vault = availableVaults.find(v => v.id === vid);
                             if (!vault) return null;
                             return (
                               <div key={vid} className="p-2 bg-techCyan/5 border border-techCyan/20 flex items-center gap-2 text-xs text-techCyan font-mono">
                                  <Link2 size={12} />
                                  {vault.name}
                               </div>
                             );
                          })}
                          {(!data.linkedVaultIds || data.linkedVaultIds.length === 0) && <div className="text-xs text-gray-600 font-mono italic">NO_LINKED_VAULTS</div>}
                        </div>
                      )}
                   </div>
                </div>
              </section>

          </div>

        </div>
      </div>
    </div>
  );
};