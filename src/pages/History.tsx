import React, { useEffect, useState } from 'react';
import { History, Calendar, Filter, ChevronRight, CheckCircle, MapPin, Network, Download, Zap, Shield, CreditCard, Droplets, Thermometer, Search, ArrowUpRight, Wind } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth, handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function HistoryPage() {
  const { user, userProfile } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'payouts'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payouts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedCount = payouts.filter(p => p.status === 'completed').length;
  const coverageDays = userProfile?.createdAt ? Math.floor((Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Total Yield</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary">${totalPayouts.toLocaleString()}</h3>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-green-600">
            <ArrowUpRight className="w-3 h-3" /> +12% from last month
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Trigger Events</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary">{completedCount}</h3>
          <p className="text-[10px] font-medium text-on-surface-variant mt-2">Across your active zones</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Active Coverage</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary">{coverageDays} Days</h3>
          <p className="text-[10px] font-medium text-on-surface-variant mt-2">Continuous protection</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="p-5 border-b border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-headline text-lg font-bold text-primary">Payout Ledger</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text" 
                placeholder="Search events..." 
                className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs focus:outline-none focus:border-secondary transition-all"
              />
            </div>
            <button className="p-2 bg-surface-container-low border border-outline-variant/50 rounded-xl hover:bg-surface-container-high transition-all">
              <Filter className="w-4 h-4 text-primary" />
            </button>
            <button className="p-2 bg-surface-container-low border border-outline-variant/50 rounded-xl hover:bg-surface-container-high transition-all">
              <Download className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Event Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Trigger Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-surface-container-high rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-surface-container-low rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-surface-container-low rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-surface-container-low rounded"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-surface-container-high rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : payouts.length > 0 ? (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          payout.reason?.toLowerCase().includes('rain') ? "bg-blue-50 text-blue-600" : 
                          payout.reason?.toLowerCase().includes('heat') ? "bg-orange-50 text-orange-600" : 
                          "bg-secondary-container/20 text-secondary"
                        )}>
                          {payout.reason?.toLowerCase().includes('rain') ? <Droplets className="w-4 h-4" /> : 
                           payout.reason?.toLowerCase().includes('heat') ? <Thermometer className="w-4 h-4" /> : 
                           <CreditCard className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-primary">{payout.reason || 'Parametric Payout'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-primary font-medium">{new Date(payout.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-outline">{new Date(payout.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-surface-container-high rounded text-[9px] font-bold text-outline uppercase">
                          {payout.triggerValue || 'Threshold Met'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        payout.status === 'completed' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-extrabold text-primary">₹{payout.amount}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-outline text-xs italic">
                    No payout events recorded for this account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
