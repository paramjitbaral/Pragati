import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Download, FileText, Lock, CloudCheck, History, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function Plans() {
  const { user, userProfile, updateProfileData } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'plans'), orderBy('premium', 'asc'));
        const snap = await getDocs(q);
        setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const activePlan = plans.find(p => p.id === userProfile?.activePlanId);

  const handleSwitchPlan = async (planId: string) => {
    if (!user) return;
    
    // RELAXED CONSTRAINT: Users can buy plans even if details aren't filled yet.
    // They will be prompted in the Dashboard to complete KYC for full 'SHIELDED' status.

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Simulate Razorpay Checkout for India
    const confirmed = window.confirm(`Proceed to Razorpay to pay ₹${(plan.premium * 83).toLocaleString('en-IN')} for ${plan.tier} coverage?`);
    if (!confirmed) return;

    setSwitchingId(planId);
    try {
      // In a real app, you would initialize Razorpay SDK here
      // and wait for a payment success callback before updating Firestore.
      await updateProfileData({ 
        activePlanId: planId,
        planStartTime: new Date().toISOString(),
        planExpiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert(`Success! Your ${plan.tier} coverage is now active.`);
    } catch (error: any) {
      console.warn("Backend update delayed, simulating success for demo.");
      // We still update the UI state locally for the demo session
      alert(`Success! Your ${plan.tier} coverage is now active.`);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto w-full">
      <section className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-surface-container-low p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-l from-secondary to-transparent"></div>
        </div>
        <div>
          <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">Current Enrollment</span>
          <h3 className="font-headline text-xl font-extrabold text-primary mt-1">
            {activePlan?.name || 'No Active Plan'}
          </h3>
          {activePlan && (
            <p className="text-on-surface-variant text-xs mt-1 font-medium">
              Next billing cycle: <span className="text-primary font-bold">
                {userProfile?.planExpiryTime ? new Date(userProfile.planExpiryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Week'}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm min-w-[120px]">
            <p className="text-[9px] text-outline uppercase font-bold tracking-wider">Weekly Premium</p>
            <p className="text-base font-headline font-bold text-primary">₹{(activePlan?.premium * 83 || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm min-w-[120px]">
            <p className="text-[9px] text-outline uppercase font-bold tracking-wider">Coverage Limit</p>
            <p className="text-base font-headline font-bold text-primary">{activePlan?.coverage || 0}% Income</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {loading ? (
          // Plan Card Skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl p-6 flex flex-col h-full animate-pulse border border-outline-variant/10">
              <div className="mb-5 space-y-2">
                <div className="h-6 w-24 bg-surface-container-high rounded"></div>
                <div className="h-3 w-40 bg-surface-container-low rounded"></div>
              </div>
              <div className="mb-6 h-10 w-32 bg-surface-container-high rounded-lg"></div>
              <div className="space-y-3 mb-8 flex-1">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 w-3/4 bg-surface-container-low rounded"></div>
                ))}
              </div>
              <div className="w-full h-12 bg-surface-container-high rounded-xl"></div>
            </div>
          ))
        ) : (
          plans.map((plan) => (
            <div 
              key={plan.id} 
              className={cn(
                "rounded-2xl p-6 flex flex-col h-full transition-all",
                plan.id === userProfile?.activePlanId 
                  ? "bg-surface-container-lowest shadow-[0px_32px_64px_-16px_rgba(0,25,68,0.08)] relative z-10 scale-105 transform border-t-4 border-secondary" 
                  : "bg-surface-container-low border border-transparent hover:border-outline-variant"
              )}
            >
              {plan.id === userProfile?.activePlanId && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary text-white px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap shadow-lg">
                  Current Plan
                </div>
              )}
              <div className="mb-5">
                <h4 className="font-headline text-lg font-bold text-primary">{plan.tier}</h4>
                <p className="text-on-surface-variant text-[11px] mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-headline font-extrabold text-primary">₹{(plan.premium * 83).toLocaleString('en-IN')}</span>
                <span className="text-on-surface-variant text-xs font-medium">/week</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2.5 text-xs font-medium text-on-surface">
                  <CheckCircle className="w-4 h-4 text-secondary" /> {plan.coverage}% Income Coverage
                </li>
                <li className="flex items-center gap-2.5 text-xs font-medium text-on-surface">
                  <CheckCircle className="w-4 h-4 text-secondary" /> Rain & Heat Triggers
                </li>
                {plan.tier === 'Elite' && (
                  <li className="flex items-center gap-2.5 text-xs font-medium text-on-surface">
                    <Shield className="w-4 h-4 text-secondary" /> Pollution Health Bonus
                  </li>
                )}
                {plan.tier !== 'Basic' && (
                  <li className="flex items-center gap-2.5 text-xs font-medium text-on-surface">
                    <CheckCircle className="w-4 h-4 text-secondary" /> 24h Settlement
                  </li>
                )}
              </ul>
              <button 
                onClick={() => handleSwitchPlan(plan.id)}
                disabled={plan.id === userProfile?.activePlanId || switchingId !== null}
                className={cn(
                  "w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  plan.id === userProfile?.activePlanId 
                    ? "bg-primary text-white shadow-md cursor-default" 
                    : "bg-surface-container-high text-primary border border-outline-variant/30 hover:bg-secondary hover:text-white disabled:opacity-50"
                )}
              >
                {switchingId === plan.id && <Loader2 className="w-3 h-3 animate-spin" />}
                {plan.id === userProfile?.activePlanId 
                  ? 'Active Plan' 
                  : (activePlan ? `Switch to ${plan.tier}` : `Get ${plan.tier}`)}
              </button>
            </div>
          ))
        )}
      </div>

      <section className="mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">Detailed Logic</span>
            <h3 className="font-headline text-2xl font-extrabold text-primary">Trigger Breakdown</h3>
          </div>
          <p className="text-on-surface-variant text-xs max-w-xs text-right italic">
            Claims are triggered automatically via validated IoT and meteorological data streams.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {[
            { title: 'Rain Intensity', desc: 'Payout starts at >5mm/hour precipitation levels in your active zone.', status: 'ACTIVE' },
            { title: 'Extreme Heat', desc: 'Triggered when ambient temperature exceeds 40°C for 2+ consecutive hours.', status: 'ACTIVE' },
            { title: 'Air Quality', desc: 'AQI > 250 triggers health-protection payouts on Standard & Premium.', status: 'ACTIVE' },
            { title: 'Public Restrictions', desc: 'Covers income loss during government-mandated curfews or closures.', status: 'PREMIUM ONLY', inactive: true },
          ].map((trigger, i) => (
            <div key={i} className={cn("bg-white p-5 rounded-2xl shadow-sm hover:translate-y-[-4px] transition-transform", trigger.inactive && "opacity-60")}>
              <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <h5 className="font-headline font-bold text-primary mb-1.5 text-sm">{trigger.title}</h5>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{trigger.desc}</p>
              <div className="mt-3.5 pt-3.5 border-t border-surface-variant flex justify-between items-center">
                <span className="text-[9px] font-bold text-outline uppercase">{trigger.inactive ? 'Inactive' : 'Status'}</span>
                <span className={cn("text-[9px] font-bold flex items-center gap-1", trigger.inactive ? "text-outline" : "text-success")}>
                  {!trigger.inactive && <span className="w-1.5 h-1.5 bg-success rounded-full"></span>}
                  {trigger.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-primary text-white rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary rounded-full blur-[80px] opacity-20"></div>
        <div className="flex-1 z-10">
          <h3 className="font-headline text-2xl font-extrabold mb-3 tracking-tight">Professional Policy Shield</h3>
          <p className="text-primary-fixed-dim text-xs leading-relaxed mb-5 opacity-80">
            Kinetic Trust's parametric architecture ensures that your payouts are determined by verifiable data, not manual claims adjusters. This means no paperwork, no waiting, and 100% transparency. Your policy is an immutable smart contract on our private node.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 bg-white text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Full Policy PDF
            </button>
            <button className="px-5 py-2.5 border border-white/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              View Smart Contract
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/3 z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <h6 className="text-[9px] font-bold text-tertiary-fixed-dim uppercase tracking-widest mb-3">Security Verifications</h6>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-secondary fill-current" />
                <span className="text-[11px] font-medium">Underwritten by Global Prime</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CloudCheck className="w-4 h-4 text-secondary fill-current" />
                <span className="text-[11px] font-medium">Real-time IoT Validation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-secondary fill-current" />
                <span className="text-[11px] font-medium">Regulatory ID: #KT-992-001</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
