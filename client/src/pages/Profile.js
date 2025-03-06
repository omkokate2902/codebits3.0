import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (!user) {
      fetch("http://127.0.0.1:3000/api/user", {  // ✅ Corrected API route
        method: "GET",
        credentials: "include", // ✅ Ensures session cookies are sent
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("User fetch failed");
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            navigate("/");
          } else {
            setUser(data);
          }
        })
        .catch((error) => console.error("Error fetching user:", error));
    }
  }, [user, navigate, setUser]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:3000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include", // ✅ Ensures session authentication is included
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "File upload failed.");
      }

      setUploadMessage(data.message || "File uploaded successfully!");
    } catch (error) {
      setUploadMessage(error.message);
      console.error("Upload error:", error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.name}</h2>
          <p>Email: {user.email}</p>
          {user.picture && <img src={user.picture} alt="Profile" width="100" />}

          {/* File Upload */}
          <div>
            <h3>Upload a TXT File</h3>
            <input type="file" accept=".txt" onChange={handleFileChange} />
            <button onClick={handleFileUpload}>Upload</button>
            {uploadMessage && <p>{uploadMessage}</p>}
          </div>
        </div>
      ) : (
        <p>Loading user...</p>
      )}
    </div>
  );
};

export default Profile;