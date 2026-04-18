import React from 'react';
import { Activity, ShieldAlert, Zap, Search, AlertCircle, CheckCircle, BarChart3, Globe, Database, Cpu, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { useAuth } from '../contexts/AuthContext';
export function SystemHealth() {
  const { loading: authLoading } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLocalLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const loading = authLoading || localLoading;

  if (loading) {
    return (
      <div className="p-5 md:p-8 max-w-6xl mx-auto w-full space-y-8 animate-pulse">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low p-5 h-20 rounded-2xl"></div>
          ))}
        </section>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 bg-surface-container-low h-96 rounded-3xl"></div>
          <div className="md:col-span-4 bg-surface-container-low h-96 rounded-3xl"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Real-time Monitor Header */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'System Uptime', val: '99.99%', icon: Globe, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Fraud Detection', val: 'Active', icon: ShieldAlert, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Data Latency', val: '14ms', icon: Zap, color: 'text-tertiary-fixed-dim', bg: 'bg-tertiary-fixed-dim/10' },
          { label: 'Active Nodes', val: '1,204', icon: Database, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/5 flex items-center gap-3.5">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-extrabold text-primary">{stat.val}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Fraud & Anomaly Detection */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-primary tracking-tight">Fraud & Analytics Monitor</h3>
                <p className="text-on-surface-variant text-xs mt-0.5">Real-time verification of parametric triggers across all zones.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-1.5 rounded-xl">
                <Search className="w-3.5 h-3.5 text-outline" />
                <span className="text-[9px] font-bold text-primary uppercase">Scan Network</span>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { zone: 'Zone 4 (South Delhi)', status: 'Verified', risk: 'Low', activity: 'High', time: '2m ago' },
                { zone: 'Zone 1 (North Delhi)', status: 'Suspicious', risk: 'Medium', activity: 'Anomalous', time: '5m ago', alert: true },
                { zone: 'Zone 7 (Gurgaon)', status: 'Verified', risk: 'Low', activity: 'Normal', time: '12m ago' },
                { zone: 'Zone 2 (West Delhi)', status: 'Verified', risk: 'Low', activity: 'Normal', time: '18m ago' },
              ].map((item, i) => (
                <div key={i} className={cn("p-4 rounded-2xl flex items-center justify-between transition-all", item.alert ? "bg-error/5 border border-error/20" : "bg-surface-container-low hover:bg-white border border-transparent hover:border-outline-variant/10")}>
                  <div className="flex items-center gap-3.5">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", item.alert ? "bg-error text-white" : "bg-primary text-white")}>
                      {item.alert ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-primary text-xs">{item.zone}</p>
                      <p className="text-[9px] text-outline uppercase font-bold tracking-tighter">{item.time} • {item.activity} Activity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <p className="text-[9px] text-outline uppercase font-bold tracking-tighter">Risk Assessment</p>
                      <p className={cn("text-[11px] font-bold", item.alert ? "text-error" : "text-success")}>{item.risk}</p>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <span className={cn("text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest", item.alert ? "bg-error text-white" : "bg-success/10 text-success")}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <BarChart3 className="w-5 h-5 text-secondary" />
                <h4 className="font-headline font-bold text-primary uppercase tracking-wider text-[10px]">Payout Distribution</h4>
              </div>
              <div className="flex items-end gap-1.5 h-24 mb-3.5">
                {[40, 65, 30, 85, 50, 95, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-surface-container-high rounded-t-md relative group">
                    <div className="absolute bottom-0 left-0 w-full bg-secondary rounded-t-md transition-all duration-500" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-outline">
                <span>MON</span>
                <span>WED</span>
                <span>FRI</span>
                <span>SUN</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <Cpu className="w-5 h-5 text-tertiary-fixed-dim" />
                  <h4 className="font-headline font-bold text-primary uppercase tracking-wider text-[10px]">Node Processing</h4>
                </div>
                <p className="text-2xl font-extrabold text-primary tracking-tight">1.2M <span className="text-xs font-medium text-outline">Events/sec</span></p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Optimized Load</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Infrastructure */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-primary text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary rounded-full blur-[60px] opacity-30"></div>
            <div className="relative z-10">
              <Lock className="w-8 h-8 text-tertiary-fixed-dim mb-5" />
              <h4 className="font-headline text-xl font-extrabold mb-1.5">Immutable Ledger</h4>
              <p className="text-primary-fixed-dim text-xs leading-relaxed opacity-80 mb-6">
                Every parametric trigger and payout is recorded on our private node architecture, ensuring 100% transparency and zero tampering.
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Hash Integrity</span>
                  <span className="text-[11px] font-bold text-success">Verified</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Block Height</span>
                  <span className="text-[11px] font-bold">#1,992,042</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/5">
            <h4 className="font-headline font-bold text-primary uppercase tracking-wider text-[10px] mb-5">Network Infrastructure</h4>
            <div className="space-y-5">
              {[
                { label: 'AWS Cluster', status: 'Healthy', color: 'text-success' },
                { label: 'IoT Gateway', status: 'Healthy', color: 'text-success' },
                { label: 'MET-API Node', status: 'Busy', color: 'text-tertiary-fixed-dim' },
                { label: 'Smart Contract VM', status: 'Healthy', color: 'text-success' },
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-on-surface">{node.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", node.color.replace('text-', 'bg-'))}></span>
                    <span className={cn("text-[9px] font-bold uppercase", node.color)}>{node.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 border border-outline-variant/30 rounded-xl text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all">
              View System Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
