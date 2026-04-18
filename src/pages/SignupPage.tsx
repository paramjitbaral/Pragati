import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType, useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, UserPlus, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Send real verification email
      try {
        await sendEmailVerification(user);
      } catch (emailError: any) {
        console.error('Error sending verification email:', emailError);
        // We still proceed to the verification page, where they can try resending
      }

      // Create Firestore profile
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName,
          photoURL: null,
          role: 'user',
          isVerified: false,
          isPhoneVerified: false,
          isIdentityVerified: false,
          verificationScore: 0,
          reliabilityIndex: 0,
          disruptionResilience: 0,
          systemEvaluation: 'Account initialized.',
          walletBalance: 0,
          activePlanId: 'basic-plan',
          location: 'Not set',
          phoneNumber: 'Not set',
          biometricIdStatus: 'PENDING',
          biometricIdScore: 0,
          govtKycStatus: 'PENDING',
          govtKycScore: 0,
          behavioralTrustStatus: 'INACTIVE',
          behavioralTrustScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notificationPrefs: 'Push, Email Active',
          systemConfig: 'v2.4 Stable Node'
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, `users/${user.uid}`);
      }

      setSuccess(true);
      
      // Navigate to verification page
      setTimeout(() => navigate('/verify-email'), 3000);
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please check your internet connection or disable ad-blockers.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <h2 className="font-headline font-black text-3xl text-primary mb-4">Registration Complete</h2>
          <p className="text-outline font-medium text-sm leading-relaxed mb-8">
            A verification link has been dispatched to your email. Please verify your identity to activate your architect profile.
          </p>
          <div className="text-[10px] font-bold uppercase tracking-widest text-outline animate-pulse">
            Redirecting to Login...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface overflow-hidden">
      {/* Left Side: Minimal Onboarding */}
      <div className="hidden lg:flex relative flex-col justify-center items-center overflow-hidden bg-primary p-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/kinetic-minimal-signup/1200/1600" 
            className="w-full h-full object-cover opacity-40 grayscale contrast-125"
            alt="Minimal Background"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90"></div>
        </div>

        <div className="relative z-10 p-8 text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-2xl mb-8">
              <Shield className="w-7 h-7 fill-current" />
            </div>
            
            <h2 className="font-headline text-4xl xl:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Join the <br />
              <span className="text-secondary-container">Evolution.</span>
            </h2>
            
            <div className="w-10 h-1 bg-secondary rounded-full mb-6"></div>
            
            <p className="text-white/60 text-base font-medium leading-relaxed">
              The future of gig work is protected. Sign up and experience the power of parametric trust.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm py-6"
        >
          <div className="flex flex-col items-center lg:items-start mb-6">
            <div className="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-4">
              <Shield className="w-7 h-7 fill-current" />
            </div>
            <h1 className="font-headline font-black text-2xl xl:text-3xl text-primary tracking-tight">Create Account</h1>
            <p className="text-outline font-medium uppercase tracking-[0.2em] text-[9px] mt-1">Initialize Partner Profile</p>
          </div>

          {error && (
            <div className="bg-error-container text-error p-3 rounded-xl text-[11px] font-bold mb-4 border border-error/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-outline ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="Partner Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-outline ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="partner@kinetic.trust"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-outline ml-1">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 hover:bg-primary-container hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Registering...' : <><UserPlus className="w-3.5 h-3.5" /> Initialize Profile</>}
            </button>
          </form>

          <p className="text-center mt-6 text-[11px] text-outline font-medium">
            Already registered? <Link to="/login" className="text-secondary font-bold hover:underline">Authorize Session</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
