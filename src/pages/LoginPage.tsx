import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Award, CheckCircle, ArrowRight, LogIn, Mail, Lock } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const { getDoc, doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Initialize profile for new Google user
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
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
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Error signing in with email:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface overflow-hidden">
      {/* Left Half: Onboarding/Marketing */}
      <div className="hidden lg:flex relative flex-col justify-center items-center overflow-hidden bg-[#001233] p-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/kinetic-pro-login/1200/1600" 
            className="w-full h-full object-cover opacity-30 grayscale contrast-125"
            alt="Onboarding Background"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001233]/90 via-[#001233]/70 to-[#001233]/95"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full -mr-64 -mt-64 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/10 rounded-full -ml-40 -mb-40 blur-[100px]"></div>

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
            
            <h1 className="font-headline text-4xl xl:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Precision <br />
              <span className="text-secondary">Protection.</span>
            </h1>
            
            <div className="w-10 h-1 bg-secondary rounded-full mb-6"></div>
            
            <p className="text-white/60 text-base font-medium leading-relaxed">
              The world's first parametric insurance engine designed specifically for gig-economy professionals.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Half: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#001944 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8 relative z-10"
        >
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-12 h-12 rounded-2xl bg-[#001233] flex items-center justify-center text-white shadow-xl shadow-primary/20 mx-auto mb-6">
              <Shield className="w-7 h-7 fill-current" />
            </div>
            <h2 className="text-4xl font-extrabold font-headline text-primary tracking-tight">Authorize Session</h2>
            <p className="text-outline mt-2 font-medium uppercase tracking-[0.2em] text-[10px]">Initialize Partner Access</p>
          </div>

          {error && (
            <div className="bg-error/5 text-error p-4 rounded-xl text-[11px] font-bold border border-error/10">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="partner@kinetic.trust"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Access Key</label>
                <a href="#" className="text-[10px] font-bold text-secondary hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loginLoading ? 'Authorizing...' : <><LogIn className="w-4 h-4" /> Authorize Session</>}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-outline font-bold tracking-widest">Or Continue With</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-4 bg-white border border-outline-variant/30 py-4 px-6 rounded-2xl shadow-sm hover:shadow-md hover:bg-surface-container-low transition-all group active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-bold text-primary">Google Identity</span>
            <ArrowRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center space-y-6 pt-4">
            <p className="text-[11px] text-outline font-medium">
              Don't have an account? <Link to="/signup" className="text-secondary font-bold hover:underline">Initialize Profile</Link>
            </p>
            <div className="pt-4 border-t border-outline-variant/10">
              <p className="text-[9px] text-outline/60 font-medium uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our <br />
                <a href="#" className="text-secondary hover:underline">Terms of Service</a> and <a href="#" className="text-secondary hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
