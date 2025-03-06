import React from "react";
import { auth, provider, signInWithPopup } from "../firebase";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("http://127.0.0.1:3000/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        navigate("/profile");
      } else {
        console.error("Login failed:", data.error);
      }
    } catch (error) {
      console.error("Google Auth error:", error);
    }
  };

  return (
    <div>
      <h2>Login with Google</h2>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;