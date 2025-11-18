import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
      subscriptionStatus: 'trial',
      trialSessionsUsed: 0,
      createdAt: new Date(),
      stats: {
        totalSessions: 0,
        problemsSolved: 0,
        averageScore: 0
      }
    });

    return userCredential;
  }

  // Sign in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists, if not create one
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        subscriptionStatus: 'trial',
        trialSessionsUsed: 0,
        createdAt: new Date(),
        stats: {
          totalSessions: 0,
          problemsSolved: 0,
          averageScore: 0
        }
      });
    }

    return userCredential;
  }

  // Log out
  function logout() {
    return signOut(auth);
  }

  // Fetch user profile from Firestore
  async function fetchUserProfile(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
    }
  }

  // Check if user can start interview (trial or active subscription)
  function canStartInterview() {
    if (!userProfile) return false;

    if (userProfile.subscriptionStatus === 'active') {
      return true;
    }

    if (userProfile.subscriptionStatus === 'trial' && userProfile.trialSessionsUsed < 3) {
      return true;
    }

    return false;
  }

  // Get remaining trial sessions
  function getRemainingTrialSessions() {
    if (!userProfile || userProfile.subscriptionStatus !== 'trial') {
      return 0;
    }
    return Math.max(0, 3 - userProfile.trialSessionsUsed);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    signInWithGoogle,
    canStartInterview,
    getRemainingTrialSessions,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
