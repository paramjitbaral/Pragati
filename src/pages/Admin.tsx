import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Shield, User, Banknote, Briefcase, FileCheck, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.email !== 'paramjitbaral44@gmail.com') {
      navigate('/');
      return;
    }
    fetchRiders();
  }, [user]);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('govtKycStatus', 'in', ['PENDING', 'REJECTED', 'VERIFIED'])
      );
      const querySnapshot = await getDocs(q);
      const ridersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRiders(ridersList);
    } catch (err) {
      console.error("Error fetching riders:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveKYC = async (riderId: string) => {
    setIsUpdating(true);
    try {
      const riderRef = doc(db, 'users', riderId);
      await updateDoc(riderRef, {
        govtKycStatus: 'VERIFIED',
        verificationScore: 100,
        isIdentityVerified: true,
        updatedAt: new Date().toISOString()
      });
      setSelectedRider((prev: any) => ({ ...prev, govtKycStatus: 'VERIFIED', verificationScore: 100 }));
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, govtKycStatus: 'VERIFIED', verificationScore: 100 } : r));
    } catch (err) {
      console.error("Error approving KYC:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const rejectKYC = async (riderId: string) => {
    setIsUpdating(true);
    try {
      const riderRef = doc(db, 'users', riderId);
      await updateDoc(riderRef, {
        govtKycStatus: 'REJECTED',
        verificationScore: 0,
        isIdentityVerified: false,
        updatedAt: new Date().toISOString()
      });
      setSelectedRider((prev: any) => ({ ...prev, govtKycStatus: 'REJECTED', verificationScore: 0 }));
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, govtKycStatus: 'REJECTED', verificationScore: 0 } : r));
    } catch (err) {
      console.error("Error rejecting KYC:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || user.email !== 'paramjitbaral44@gmail.com') return null;

  return (
    <div className="min-h-screen bg-[#f8faff] p-8 font-body">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#001944] font-headline tracking-tighter uppercase leading-none">Admin Command Center</h1>
          <p className="text-[#4a6ba5]/60 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Authorized Personnel Only • Pragati Infrastructure</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50">
           <div className="w-10 h-10 bg-[#001944] rounded-xl flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
           </div>
           <div>
              <p className="text-[8px] font-black uppercase text-[#4a6ba5] tracking-widest opacity-40">System Admin</p>
              <p className="text-[11px] font-bold text-[#001944]">{user.email}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rider List */}
        <div className="lg:col-span-1 space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4a6ba5]">Rider Directory ({riders.length})</h2>
              <button 
                onClick={fetchRiders}
                className="text-[#4a6ba5] hover:text-[#001944] transition-colors"
                disabled={loading}
              >
                <span className={cn("material-symbols-outlined text-base", loading && "animate-spin")}>refresh</span>
              </button>
           </div>

           <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white h-20 rounded-2xl animate-pulse border border-slate-50" />
                ))
              ) : (
                riders.map((rider) => (
                  <div 
                    key={rider.id}
                    onClick={() => setSelectedRider(rider)}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
                      selectedRider?.id === rider.id 
                        ? "bg-white border-[#001944] shadow-2xl shadow-[#001944]/10" 
                        : "bg-white/60 border-transparent hover:border-slate-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                          <img src={rider.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.id}`} alt="avatar" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-[#001944] uppercase truncate leading-none mb-1">{rider.displayName || 'Unknown Worker'}</p>
                          <div className="flex items-center gap-2">
                             <div className={cn(
                               "w-1.5 h-1.5 rounded-full",
                               rider.govtKycStatus === 'VERIFIED' ? "bg-green-500" : rider.govtKycStatus === 'PENDING' ? "bg-amber-500" : "bg-slate-300"
                             )} />
                             <span className="text-[8px] font-black uppercase text-[#4a6ba5] tracking-widest">{rider.govtKycStatus || 'NO KYC'}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
           <AnimatePresence mode="wait">
             {selectedRider ? (
               <motion.div 
                 key={selectedRider.id}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-220px)]"
               >
                  <div className="p-8 border-b border-slate-50 flex justify-between items-start">
                     <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 p-1">
                           <img src={selectedRider.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRider.id}`} className="w-full h-full rounded-2xl object-cover" alt="" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-2xl font-black text-[#001944] font-headline tracking-tighter uppercase leading-none">{selectedRider.displayName}</h2>
                              {selectedRider.govtKycStatus === 'VERIFIED' && (
                                <div className="bg-green-50 text-green-600 p-1 rounded-lg">
                                   <span className="material-symbols-outlined text-base">verified</span>
                                </div>
                              )}
                           </div>
                           <p className="text-[#4a6ba5] text-xs font-medium">{selectedRider.email}</p>
                           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4a6ba5]/30 mt-2">UID: {selectedRider.id}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#4a6ba5] mb-1">Trust Score</p>
                        <p className="text-xl font-black text-[#001944] font-headline">{selectedRider.verificationScore}%</p>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                     {/* Stats Grid */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2 text-[#4a6ba5]">
                              <Banknote className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Wallet</span>
                           </div>
                           <p className="text-sm font-black text-[#001944]">₹{selectedRider.walletBalance?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2 text-[#4a6ba5]">
                              <Briefcase className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Active Plan</span>
                           </div>
                           <p className="text-[10px] font-black text-[#001944] uppercase tracking-tighter truncate">{selectedRider.activePlanId || 'Basic'}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2 text-[#4a6ba5]">
                              <span className="material-symbols-outlined text-sm">event</span>
                              <span className="text-[8px] font-black uppercase tracking-widest">Joined</span>
                           </div>
                           <p className="text-[10px] font-black text-[#001944] uppercase tracking-tighter">
                              {selectedRider.createdAt ? new Date(selectedRider.createdAt).toLocaleDateString() : 'N/A'}
                           </p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-2 text-[#4a6ba5]">
                              <span className="material-symbols-outlined text-sm">pin_drop</span>
                              <span className="text-[8px] font-black uppercase tracking-widest">Sector</span>
                           </div>
                           <p className="text-[10px] font-black text-[#001944] uppercase tracking-tighter truncate">{selectedRider.location || 'Not Set'}</p>
                        </div>
                     </div>

                     {/* Documents Section */}
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4a6ba5]">Identity Archive Evidence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {['Aadhaar', 'PAN', 'License'].map((doc, idx) => (
                             <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                   <p className="text-[9px] font-black uppercase text-[#001944] tracking-widest">{doc}</p>
                                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                </div>
                                <div className="aspect-[4/3] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                                   <span className="material-symbols-outlined text-slate-200 text-3xl">image</span>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-[#001944] flex items-center justify-between gap-6">
                     <div className="text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Authorization Protocol</p>
                        <p className="text-xs font-bold opacity-80">Confirm identity submission for vault activation.</p>
                     </div>
                     <div className="flex gap-4">
                        <button 
                          disabled={isUpdating || selectedRider.govtKycStatus === 'REJECTED' || selectedRider.govtKycStatus === 'VERIFIED'}
                          onClick={() => rejectKYC(selectedRider.id)}
                          className={cn(
                            "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                            selectedRider.govtKycStatus === 'REJECTED'
                              ? "bg-red-500/20 text-red-500 cursor-default"
                              : "bg-white/10 hover:bg-white/20 text-white active:scale-95"
                          )}
                        >
                           {isUpdating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Reject Protocol'}
                        </button>
                        <button 
                          disabled={isUpdating || selectedRider.govtKycStatus === 'VERIFIED'}
                          onClick={() => approveKYC(selectedRider.id)}
                          className={cn(
                            "px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3",
                            selectedRider.govtKycStatus === 'VERIFIED'
                              ? "bg-green-500 text-white cursor-default"
                              : "bg-white text-[#001944] hover:bg-slate-100 active:scale-95"
                          )}
                        >
                           {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                             <>
                               <FileCheck className="w-4 h-4" />
                               <span>{selectedRider.govtKycStatus === 'VERIFIED' ? 'Verified' : 'Approve Protocol'}</span>
                             </>
                           )}
                        </button>
                     </div>
                  </div>
               </motion.div>
             ) : (
               <div className="h-[calc(100vh-220px)] border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-200 gap-4">
                  <span className="material-symbols-outlined text-6xl opacity-30">clinical_notes</span>
                  <p className="font-black uppercase tracking-[0.5em] text-[10px] opacity-20">Select Rider for Calibration</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
