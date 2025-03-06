import React from "react";
import { auth, provider, signInWithPopup } from "../firebase";
import { useNavigate } from "react-router-dom";
import { API } from "../utils/api";

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      try {
        const data = await API.auth.verifyToken(idToken);
        setUser(data.user);
        // Redirect to the neighborhood finder page
        navigate("/neighborhood-finder");
      } catch (error) {
        console.error("Login failed:", error);
      }
    } catch (error) {
      console.error("Google Auth error:", error);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome to Neighborhood Finder</h2>
      <p>Find your perfect neighborhood based on your preferences and lifestyle</p>
      <button className="login-button" onClick={handleLogin}>
        Login with Google
      </button>
    </div>
  );
};

export default Login;