import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

interface GuardContextType {
  activeSessionId: string | null;
  startGuard: () => Promise<void>;
  stopGuard: () => Promise<void>;
  fraudScore: number;
  isVerifying: boolean;
  verificationType: 'photo' | 'otp' | null;
  resolveVerification: () => void;
}

const GuardContext = createContext<GuardContextType | undefined>(undefined);

export function GuardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(localStorage.getItem('guard_session_id'));
  const [fraudScore, setFraudScore] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationType, setVerificationType] = useState<'photo' | 'otp' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startGuard = async () => {
    if (!user) return;
    
    // Get Location
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: Date.now() };
      
      try {
        const resp = await fetch('/api/guard/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, location })
        });
        const data = await resp.json();
        if (data.success) {
          setActiveSessionId(data.session.id);
          localStorage.setItem('guard_session_id', data.session.id);
        }
      } catch (e) {
        console.error('Failed to start guard:', e);
      }
    });
  };

  const stopGuard = async () => {
    if (!activeSessionId) return;
    try {
      await fetch('/api/guard/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId })
      });
      setActiveSessionId(null);
      localStorage.removeItem('guard_session_id');
      setFraudScore(0);
    } catch (e) {
      console.error('Failed to stop guard:', e);
    }
  };

  const ping = async () => {
    if (!activeSessionId) return;
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: Date.now() };
      try {
        const resp = await fetch('/api/guard/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSessionId, location })
        });
        const data = await resp.json();
        setFraudScore(data.fraudScore);
        if (data.verificationRequired) {
          setIsVerifying(true);
          setVerificationType(data.verificationType);
        }
      } catch (e) {
        console.error('Ping failed:', e);
      }
    });
  };

  useEffect(() => {
    if (activeSessionId) {
      intervalRef.current = setInterval(ping, 60000); // Ping every 1 minute
      ping(); // Initial ping
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSessionId]);

  const resolveVerification = () => {
    setIsVerifying(false);
    setVerificationType(null);
  };

  return (
    <GuardContext.Provider value={{ activeSessionId, startGuard, stopGuard, fraudScore, isVerifying, verificationType, resolveVerification }}>
      {children}
    </GuardContext.Provider>
  );
}

export function useGuard() {
  const context = useContext(GuardContext);
  if (context === undefined) {
    throw new Error('useGuard must be used within a GuardProvider');
  }
  return context;
}
