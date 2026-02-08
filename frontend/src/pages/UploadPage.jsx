import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UploadPage = ({ auth, setMessage }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if not a creator
  if (auth && auth.role !== "creator") {
    return (
      <div className="page-container">
        <div className="message-box error-box">
          <p>⚠️ Only creators can upload videos.</p>
          <p>You are currently an <strong>Investor</strong>. Upgrade your account to creator in your profile.</p>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
          <button onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="page-container">
        <div className="message-box">
          <p>Please log in to upload videos.</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!title || !description || !videoFile) {
      setMessage("❌ Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("video", videoFile);

      const res = await fetch(`${API_BASE}/api/videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "❌ Upload failed");
        setLoading(false);
        return;
      }

      setMessage("✅ Video uploaded successfully!");
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      setMessage("❌ Network error. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="upload-container">
        <h1>Upload a Video</h1>

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            placeholder="Video Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Video Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows="4"
            required
          />
          <div className="file-input-wrapper">
            <label htmlFor="video-file">Select Video File:</label>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={e => setVideoFile(e.target.files[0])}
              required
            />
            {videoFile && <p className="file-name">✓ {videoFile.name}</p>}
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload Video"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
