import React, { useState } from 'react';
import { Camera, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VerificationModalProps {
  type: 'photo' | 'otp';
  onResolve: () => void;
}

export function VerificationModal({ type, onResolve }: VerificationModalProps) {
  const [complete, setComplete] = useState(false);

  const handleAction = () => {
    // Simulate verification process
    setTimeout(() => {
      setComplete(true);
      setTimeout(onResolve, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-primary/40 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 border border-secondary/20"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 text-secondary animate-pulse">
            {type === 'photo' ? <Camera className="w-8 h-8" /> : <Key className="w-8 h-8" />}
          </div>
          
          <h2 className="text-2xl font-black font-headline text-primary mb-2">SMART CHALLENGE</h2>
          <p className="text-on-surface-variant text-sm font-medium mb-8 leading-relaxed">
            {type === 'photo' 
              ? 'Suspicious movement detected. Please capture a live selfie to prove identity.' 
              : 'Protocol verification triggered. Enter the OTP sent to your registered mobile.'}
          </p>

          <AnimatePresence mode="wait">
            {!complete ? (
              <motion.button
                key="verify-btn"
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleAction}
                className="w-full bg-secondary text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-secondary/20"
              >
                {type === 'photo' ? <Camera className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                {type === 'photo' ? 'Open Camera' : 'Enter OTP Code'}
              </motion.button>
            ) : (
              <motion.div
                key="complete-status"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-success font-bold"
              >
                <CheckCircle className="w-6 h-6" />
                VERIFICATION SUCCESS
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-error/5 rounded-xl border border-error/10">
            <AlertTriangle className="w-3.5 h-3.5 text-error" />
            <span className="text-[10px] font-bold text-error uppercase tracking-wider">High Risk Alert: Failure will Suspend Account</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
