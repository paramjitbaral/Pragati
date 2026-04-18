import React from 'react';
import { Bell, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user, userProfile, loading } = useAuth();
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <header className="flex justify-between items-center w-full px-5 py-3 bg-surface sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h1 className="font-headline text-lg font-bold text-primary -tracking-tight">{title}</h1>
        {subtitle && (
          <>
            <span className="text-outline mx-1.5 text-xs hidden md:block">|</span>
            <h2 className="font-headline font-bold text-base -tracking-tight text-primary hidden md:block">{subtitle}</h2>
          </>
        )}
        <div className="hidden lg:flex items-center gap-5 ml-6">
          <button className="text-secondary border-b-2 border-secondary font-medium text-xs pb-0.5">Overview</button>
          <button className="text-outline hover:text-secondary transition-colors text-xs font-medium">Coverage</button>
          <button className="text-outline hover:text-secondary transition-colors text-xs font-medium">Payouts</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center bg-surface-container-low px-2.5 py-1 rounded-full text-[10px] font-medium text-on-surface-variant">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
          System Online
        </div>
        <div className="hidden lg:flex bg-surface-container-high rounded-full px-3 py-1.5 items-center gap-2.5">
          <Search className="w-3.5 h-3.5 text-outline" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-xs w-40 font-sans" 
            placeholder="Search parameters..." 
            type="text" 
          />
        </div>
        <button className="text-on-surface-variant hover:text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <AlertTriangle className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 relative">
          {loading || !photoURL ? (
            <div className="absolute inset-0 bg-surface-container-highest animate-pulse" />
          ) : (
            <img 
              alt="Worker Profile" 
              className="w-full h-full object-cover" 
              src={photoURL}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </header>
  );
}
