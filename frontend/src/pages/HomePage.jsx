import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const HomePage = ({ auth, searchQuery, setMessage }) => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicVideos();
  }, [sortBy]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchQuery]);

  const loadPublicVideos = async () => {
    try {
      setLoading(true);
      const url = sortBy === "trending" 
        ? `${API_BASE}/api/videos/public/discover`
        : `${API_BASE}/api/videos/public`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load videos");
      let data = await res.json();

      if (sortBy === "latest") {
        data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setVideos(data || []);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredVideos(filtered);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  return (
    <div className="page-container">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Sociora</h1>
          <p>Discover creator content & earn returns on your investments</p>
        </div>
      </section>

      {/* SORT CONTROLS */}
      <section className="controls-section">
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sortBy === "latest" ? "active" : ""}`}
            onClick={() => setSortBy("latest")}
          >
            📅 Latest
          </button>
          <button
            className={`sort-btn ${sortBy === "trending" ? "active" : ""}`}
            onClick={() => setSortBy("trending")}
          >
            🔥 Trending
          </button>
        </div>
      </section>

      {/* VIDEOS GRID */}
      {loading ? (
        <div className="loading-container">
          <p>Loading videos...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="empty-state">
          <p>
            {videos.length === 0
              ? "No videos yet. Create an account and upload one!"
              : `No videos match "${searchQuery}"`}
          </p>
          {!auth && (
            <button onClick={() => navigate("/signup")} className="btn-primary">
              Get Started
            </button>
          )}
        </div>
      ) : (
        <section className="videos-grid-section">
          <div className="videos-grid">
            {filteredVideos.map((video) => (
              <div
                key={video._id}
                className="video-card"
                onClick={() => handleVideoClick(video._id)}
              >
                {/* VIDEO THUMBNAIL */}
                <div className="video-thumbnail">
                  <video muted>
                    <source src={`${API_BASE}${video.filePath}`} type="video/mp4" />
                  </video>
                  <div className="duration-badge">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : "•"}
                  </div>
                </div>

                {/* VIDEO METADATA */}
                <div className="video-metadata">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="creator-name">
                    {video.creatorId?.name || "Unknown Creator"}
                  </p>

                  <div className="video-stats">
                    <span className="stat">
                      💰 {(video.totalInvested || 0).toLocaleString()} invested
                    </span>
                    <span className="stat">
                      👥 {video.totalSubscribers || 0} investors
                    </span>
                  </div>

                  <div className="video-footer">
                    <span className="uploaded-date">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                    {video.blockchainHash && (
                      <span className="blockchain-badge" title="Blockchain verified">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
