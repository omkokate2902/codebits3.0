import React, { useState } from "react";
import { auth, provider, signInWithPopup } from "../utils/firebase";
import '../styles/components/GoogleLogin.css';

const GoogleLogin = () => {
  const [user, setUser] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(); // Firebase token

      // Send token to Flask backend
      const response = await fetch("http://192.168.0.118:3000/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      console.log("Backend Response:", data);
      setUser(data.user);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="google-login">
      {user ? (
        <div className="user-profile">
          <h2>Welcome, {user.name}</h2>
          <p>Email: {user.email}</p>
          <img src={user.picture} alt="Profile" width="100" />
        </div>
      ) : (
        <button className="google-btn" onClick={handleGoogleLogin}>Sign in with Google</button>
      )}
    </div>
  );
};

export default GoogleLogin;