import React, { createContext, useState, useEffect } from 'react';
import { auth, signInWithPopup, provider } from '../utils/firebase';
import { API } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check session status with the backend
  const checkSession = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Important for session cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          console.log('Session found on server:', data.user);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // First check if we have a user in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User loaded from localStorage:', parsedUser);
      }
      
      // Then check if we have an active session with the backend
      const hasSession = await checkSession();
      if (hasSession) {
        console.log('Active session found with backend');
        setLoading(false);
        return;
      }
      
      // Finally, check Firebase auth state
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            console.log('Firebase user authenticated, verifying with backend...');
            
            // Verify with backend
            try {
              const data = await API.auth.verifyToken(idToken);
              console.log('Token verified with backend:', data);
              
              const userData = {
                ...data.user,
                token: idToken
              };
              
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            } catch (error) {
              console.error('Failed to verify token with backend:', error);
              setUser(null);
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('Error getting Firebase token:', error);
            setUser(null);
            localStorage.removeItem('user');
          }
        } else {
          console.log('No Firebase user found');
          // Only clear user if we don't have a session
          if (!hasSession) {
            setUser(null);
            localStorage.removeItem('user');
          }
        }
        
        setLoading(false);
      });
      
      return () => unsubscribe();
    };
    
    initAuth();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      try {
        const data = await API.auth.verifyToken(idToken);
        const userData = {
          ...data.user,
          token: idToken
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Login verification failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Clear session with backend
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear local state
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 