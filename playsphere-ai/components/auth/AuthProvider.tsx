'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Subscribe to real-time updates for user profile doc
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error listening to user profile doc:', err);
          setLoading(false);
        });
      } else {
        document.cookie = `auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setProfile(null);
        setLoading(false);
      }
    });

    // Separately listen for token refreshes so the cookie stays valid
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const isSecure = window.location.protocol === 'https:';
          const secureFlag = isSecure ? '; Secure' : '';
          document.cookie = `auth-token=${token}; path=/; max-age=${3600 * 24 * 7}${secureFlag}; SameSite=Lax`;
        } catch (error) {
          console.error('Error setting auth-token cookie:', error);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
