import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, MapPin, Phone, Mail, Award, CheckCircle, ChevronRight, Settings, LogOut, Camera, Fingerprint, Activity, Wallet, CreditCard, Bell, Save, X, ArrowRight, XCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const navigate = useNavigate();
  const { user, userProfile, loading, logout, updateProfileData } = useAuth();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  if (loading) {
// ... existing skeleton code ...
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
        <section className="tech-card p-8 flex flex-col md:flex-row items-center gap-10 bg-surface-container-low h-48 rounded-3xl"></section>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-8">
            <div className="tech-card h-64 bg-surface-container-low rounded-2xl"></div>
            <div className="tech-card h-64 bg-surface-container-high rounded-2xl"></div>
          </div>
          <div className="md:col-span-8 space-y-8">
            <div className="tech-card h-64 bg-surface-container-low rounded-2xl"></div>
            <div className="tech-card h-64 bg-surface-container-low rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const profileData = {
    name: userProfile?.displayName || user?.displayName || 'User',
    email: userProfile?.email || user?.email || 'No email',
    role: userProfile?.role || 'User',
    photoURL: userProfile?.photoURL || user?.photoURL || 'https://picsum.photos/seed/user-profile/200/200',
    location: userProfile?.location || 'Not set',
    phoneNumber: userProfile?.phoneNumber || 'Not set',
    biometricIdStatus: userProfile?.biometricIdStatus || 'PENDING',
    biometricIdScore: userProfile?.biometricIdScore || 0,
    govtKycStatus: userProfile?.govtKycStatus || 'PENDING',
    govtKycScore: userProfile?.govtKycScore || 0,
    behavioralTrustStatus: userProfile?.behavioralTrustStatus || 'INACTIVE',
    behavioralTrustScore: userProfile?.behavioralTrustScore || 0,
    walletBalance: userProfile?.walletBalance || 0,
    reliabilityIndex: userProfile?.reliabilityIndex || 0,
    disruptionResilience: userProfile?.disruptionResilience || 0,
    systemEvaluation: userProfile?.systemEvaluation || 'No evaluation available.',
    notificationPrefs: userProfile?.notificationPrefs || 'Not configured',
    systemConfig: userProfile?.systemConfig || 'v2.4 Stable Node',
  };

  const startEditing = (section: string, initialValues: any) => {
    setEditingSection(section);
    setEditValues(initialValues);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const saveEditing = async () => {
    await updateProfileData(editValues);
    setEditingSection(null);
    setEditValues({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditValues((prev: any) => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value 
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8">
      {/* Profile Header */}
      <section className="tech-card p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none"></div>
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-slate-50 relative group">
            <img 
              alt="Worker Profile" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              src={profileData.photoURL}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button className="absolute -bottom-2 -right-2 p-3 bg-secondary text-white rounded-xl shadow-xl hover:scale-110 transition-transform border-4 border-white z-20">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 text-center md:text-left z-10">
          {editingSection === 'header' ? (
            <div className="space-y-4">
              <input
                name="displayName"
                value={editValues.displayName || ''}
                onChange={handleInputChange}
                className="text-2xl font-bold text-primary bg-white border border-slate-200 rounded-lg px-3 py-1 w-full"
                placeholder="Display Name"
              />
              <input
                name="photoURL"
                value={editValues.photoURL || ''}
                onChange={handleInputChange}
                className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1 w-full"
                placeholder="Photo URL"
              />
              <input
                name="location"
                value={editValues.location || ''}
                onChange={handleInputChange}
                className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1 w-full"
                placeholder="Location"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                <h2 className="text-3xl font-bold text-primary tracking-tight font-display">{profileData.name}</h2>
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest self-center md:self-auto border border-secondary/20">
                  {profileData.role}
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-secondary" /> {profileData.location}
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
              <Shield className="w-4 h-4 text-secondary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-tight">Verified Architecture</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
              <Award className="w-4 h-4 text-tertiary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-tight">Top 1% Reliability</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[200px] z-10">
          {editingSection === 'header' ? (
            <>
              <button onClick={saveEditing} className="w-full py-3.5 bg-success text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-success/90 transition-all shadow-lg flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button onClick={cancelEditing} className="w-full py-3.5 border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => startEditing('header', { displayName: profileData.name, location: profileData.location, photoURL: profileData.photoURL })}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Edit Architecture
              </button>
              <button className="w-full py-3.5 border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-primary transition-all">
                View Public ID
              </button>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Identity & Verification Hub */}
        <div className="md:col-span-4 space-y-8">
          <div className="tech-card p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl rounded-full"></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">Verification hub</h4>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                profileData.govtKycStatus === 'VERIFIED' ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
              )}>
                {profileData.govtKycStatus === 'PENDING' ? 'IN PROCESS' : profileData.govtKycStatus}
              </div>
            </div>
            
            <div className="space-y-5 relative z-10">
              {[
                { label: 'Identity Node', icon: Fingerprint, status: profileData.govtKycStatus, score: profileData.govtKycScore },
                { label: 'Behavioral Trust', icon: Activity, status: profileData.behavioralTrustStatus, score: profileData.behavioralTrustScore },
              ].map((item, i) => (
                <div key={i} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-primary block">{item.label}</span>
                      <span className="text-[10px] font-bold text-outline uppercase">{item.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary font-mono">{item.score}%</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/kyc')}
              disabled={profileData.govtKycStatus === 'PENDING'}
              className={cn(
                "w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2 group/btn",
                profileData.govtKycStatus === 'PENDING' ? "bg-slate-100 text-[#4a6ba5] cursor-default shadow-none border border-slate-200" :
                profileData.govtKycStatus === 'REJECTED' ? "bg-red-600 text-white shadow-red-500/20 hover:bg-red-700" :
                "bg-secondary text-white shadow-secondary/20 hover:bg-secondary/90"
              )}
            >
              {profileData.govtKycStatus === 'PENDING' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  Verification in process
                </>
              ) : profileData.govtKycStatus === 'REJECTED' ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Rejected: Re-upload documents
                </>
              ) : (
                <>
                  Initialize KYC Vault <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl overflow-hidden relative border border-white/10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary rounded-full blur-3xl opacity-30"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/70">Worker Wallet</h4>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <div className="mb-10 relative z-10">
              <div className="flex justify-between items-center mb-2">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Available Balance</p>
                {editingSection === 'wallet' ? (
                  <div className="flex gap-2">
                    <button onClick={saveEditing} className="p-1 text-success hover:bg-white/10 rounded"><Save className="w-3 h-3" /></button>
                    <button onClick={cancelEditing} className="p-1 text-white/40 hover:bg-white/10 rounded"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEditing('wallet', { walletBalance: profileData.walletBalance })} className="text-[9px] font-bold text-secondary uppercase hover:underline">Edit</button>
                )}
              </div>
              {editingSection === 'wallet' ? (
                <input
                  type="number"
                  name="walletBalance"
                  value={editValues.walletBalance || 0}
                  onChange={handleInputChange}
                  className="text-2xl font-bold tracking-tight font-display bg-white/10 border border-white/20 rounded px-2 w-full text-white"
                />
              ) : (
                <p className="text-4xl font-bold tracking-tight font-display">${profileData.walletBalance.toLocaleString()}</p>
              )}
            </div>
            <div className="space-y-4 relative z-10">
              <button className="w-full py-4 bg-white text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl flex items-center justify-center gap-3">
                <CreditCard className="w-4 h-4" /> Withdraw Funds
              </button>
              <button className="w-full py-4 bg-white/10 border border-white/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                Payment Methods
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Stats & Settings */}
        <div className="md:col-span-8 space-y-8">
          <div className="tech-card p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">Architecture Metrics</h4>
              {editingSection === 'metrics' ? (
                <div className="flex gap-2">
                  <button onClick={saveEditing} className="p-1 text-success hover:bg-success/10 rounded"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEditing} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button 
                  onClick={() => startEditing('metrics', { 
                    reliabilityIndex: profileData.reliabilityIndex, 
                    disruptionResilience: profileData.disruptionResilience,
                    systemEvaluation: profileData.systemEvaluation
                  })}
                  className="text-[10px] font-bold text-secondary uppercase hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Reliability Index</p>
                    {editingSection === 'metrics' ? (
                      <input
                        type="number"
                        name="reliabilityIndex"
                        value={editValues.reliabilityIndex || 0}
                        onChange={handleInputChange}
                        className="text-xl font-bold text-secondary font-display bg-white border border-slate-200 rounded px-2 w-20 text-right"
                      />
                    ) : (
                      <p className="text-xl font-bold text-secondary font-display">{profileData.reliabilityIndex}%</p>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-secondary h-full rounded-full shadow-sm" style={{ width: `${profileData.reliabilityIndex}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Disruption Resilience</p>
                    {editingSection === 'metrics' ? (
                      <input
                        type="number"
                        name="disruptionResilience"
                        value={editValues.disruptionResilience || 0}
                        onChange={handleInputChange}
                        className="text-xl font-bold text-primary font-display bg-white border border-slate-200 rounded px-2 w-20 text-right"
                      />
                    ) : (
                      <p className="text-xl font-bold text-primary font-display">{profileData.disruptionResilience}%</p>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-primary h-full rounded-full shadow-sm" style={{ width: `${profileData.disruptionResilience}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="w-16 h-16 text-primary" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Evaluation</p>
                {editingSection === 'metrics' ? (
                  <textarea
                    name="systemEvaluation"
                    value={editValues.systemEvaluation || ''}
                    onChange={handleInputChange}
                    className="text-sm font-medium text-slate-700 leading-relaxed italic relative z-10 bg-white border border-slate-200 rounded p-2 w-full h-24"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic relative z-10">
                    {profileData.systemEvaluation}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="tech-card overflow-hidden shadow-lg">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">Account Settings</h4>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { icon: Phone, label: 'Phone Number', val: profileData.phoneNumber, key: 'phoneNumber' },
                { icon: Mail, label: 'Email Address', val: profileData.email, key: 'email' },
                { icon: Bell, label: 'Notification Preferences', val: profileData.notificationPrefs, key: 'notificationPrefs' },
                { icon: Settings, label: 'System Configuration', val: profileData.systemConfig, key: 'systemConfig' },
                { icon: LogOut, label: 'Log Out', val: 'End current session', action: 'Exit', danger: true, onClick: logout },
              ].map((item, i) => (
                <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors group">
                  <div className="flex items-center gap-5 flex-1">
                    <div className={cn("p-3 rounded-xl border transition-all shadow-sm", 
                      item.danger 
                        ? "bg-error/5 text-error border-error/10" 
                        : "bg-slate-50 text-slate-400 border-slate-100 group-hover:text-secondary group-hover:border-secondary/20 group-hover:bg-white")}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{item.label}</p>
                      {editingSection === `settings-${item.key}` ? (
                        <input
                          name={item.key}
                          value={editValues[item.key as string] || ''}
                          onChange={handleInputChange}
                          className="text-sm font-bold text-primary font-display bg-white border border-slate-200 rounded px-2 w-full"
                        />
                      ) : (
                        <p className="text-sm font-bold text-primary font-display">{item.val}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    {editingSection === `settings-${item.key}` ? (
                      <>
                        <button onClick={saveEditing} className="text-[11px] font-bold uppercase tracking-widest text-success hover:underline">Save</button>
                        <button onClick={cancelEditing} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:underline">Cancel</button>
                      </>
                    ) : (
                      !item.danger && (
                        <button 
                          onClick={() => startEditing(`settings-${item.key}`, { [item.key as string]: item.val })}
                          className="text-[11px] font-bold uppercase tracking-widest text-secondary hover:underline"
                        >
                          Edit
                        </button>
                      )
                    )}
                    {item.danger && (
                      <button 
                        onClick={item.onClick}
                        className="text-[11px] font-bold uppercase tracking-widest text-error hover:underline"
                      >
                        Exit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
