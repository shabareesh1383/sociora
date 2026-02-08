import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CreatorDashboard = ({ auth, setMessage }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth || auth.role !== "creator") {
      navigate("/");
      return;
    }
    loadDashboard();
  }, [auth]);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crypto/creator/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load creator dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading">Loading dashboard...</div></div>;
  }

  if (!dashboard) {
    return <div className="page-container"><div className="message-box">Failed to load dashboard</div></div>;
  }

  return (
    <div className="page-container">
      <section className="dashboard-section">
        <h1>💰 Creator Dashboard</h1>

        {/* BALANCE CARD */}
        <div className="balance-card">
          <div className="balance-item">
            <span className="label">Wallet Balance</span>
            <span className="value">{dashboard.balance.toFixed(2)}</span>
            <span className="currency">SOCIORA Tokens</span>
          </div>
          <div className="balance-item">
            <span className="label">Total Earnings (Lifetime)</span>
            <span className="value">{dashboard.totalEarnings.toFixed(2)}</span>
            <span className="currency">SOCIORA Tokens</span>
          </div>
          <div className="balance-item">
            <span className="label">Wallet Address</span>
            <span className="wallet-addr">{dashboard.creator.walletAddress}</span>
          </div>
        </div>

        {/* EARNINGS BREAKDOWN */}
        <div className="earnings-breakdown">
          <h2>📊 Earnings Breakdown</h2>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span className="icon">🎬</span>
              <span className="label">Video Creation</span>
              <span className="amount">{dashboard.earningsBreakdown.videoCreation.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="icon">💸</span>
              <span className="label">From Investments</span>
              <span className="amount">{dashboard.earningsBreakdown.investments.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="icon">📦</span>
              <span className="label">Template Sales</span>
              <span className="amount">{dashboard.earningsBreakdown.templateSales.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="icon">🎁</span>
              <span className="label">Returns</span>
              <span className="amount">{dashboard.earningsBreakdown.returns.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="stats-section">
          <h2>📈 Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{dashboard.statistics.videosUploaded}</span>
              <span className="stat-label">Videos Uploaded</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{dashboard.statistics.totalSubscribers}</span>
              <span className="stat-label">Total Subscribers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{dashboard.statistics.totalInvested.toLocaleString()}</span>
              <span className="stat-label">SOCIORA Invested</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{dashboard.statistics.averageROI}%</span>
              <span className="stat-label">Average ROI %</span>
            </div>
          </div>
        </div>

        {/* VIDEOS */}
        <div className="videos-section">
          <h2>🎥 Your Videos</h2>
          <div className="videos-list">
            {dashboard.videos.length === 0 ? (
              <p className="no-content">No videos uploaded yet</p>
            ) : (
              dashboard.videos.map(video => (
                <div key={video.id} className="video-entry">
                  <div className="video-header">
                    <strong>{video.title}</strong>
                    <span className={`status-badge ${video.status}`}>{video.status}</span>
                  </div>
                  <div className="video-stats">
                    <div className="stat">
                      <span className="label">Crypto Generated:</span>
                      <span className="value">{video.cryptoGenerated} tokens</span>
                    </div>
                    <div className="stat">
                      <span className="label">Total Invested:</span>
                      <span className="value">{video.totalInvested} tokens</span>
                    </div>
                    <div className="stat">
                      <span className="label">Subscribers:</span>
                      <span className="value">{video.subscribers}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Your Share:</span>
                      <span className="value">{video.earningsShare} tokens</span>
                    </div>
                  </div>
                  <button 
                    className="btn-view"
                    onClick={() => navigate(`/video/${video.id}`)}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="actions">
          <button className="btn-primary" onClick={() => navigate("/upload")}>
            📤 Upload New Video
          </button>
          <button className="btn-secondary" onClick={() => navigate("/templates")}>
            📦 Create Template
          </button>
          <button className="btn-secondary" onClick={() => navigate("/wallet")}>
            💼 View Wallet
          </button>
        </div>
      </section>
    </div>
  );
};

export default CreatorDashboard;
