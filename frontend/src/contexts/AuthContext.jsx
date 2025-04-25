import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile, 
  doc, 
  getDoc, 
  setDoc, 
  ROLES 
} from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
        return userCredential;
      });
  }

  async function register(email, password, displayName, role) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Update profile
        await updateProfile(userCredential.user, { displayName });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName,
          role: role || ROLES.FACULTY, // Default role
          createdAt: new Date()
        });
        
        setUserRole(role || ROLES.FACULTY);
        return userCredential;
      });
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Create user document if it doesn't exist (for users created via other methods)
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName || '',
              role: ROLES.FACULTY, // Default role
              createdAt: new Date()
            });
            setUserRole(ROLES.FACULTY);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
