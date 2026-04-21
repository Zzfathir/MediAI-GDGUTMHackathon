import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from '../lib/firebase';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  location: string;
  language: string;
  isProfileComplete?: boolean;
}

interface HealthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileRef = doc(db, 'users', u.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const uCredential = await signInWithGoogle();
      const u = uCredential.user;
      const profileRef = doc(db, 'users', u.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const newProfile: UserProfile = {
          userId: u.uid,
          email: u.email || '',
          name: u.displayName || '',
          age: 0,
          weight: 0,
          height: 0,
          bloodType: '',
          allergies: '',
          medications: '',
          conditions: '',
          location: '',
          language: 'English',
          isProfileComplete: false
        };
        await setDoc(profileRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(profileSnap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const updatedData = { ...profile, ...data, updatedAt: new Date().toISOString() };
    await setDoc(profileRef, updatedData, { merge: true });
    setProfile(updatedData as UserProfile);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <HealthContext.Provider value={{ user, profile, loading, login, updateProfile, logout }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
