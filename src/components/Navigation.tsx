import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, History, User, Activity, Settings, HelpCircle, Shield } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShieldCheck, label: 'Plans', path: '/plans' },
  { icon: History, label: 'History', path: '/history' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Activity, label: 'System Health', path: '/health' },
];

export function Sidebar() {
  const { user, userProfile, loading } = useAuth();
  const photoURL = userProfile?.photoURL || user?.photoURL || "https://picsum.photos/seed/user-profile/200/200";
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || "Precision Architect";
  const isAdmin = user?.email === 'paramjitbaral44@gmail.com';

  const extendedNavItems = [
    ...navItems,
    ...(isAdmin ? [{ icon: Shield, label: 'Admin Commands', path: '/admin' }] : [])
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-outline-variant/20 py-6 sticky top-0 overflow-hidden">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-primary leading-none text-base tracking-tight">Kinetic</h3>
            <p className="text-[10px] text-outline uppercase tracking-[0.15em] font-medium mt-0.5">Trust Framework</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        {extendedNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-2.5 transition-all duration-200 rounded-xl group relative overflow-hidden",
                isActive
                  ? "bg-secondary/10 text-secondary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              )
            }
          >
            <item.icon className={cn(
              "w-5 h-5 mr-3 transition-all duration-300", 
              "group-hover:scale-110 group-hover:rotate-3",
              "group-[.active]:text-secondary"
            )} />
            <span className="font-sans text-[13px] tracking-wide">{item.label}</span>
            
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-r-full transition-all duration-300",
              "opacity-0 group-[.active]:opacity-100"
            )} />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-4">
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] group hover:border-secondary/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_10px_rgba(46,125,50,0.5)]" />
              <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em]">Zone 4 Active</p>
            </div>
            <Activity className="w-3.5 h-3.5 text-outline/20 group-hover:text-secondary/40 transition-colors" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            {loading ? (
              <>
                <div className="w-10 h-10 rounded-xl bg-surface-container-high animate-pulse shadow-sm"></div>
                <div className="space-y-1.5 flex-1">
                   <div className="h-3 w-24 bg-surface-container-high animate-pulse rounded"></div>
                   <div className="h-2 w-20 bg-surface-container-low animate-pulse rounded"></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm">
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0">
                  <p className="font-headline font-black text-primary text-sm leading-tight tracking-tight truncate">{displayName}</p>
                  <p className="text-[10px] text-outline mt-0.5 leading-relaxed opacity-70 truncate">Parametric guard ready.</p>
                </div>
              </>
            )}
          </div>

          <button className="w-full group relative bg-primary text-white py-3 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]">
            <div className="absolute inset-0 bg-secondary translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em]">
              <Shield className="w-3.5 h-3.5" />
              Activate Guard
            </span>
          </button>
        </div>
        
        <div className="mt-4 space-y-0.5">
          <button className="flex items-center w-full text-outline px-4 py-1.5 text-xs font-medium hover:text-primary hover:bg-surface-container-low rounded-lg transition-all">
            <Settings className="w-4 h-4 mr-3 opacity-70" /> Settings
          </button>
          <button className="flex items-center w-full text-outline px-4 py-1.5 text-xs font-medium hover:text-primary hover:bg-surface-container-low rounded-lg transition-all">
            <HelpCircle className="w-4 h-4 mr-3 opacity-70" /> Support
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'paramjitbaral44@gmail.com';
  const extendedNavItems = [
    ...navItems,
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : [])
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 px-6 py-3 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
      {extendedNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "text-secondary scale-110" : "text-outline hover:text-on-surface"
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">{item.label.split(' ')[0]}</span>
        </NavLink>
      ))}
    </nav>
  );
}
