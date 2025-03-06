import React, { createContext, useState, useEffect } from 'react';
import { auth, signInWithPopup, provider } from '../utils/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Set up Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Verify with backend
          const response = await fetch('http://192.168.0.118:3000/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const userData = {
              ...data.user,
              token: idToken
            };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.error('Failed to verify token with backend');
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Auth state listener will handle the rest
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 