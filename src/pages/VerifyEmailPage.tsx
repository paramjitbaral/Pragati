import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Shield, Mail, RefreshCw, CheckCircle, ExternalLink, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export function VerifyEmailPage() {
  const { user, userProfile, refreshProfile, logout } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.isVerified || user?.emailVerified) {
      setVerified(true);
      setTimeout(() => navigate('/'), 2000);
    }
  }, [userProfile, user, navigate]);

  const handleCheckStatus = async () => {
    setLoading(true);
    setError('');
    try {
      await refreshProfile();
      if (!auth.currentUser?.emailVerified) {
        setError('Email not yet verified. Please check your inbox and click the link.');
      }
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please check your internet connection or disable ad-blockers.');
      } else {
        setError('Failed to refresh status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setError('');
    try {
      await sendEmailVerification(user);
      setError('A new verification link has been sent to your email.');
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please check your internet connection or disable ad-blockers.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError('Failed to resend verification email. Please wait a moment and try again.');
      }
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-12 rounded-[2rem] shadow-2xl text-center border border-outline-variant/10"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto mb-8">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="font-headline font-black text-3xl text-primary mb-4">Identity Verified</h2>
          <p className="text-outline font-medium text-sm leading-relaxed mb-8">
            Your architect profile has been successfully activated. Welcome to the Kinetic Trust network.
          </p>
          <div className="text-[10px] font-bold uppercase tracking-widest text-outline animate-pulse">
            Entering System...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl border border-outline-variant/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-xl shadow-secondary/20 mb-6">
            <Mail className="w-10 h-10" />
          </div>
          <h1 className="font-headline font-black text-3xl text-primary tracking-tight text-center">Verify Your Email</h1>
          <p className="text-outline font-medium uppercase tracking-[0.2em] text-[10px] mt-2 text-center">Secure Account Activation</p>
          <p className="mt-6 text-sm text-outline text-center px-4 leading-relaxed">
            We've sent a verification link to <br />
            <span className="text-primary font-black">{user?.email}</span>
          </p>
          <p className="mt-4 text-xs text-outline/60 text-center px-6">
            Please click the link in the email to verify your identity and access the platform.
          </p>
        </div>

        {error && (
          <div className="bg-error-container text-error p-4 rounded-xl text-[11px] font-bold mb-6 border border-error/10 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleCheckStatus}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-primary-container hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <><Shield className="w-4 h-4" /> Check Verification Status</>
            )}
          </button>

          <button 
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-surface-container-low text-primary py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border border-outline-variant/30 hover:bg-surface-container-high transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {resending ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <><ExternalLink className="w-3 h-3" /> Resend Verification Email</>
            )}
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button 
            onClick={() => logout()}
            className="text-[10px] text-outline font-bold uppercase tracking-widest hover:text-primary flex items-center gap-2"
          >
            <LogOut className="w-3 h-3" />
            Sign Out & Re-initialize
          </button>
        </div>
      </motion.div>
    </div>
  );
}
