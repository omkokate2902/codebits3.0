import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../utils/api";
import "../styles/pages/Profile.css";

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = React.useRef(null);

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

    console.log("Uploading file:", file.name, "Type:", file.type, "Size:", file.size);
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Log FormData contents (for debugging)
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const data = await API.user.uploadFile(formData);
      console.log("Upload response:", data);
      setUploadMessage("File uploaded successfully!");
      setFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage(error.message || "File upload failed.");
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
            <h3>Upload a File</h3>
            <input 
              type="file" 
              accept=".txt,.json" 
              onChange={handleFileChange} 
              ref={fileInputRef} 
            />
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