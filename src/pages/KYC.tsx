import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export function KYCPage() {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.displayName || '',
    dob: '',
    phone: userProfile?.phoneNumber || '+91 ',
    location: userProfile?.location || '',
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, 'IDLE' | 'UPLOADING' | 'SECURED'>>({
    aadhaar: 'IDLE',
    pan: 'IDLE',
    dl: 'IDLE'
  });

  const isStep1Valid = formData.fullName.trim() !== '' && formData.dob !== '' && formData.phone.trim().length > 4;
  const isStep2Valid = formData.location.trim() !== '';
  const isStep3Valid = Object.values(uploadedDocs).every(status => status === 'SECURED');

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          const city = data.city || data.locality || "Detected Zone";
          const region = data.principalSubdivision || "";
          setFormData(f => ({ ...f, location: `${city}${region ? ', ' + region : ''}` }));
          setSuggestions([]);
        } catch (err) {
          console.error("Geocoding failed", err);
        }
      });
    }
  };

  React.useEffect(() => {
    if (step === 2 && !formData.location) {
      detectLocation();
    }
  }, [step]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15`);
      const data = await resp.json();
      const indiaOnly = (data.features || []).filter((item: any) => 
        item.properties.country === 'India' || 
        item.properties.countrycode === 'IN' || 
        (item.properties.label && item.properties.label.toLowerCase().includes('india'))
      ).slice(0, 5);
      setSuggestions(indiaOnly);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = (id: string) => {
    if (uploadedDocs[id] === 'SECURED') return;
    setUploadedDocs(prev => ({ ...prev, [id]: 'UPLOADING' }));
    setTimeout(() => {
      setUploadedDocs(prev => ({ ...prev, [id]: 'SECURED' }));
    }, 2000);
  };

  const handleFinalSubmit = async () => {
    setIsVerifying(true);
    await updateProfileData({
      ...formData,
      govtKycStatus: 'PENDING',
      verificationScore: 40,
      updatedAt: new Date().toISOString(),
    });
    setTimeout(() => { 
      setIsVerifying(false); 
      navigate('/profile'); 
    }, 2500);
  };

  return (
    <div className="h-screen bg-[#f8faff] font-body text-primary flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(232,239,255,0.4)_100%)] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center w-full px-10 py-5 flex-shrink-0 z-50">
        <div className="text-lg font-black tracking-tight text-[#001944] font-headline cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => navigate('/')}>
          Kinetic Trust
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[#4a6ba5] hover:text-[#001944] transition-colors relative">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button onClick={() => navigate('/profile')} className="text-[#4a6ba5] hover:text-[#001944] transition-colors">
            <span className="material-symbols-outlined text-xl">account_circle</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full max-w-7xl mx-auto relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-xl space-y-6">
              <div className="flex flex-col gap-1.5 px-1">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#4a6ba5]">Step 1 of 3</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Verification</span>
                 </div>
                 <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-[#001944] rounded-full transition-all duration-700" />
                 </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-[#001944] font-headline tracking-tight uppercase leading-none">Personal Details</h1>
                <p className="text-[#4a6ba5]/70 text-[10px] max-w-md mx-auto font-black uppercase tracking-widest leading-none pt-1">Provide legal info for secure 256-bit vault calibration.</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 transition-all hover:border-[#4a6ba5]/20">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-[#4a6ba5] mb-2 px-1">Full Legal Name</label>
                    <input 
                      value={formData.fullName} 
                      onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[#001944] font-bold text-xs outline-none focus:bg-white focus:border-[#4a6ba5]/30 transition-all placeholder:text-slate-200" 
                      placeholder="Johnathan Doe" type="text"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 transition-all hover:border-[#4a6ba5]/20">
                       <label className="block text-[8px] font-black uppercase tracking-widest text-[#4a6ba5] mb-2">Date of Birth</label>
                       <input 
                         value={formData.dob}
                         onChange={e => setFormData(f => ({ ...f, dob: e.target.value }))}
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[#001944] font-bold text-xs outline-none focus:bg-white focus:border-[#4a6ba5]/30 transition-all" type="date"
                       />
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-50 space-y-2 transition-all hover:border-[#4a6ba5]/20">
                      <label className="text-[8px] font-black tracking-widest text-[#4a6ba5] uppercase">Mobile Number</label>
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#001944]/20 transition-all">
                        <div className="p-3 text-[10px] font-black text-[#001944] border-r border-slate-100">+91</div>
                        <input 
                          type="tel"
                          value={formData.phone.replace('+91', '').trim()}
                          onChange={(e) => setFormData({ ...formData, phone: '+91 ' + e.target.value })}
                          className="w-full p-2.5 bg-transparent text-[#001944] font-bold text-[10px] outline-none placeholder:text-slate-300" 
                          placeholder="000-0000" 
                        />
                      </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => isStep1Valid && setStep(2)} 
                   disabled={!isStep1Valid}
                   className={cn(
                     "w-full py-5 bg-[#001944] text-white font-black text-xs rounded-xl shadow-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.3em] active:scale-[0.98]",
                     !isStep1Valid ? "opacity-30 cursor-not-allowed grayscale" : "hover:scale-[1.01] hover:bg-black shadow-[#001944]/20"
                   )}
                 >
                   <span>Next: Select Location</span>
                   <span className="material-symbols-outlined text-lg">arrow_forward</span>
                 </button>
                 <p className="text-center text-[7px] font-black uppercase tracking-[0.4em] text-slate-300">Secure 256-bit encrypted environment</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full space-y-5">
               <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full px-1">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4a6ba5]">Step 2 of 3</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Location</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-[#001944] rounded-full transition-all duration-700" />
                 </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-[#001944] font-headline tracking-tighter uppercase leading-none">Operation Center</h1>
                <p className="text-[#4a6ba5]/70 text-[9px] font-black uppercase tracking-widest italic leading-none pt-1">Synchronizing local tactical geodata for vault calibration.</p>
              </div>

              <div className="max-w-5xl mx-auto w-full bg-white p-1 rounded-2xl shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative group">
                  <div className="h-[280px] w-full bg-slate-50 relative overflow-hidden rounded-[14px]">
                    <div className="absolute inset-0 grayscale opacity-40 mix-blend-multiply group-hover:opacity-60 transition-opacity">
                      <iframe 
                        width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.location || 'India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        style={{ filter: 'contrast(1.2) brightness(1.1) grayscale(1)' }}
                      ></iframe>
                    </div>

                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
                       <div className="bg-white/90 backdrop-blur-md border border-white shadow-2xl rounded-xl p-1.5 flex items-center gap-2 group/search">
                          <div className="flex-1 relative">
                             <input 
                               value={formData.location}
                               onChange={(e) => {
                                 setFormData(f => ({ ...f, location: e.target.value }));
                                 searchLocations(e.target.value);
                               }}
                               className="w-full bg-transparent py-2.5 px-11 text-[#001944] font-black text-[10px] outline-none placeholder:text-slate-300 uppercase tracking-widest"
                               placeholder="Assign Sector..."
                             />
                             <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a6ba5] text-lg opacity-40">pin_drop</span>
                          </div>
                          <button onClick={detectLocation} className="bg-[#001944] text-white p-2 rounded-lg flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-lg px-3">
                             <span className="material-symbols-outlined text-sm">my_location</span>
                             <span className="text-[8px] font-black uppercase tracking-widest pr-1 hidden sm:block">Pulse</span>
                          </button>

                          {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,10,68,0.15)] overflow-hidden z-[100] max-h-[180px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-slate-50">
                                {suggestions.map((item: any) => {
                                  const name = item.properties.name;
                                  const sub = [item.properties.city, item.properties.state].filter(Boolean).slice(0, 2).join(', ');
                                  return (
                                    <button 
                                      key={item.properties.osm_id} 
                                      onClick={() => { setFormData(f => ({ ...f, location: name + (item.properties.state ? ', ' + item.properties.state : '') })); setSuggestions([]); }}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-center gap-3"
                                    >
                                      <span className="material-symbols-outlined text-sm text-[#4a6ba5]/20">adjust</span>
                                      <div className="min-w-0">
                                         <p className="text-[9px] font-black text-[#001944] uppercase tracking-widest truncate">{name}</p>
                                         <p className="text-[7px] font-bold text-[#4a6ba5]/40 uppercase truncate leading-tight">{sub || 'India'}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end z-30">
                       <div className="bg-[#001944] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-4">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                             <span className="material-symbols-outlined text-base">satellite_alt</span>
                          </div>
                          <div>
                             <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.4em] mb-1">Satellite Sector</p>
                             <h3 className="text-[11px] font-black font-headline tracking-tighter uppercase leading-none truncate max-w-[160px]">{formData.location || "Detecting Zone..."}</h3>
                          </div>
                       </div>
                       <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-white flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#4a6ba5]">Grid Verified</span>
                       </div>
                    </div>
                  </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5 max-w-5xl mx-auto w-full">
                 <button onClick={() => setStep(1)} className="text-[#4a6ba5] font-black uppercase tracking-widest text-[9px] hover:text-[#001944] transition-all">Back: Legal</button>
                 <button 
                   onClick={() => isStep2Valid && setStep(3)} 
                   disabled={!isStep2Valid}
                   className={cn(
                     "px-12 py-4.5 bg-[#001944] text-white font-black text-[11px] rounded-xl shadow-2xl flex items-center gap-3 transition-all uppercase tracking-[0.4em] active:scale-[0.98] group",
                     !isStep2Valid ? "opacity-30 cursor-not-allowed grayscale" : "hover:bg-black shadow-[#001944]/30"
                   )}
                 >
                    <span>Synchronize Vault</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-all">bolt</span>
                 </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl space-y-6">
              <div className="flex flex-col gap-1.5 px-1">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4a6ba5]">Step 3 of 3</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Finalization</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-[#001944] rounded-full transition-all duration-700" />
                 </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-[#001944] font-headline tracking-tight uppercase leading-none">Identity Archive</h1>
                <p className="text-[#4a6ba5]/70 text-[10px] font-black uppercase tracking-widest italic pt-1">Populate secure identity archives to finalize vault encryption.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { id: 'aadhaar', title: 'Aadhaar Card', icon: 'fingerprint' },
                  { id: 'pan', title: 'PAN Card', icon: 'credit_card' },
                  { id: 'dl', title: 'Driving License', icon: 'directions_car' }
                ].map((doc) => (
                  <button key={doc.id} onClick={() => handleUpload(doc.id)} className={cn(
                    "bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/40 border-2 flex flex-col items-center gap-4 group cursor-pointer transition-all relative overflow-hidden",
                    uploadedDocs[doc.id] === 'SECURED' ? "border-green-500/30" : "border-slate-50 hover:border-[#4a6ba5]/30 hover:scale-[1.02]"
                  )}>
                    {uploadedDocs[doc.id] === 'UPLOADING' && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#001944]" />
                        <span className="text-[8px] font-black text-[#001944] uppercase tracking-[0.3em] animate-pulse">Archiving...</span>
                      </div>
                    )}
                    
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                       <span className="material-symbols-outlined text-4xl">{doc.icon}</span>
                    </div>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative z-10 transition-all duration-500",
                      uploadedDocs[doc.id] === 'SECURED' ? "bg-green-600 shadow-green-500/20" : "bg-[#001944] shadow-[#001944]/20 group-hover:rotate-6"
                    )}>
                       <span className="material-symbols-outlined text-white text-3xl">
                         {uploadedDocs[doc.id] === 'SECURED' ? 'verified' : doc.icon}
                       </span>
                    </div>
                    <div className="text-center z-10">
                       <h3 className="text-[11px] font-black text-[#001944] uppercase tracking-widest mb-1">{doc.title}</h3>
                       <div className="flex items-center justify-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", uploadedDocs[doc.id] === 'SECURED' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-300 animate-pulse")}></span>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", uploadedDocs[doc.id] === 'SECURED' ? "text-green-600" : "text-[#4a6ba5]/50")}>
                             {uploadedDocs[doc.id] === 'SECURED' ? 'Ready for Review' : 'Awaiting File'}
                          </p>
                       </div>
                    </div>
                    <div className={cn(
                      "w-full h-10 rounded-xl border border-dashed flex items-center justify-center transition-all",
                      uploadedDocs[doc.id] === 'SECURED' ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200 group-hover:bg-[#001944] group-hover:border-transparent"
                    )}>
                       <span className={cn("material-symbols-outlined text-lg", uploadedDocs[doc.id] === 'SECURED' ? "text-green-600" : "text-[#4a6ba5]/40 group-hover:text-white")}>
                         {uploadedDocs[doc.id] === 'SECURED' ? 'task_alt' : 'cloud_upload'}
                       </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-4">
                 <button 
                   onClick={handleFinalSubmit} 
                   disabled={isVerifying || !isStep3Valid} 
                   className={cn(
                     "w-full py-5 rounded-2xl font-black text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 uppercase",
                     !isStep3Valid ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50" : "bg-[#001944] text-white hover:bg-black shadow-[#001944]/30 hover:scale-[1.01] active:scale-[0.99]"
                   )}
                 >
                    {isVerifying ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="animate-pulse">Verifying Archive...</span>
                      </div>
                    ) : (
                      <>
                        <span>Activate Secure Vault</span>
                        <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                      </>
                    )}
                 </button>
                 <button onClick={() => navigate('/dashboard')} className="w-full text-slate-300 font-black text-[8px] hover:text-[#001944] transition-colors py-1 uppercase tracking-[0.4em]">Postpone Finalization Protocol</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full py-6 text-center text-primary/10 flex-shrink-0 mt-auto z-50">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2024 Kinetic Trust Infrastructure</p>
          <div className="flex gap-10">
            <a className="text-[10px] font-black uppercase tracking-[0.4em] hover:text-secondary transition-colors" href="#">Privacy Protocol</a>
            <a className="text-[10px] font-black uppercase tracking-[0.4em] hover:text-secondary transition-colors" href="#">Vault Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
