import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string, currentUser: User) => {
    try {
      const docRef = doc(db, 'users', uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        return;
      }
      
      // If user is verified via Firebase Auth (e.g. Google or clicked link)
      // we should sync this to Firestore
      const isVerified = currentUser.emailVerified;
      const photoURL = currentUser.photoURL;

      if (docSnap.exists()) {
        const data = docSnap.data();
        const updates: any = {};
        let hasUpdates = false;

        if (isVerified && !data.isVerified) {
          updates.isVerified = true;
          hasUpdates = true;
        }
        
        if (photoURL && data.photoURL !== photoURL) {
          updates.photoURL = photoURL;
          hasUpdates = true;
        }

        if (hasUpdates) {
          try {
            updates.updatedAt = new Date().toISOString();
            await setDoc(docRef, updates, { merge: true });
            setUserProfile({ ...data, ...updates });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
          }
        } else {
          setUserProfile(data);
        }
      } else {
        // Create profile if it doesn't exist (e.g., first-time social login)
        const newProfile = {
          uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'User',
          photoURL: photoURL || null,
          role: 'user',
          isVerified: isVerified,
          isPhoneVerified: false,
          isIdentityVerified: false,
          verificationScore: 0,
          reliabilityIndex: 0,
          disruptionResilience: 0,
          systemEvaluation: 'Account initialized.',
          walletBalance: 0,
          activePlanId: 'basic-plan',
          planStartTime: new Date().toISOString(),
          planExpiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Not set',
          phoneNumber: 'Not set',
          biometricIdStatus: 'PENDING',
          biometricIdScore: 0,
          govtKycStatus: 'PENDING',
          govtKycScore: 0,
          behavioralTrustStatus: 'INACTIVE',
          behavioralTrustScore: 0,
          notificationPrefs: 'Push, Email Active',
          systemConfig: 'v2.4 Stable Node',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(docRef, newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
        }
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Render UI immediately once identity is known
      
      if (currentUser) {
        try {
          await fetchUserProfile(currentUser.uid, currentUser);
        } catch (error) {
          console.error("Profile fetch error:", error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      await user.reload();
      await fetchUserProfile(user.uid, user);
    }
  };

  const updateProfileData = async (data: any) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const updates = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      // OPTIMISTIC UPDATE: Update local profile first so UI is snappy
      setUserProfile((prev: any) => ({ ...prev, ...updates }));
      
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      console.warn("Background profile sync failed:", error);
      // We don't throw here to avoid disrupting the UI flow
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, refreshProfile, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
