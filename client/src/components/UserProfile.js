import React, { useEffect, useState } from "react";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  // Fetch user details from Flask
  useEffect(() => {
    fetch("http://127.0.0.1:3000/user", {
      method: "GET",
      credentials: "include", // Ensures session data is sent
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setUser(null);
        } else {
          setUser(data);
        }
      })
      .catch((error) => console.error("Error fetching user:", error));
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload file to Flask
  const handleFileUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setUploadMessage(data.message || data.error);
    } catch (error) {
      setUploadMessage("File upload failed.");
      console.error("Upload error:", error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.name}</h2>
          <p>Email: {user.email}</p>
          <img src={user.picture} alt="Profile" width="100" />

          {/* File Upload */}
          <div>
            <h3>Upload a TXT File</h3>
            <input type="file" accept=".txt" onChange={handleFileChange} />
            <button onClick={handleFileUpload}>Upload</button>
            {uploadMessage && <p>{uploadMessage}</p>}
          </div>
        </div>
      ) : (
        <p>Please log in first.</p>
      )}
    </div>
  );
};

export default UserProfile;