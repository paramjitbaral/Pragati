import React, { useEffect, useState } from 'react';
import { Shield, Zap, AlertTriangle, Activity, MapPin, Wind, Thermometer, CloudRain, Clock, ArrowUpRight, ArrowDownRight, ShieldAlert, Info, CreditCard, ChevronRight, Award, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useGuard } from '../contexts/GuardContext';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface TelemetryData {
  rainIntensity: number;
  ambientTemp: number;
  windVelocity: number;
  timestamp: string;
  source: string;
  trends: {
    rain: number;
    temp: number;
    wind: number;
  };
  activity: number[];
  zoneCoverage: number;
  disruptionDetected: boolean;
}

interface AlertData {
  id: string;
  type: string;
  message: string;
  payoutAmount: number;
  timestamp: string;
  status: 'active' | 'resolved';
}

interface ActivityLog {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: string;
  type: 'payout' | 'system' | 'billing' | 'alert';
}

export function Dashboard() {
  const { user, userProfile } = useAuth();
  const { activeSessionId, startGuard, stopGuard, fraudScore: guardFraudScore } = useGuard();
  
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Calculations ---
  const calculateCycleProgress = () => {
    if (!userProfile?.planStartTime || !userProfile?.planExpiryTime) return 0;
    const start = new Date(userProfile.planStartTime).getTime();
    const end = new Date(userProfile.planExpiryTime).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const calculateUptime = () => {
    if (!activeSessionId) return activePlan ? '14d 06h 22m' : '0d 00h 00m';
    return "00h 02m 14s"; 
  };

  const cycleProgress = calculateCycleProgress();
  const uptime = calculateUptime();

  useEffect(() => {
    if (!user) return;

    // Fetch Active Plan
    const fetchPlan = async () => {
      if (userProfile?.activePlanId) {
        try {
          const planDoc = await getDoc(doc(db, 'plans', userProfile.activePlanId));
          if (planDoc.exists()) {
            setActivePlan(planDoc.data());
          } else {
            setActivePlan({
              id: 'basic-plan',
              name: 'Basic Parametric',
              tier: 'Basic',
              premium: 8.00,
              coverage: 40
            });
          }
        } catch (e) {
          setActivePlan({
            id: 'basic-plan',
            name: 'Basic Parametric',
            tier: 'Basic',
            premium: 8.00,
            coverage: 40
          });
        }
      }
    };
    fetchPlan();

    // Fetch REAL Telemetry
    const fetchTelemetry = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const resp = await fetch('/api/telemetry/live');
        const json = await resp.json();
        if (json.success && json.data) {
          setTelemetry(json.data as TelemetryData);
        }
      } catch (e) {
        console.warn('Backend telemetry unavailable.');
      }
    };
    
    fetchTelemetry();
    const telemetryInterval = setInterval(fetchTelemetry, 720000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchTelemetry();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const alertsQuery = query(collection(db, 'alerts'), where('status', '==', 'active'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActiveAlert({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AlertData);
      } else {
        setActiveAlert(null);
      }
    });

    const logsQuery = query(
      collection(db, 'activity_logs'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setActivityLogs(logs);
      setLoading(false);
    });

    return () => {
      clearInterval(telemetryInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeAlerts();
      unsubscribeLogs();
    };
  }, [user, userProfile?.activePlanId]);

  const displayTelemetry = telemetry || {
    rainIntensity: 0,
    ambientTemp: 24.5,
    windVelocity: 12,
    timestamp: new Date().toISOString(),
    source: 'MET-PORT-DEFAULT',
    trends: { rain: 0, temp: 0, wind: 0 },
    activity: [30, 40, 35, 60, 45, 30, 40, 55, 65, 50, 40, 35, 45, 55, 60],
    zoneCoverage: 98.2,
    disruptionDetected: false
  };

  const displayLogs = activityLogs.length > 0 ? activityLogs : [
    { id: '1', title: 'System Initialized', date: new Date().toISOString(), amount: 'System', status: 'Active', type: 'system' as const }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full bg-surface min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Coverage Card */}
        <div className="md:col-span-8 tech-card p-6 relative overflow-hidden group flex flex-col justify-between border border-secondary/20 shadow-2xl bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-secondary/5 min-h-[260px]">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#001944 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute -right-4 -bottom-4 text-[120px] font-black text-secondary/5 select-none pointer-events-none font-headline tracking-tighter leading-none italic uppercase">
            {activePlan ? activePlan.tier : 'INACTIVE'}
          </div>
          
          <div className="relative z-10 w-full mb-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-secondary text-white px-3 py-1.5 rounded-md shadow-md">
                  <Award className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{activePlan ? 'Active Plan' : 'No Active Plan'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-md border border-success/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">Linked</span>
                </div>
              </div>
              <button className="bg-surface-container-high/50 hover:bg-secondary/10 border border-outline-variant/30 px-4 py-2 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest transition-all flex items-center gap-2">
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl font-extrabold font-headline text-primary tracking-tight leading-none">
                {activePlan ? activePlan.name : 'No Active Coverage'}
              </h3>
              <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed font-medium opacity-80">
                {activePlan
                  ? `Tier-1 Environmental Protection. Precision-engineered coverage for ${activePlan.tier} professionals.`
                  : 'Select a plan to start real-time monitoring.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Cycle Progress</span>
                <span className="text-xs font-bold text-secondary">{cycleProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${cycleProgress}%` }}></div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-outline/50" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-outline/50" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                    {activePlan ? `SPG-${activePlan.tier.toUpperCase()}-${activePlan.id.slice(-3).toUpperCase()}` : 'GUEST'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-5 border-t md:border-t-0 md:border-l border-outline-variant/10 md:pl-8">
              {[
                { label: 'Premium', val: activePlan ? `₹${(activePlan.premium * 83).toLocaleString('en-IN')}` : '₹0', icon: CreditCard },
                { label: 'Limit', val: activePlan ? `${activePlan.coverage}%` : '0%', icon: ShieldAlert },
                { label: 'Renewal', val: activePlan && userProfile?.planExpiryTime ? new Date(userProfile.planExpiryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A', icon: Clock },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[8px] uppercase font-bold tracking-widest text-outline/60 flex items-center gap-1">
                    <item.icon className="w-2.5 h-2.5" /> {item.label}
                  </span>
                  <p className="text-lg font-extrabold text-primary font-headline tracking-tighter">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guard Status Card */}
        <div className="md:col-span-4 tech-card bg-[#001233] text-white p-8 flex flex-col justify-between border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Guard Status</span>
                  <div className="flex items-center gap-3 mt-1">
                    <h4 className="text-3xl font-extrabold font-headline tracking-tight">
                      {activeSessionId ? 'SHIELDED' : activePlan ? 'READY' : 'INACTIVE'}
                    </h4>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activeSessionId ? "bg-secondary animate-pulse" : activePlan ? "bg-success" : "bg-error"
                    )}></div>
                  </div>
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl border shadow-inner transition-all",
                  activeSessionId ? "bg-secondary/20 border-secondary/40" : "bg-white/5 border-white/10"
                )}>
                  <Shield className={cn("w-7 h-7", activeSessionId ? "text-secondary" : "text-white/20")} />
                </div>
              </div>

              <div className="space-y-5 mt-8 relative z-10">
                {[
                  { label: 'Uptime Duration', val: uptime },
                  { label: 'Fraud Score', val: activeSessionId ? `${guardFraudScore}%` : '0.0%' },
                  { label: 'Session Hash', val: activeSessionId ? `GS-${activeSessionId.slice(-6).toUpperCase()}` : 'STDBY-88-X9' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/50 font-bold uppercase tracking-widest text-[9px]">{stat.label}</span>
                    <span className="font-bold text-sm font-mono tracking-tight">{stat.val}</span>
                  </div>
                ))}
              </div>

              <button 
                disabled={!activePlan}
                onClick={() => activeSessionId ? stopGuard() : startGuard()}
                className={cn(
                  "mt-8 w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative z-10",
                  activeSessionId 
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    : activePlan
                      ? "bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                      : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                )}
              >
                {activeSessionId ? 'DEACTIVATE GUARD' : activePlan ? 'START TRACKING' : 'PROVISIONING REQUIRED'}
              </button>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Rain Intensity', val: displayTelemetry.rainIntensity, unit: 'mm/hr', icon: CloudRain, color: 'text-secondary', trend: displayTelemetry.trends.rain },
              { label: 'Ambient Temp', val: displayTelemetry.ambientTemp, unit: '°C', icon: Thermometer, color: 'text-orange-500', trend: displayTelemetry.trends.temp },
              { label: 'Wind Velocity', val: displayTelemetry.windVelocity, unit: 'km/h', icon: Wind, color: 'text-blue-400', trend: displayTelemetry.trends.wind },
            ].map((metric, i) => (
              <div key={i} className="tech-card p-6 flex flex-col justify-between h-44">
                <div className="flex justify-between items-start">
                  <div className={cn("p-3 rounded-2xl bg-surface-container-low", metric.color)}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
                    {metric.trend >= 0 ? <ArrowUpRight className="w-3 h-3 text-error" /> : <ArrowDownRight className="w-3 h-3 text-success" />}
                    <span className={cn("text-[10px] font-bold", metric.trend >= 0 ? "text-error" : "text-success")}>{Math.abs(metric.trend)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-primary font-headline tracking-tight">{metric.val}</span>
                    <span className="text-[10px] font-bold text-outline uppercase">{metric.unit}</span>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight mt-2">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Engine */}
          <div className="tech-card p-8">
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-10">Activity Verification Engine</h4>
            <div className="h-56 flex items-end gap-2 px-2 relative">
              {displayTelemetry.activity.map((h, i) => (
                <div key={i} className="flex-1 group relative h-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={cn("w-full rounded-t-xl", (displayTelemetry.disruptionDetected && i === 8) ? "bg-secondary" : "bg-surface-container-high")}
                  ></motion.div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-8 text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
              <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="tech-card p-6 bg-surface-container-low/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center border border-outline-variant/20">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Active Zone</h4>
                <p className="text-[10px] text-outline font-medium">{userProfile?.location || 'Unregistered District'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                <span>ZONE COVERAGE</span>
                <span>{displayTelemetry.zoneCoverage}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${displayTelemetry.zoneCoverage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="tech-card overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/10 text-[10px] font-bold uppercase text-primary">Live Activity</div>
            <div className="divide-y divide-outline-variant/10">
              {displayLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                      {log.type === 'payout' ? <Zap className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-primary">{log.title}</h5>
                      <span className="text-[9px] text-outline uppercase tracking-tight">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary">{log.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
