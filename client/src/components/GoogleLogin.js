import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import '../styles/components/GoogleLogin.css';

const GoogleLogin = () => {
  const { user, login, logout, loading } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await login();
    } catch (error) {
      console.error("Google login error:", error);
      setError("Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div className="google-login loading">Loading...</div>;
  }

  return (
    <div className="google-login">
      {error && <div className="error-message">{error}</div>}
      
      {user ? (
        <div className="user-profile">
          <h2>Welcome, {user.name}</h2>
          <p>Email: {user.email}</p>
          {user.picture && <img src={user.picture} alt="Profile" width="100" />}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button 
          className="google-btn" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default GoogleLogin;