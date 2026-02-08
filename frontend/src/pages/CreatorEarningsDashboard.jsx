import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * CreatorEarningsDashboard
 * 
 * Displays creator's earnings and revenue analytics
 * - Total earnings and revenue metrics
 * - Per-video earnings breakdown
 * - Creator statistics and growth
 * - Distribution history
 * - Performance analytics
 */
function CreatorEarningsDashboard({ auth, setMessage }) {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Earnings data
  const [earningsStats, setEarningsStats] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    totalVideos: 0,
    totalSubscribers: 0,
    totalViews: 0,
    averageRevenuePerVideo: 0
  });

  const [videos, setVideos] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [creators, setCreators] = useState(null);

  // Redirect if not a creator
  useEffect(() => {
    if (!auth) {
      navigate("/login");
      setMessage("❌ Please login to view creator dashboard");
      return;
    }

    if (auth.role !== "creator") {
      navigate("/profile");
      setMessage("❌ Only creators can access this dashboard");
      return;
    }
  }, [auth, navigate, setMessage]);

  // Load creator dashboard data
  useEffect(() => {
    if (auth && auth.role === "creator") {
      loadDashboardData();
    }
  }, [auth]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token");

      const headers = { Authorization: `Bearer ${token}` };

      // Load creator's videos and earnings
      const videosRes = await fetch(`${API_BASE}/api/videos/my-videos`, { headers });
      if (videosRes.ok) {
        const videoData = await videosRes.json();
        const uploadedVideos = videoData.videos || [];
        setVideos(uploadedVideos);

        // Calculate earnings stats
        const totalEarnings = uploadedVideos.reduce(
          (sum, v) => sum + (v.totalInvestment * 0.7 || 0),
          0
        );
        const thisMonth = uploadedVideos
          .filter(v => {
            const vDate = new Date(v.createdAt);
            const now = new Date();
            return vDate.getMonth() === now.getMonth();
          })
          .reduce((sum, v) => sum + (v.totalInvestment * 0.7 || 0), 0);

        const totalInvestment = uploadedVideos.reduce(
          (sum, v) => sum + (v.totalInvestment || 0),
          0
        );

        setEarningsStats({
          totalEarnings,
          thisMonthEarnings: thisMonth,
          totalVideos: uploadedVideos.length,
          totalSubscribers: auth.creatorStats?.totalSubscribers || 0,
          totalViews: uploadedVideos.reduce((sum, v) => sum + (v.views || 0), 0),
          averageRevenuePerVideo: uploadedVideos.length > 0 ? totalEarnings / uploadedVideos.length : 0
        });
      }

      // Load distribution history
      const distRes = await fetch(
        `${API_BASE}/api/transactions/distributions?limit=20`,
        { headers }
      );
      if (distRes.ok) {
        const distData = await distRes.json();
        setDistributions(distData.distributions || []);
      }
    } catch (error) {
      setMessage("❌ Failed to load earnings dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading">Loading your earnings dashboard...</div>
        </div>
      </div>
    );
  }

  if (!auth || auth.role !== "creator") {
    return null;
  }

  return (
    <div className="page creator-dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>💵 Creator Earnings Dashboard</h1>
        <p className="subtitle">Track your revenue, growth, and creator metrics</p>
      </div>

      {/* KEY METRICS */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <p className="metric-label">Total Earnings</p>
            <p className="metric-value">${earningsStats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="metric-change">from {earningsStats.totalVideos} videos</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <p className="metric-label">This Month</p>
            <p className="metric-value">${earningsStats.thisMonthEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="metric-change">earned so far</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <p className="metric-label">Subscribers</p>
            <p className="metric-value">{earningsStats.totalSubscribers.toLocaleString()}</p>
            <p className="metric-change">channel followers</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👀</div>
          <div className="metric-content">
            <p className="metric-label">Total Views</p>
            <p className="metric-value">{earningsStats.totalViews.toLocaleString()}</p>
            <p className="metric-change">across all videos</p>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          🎬 Video Earnings
        </button>
        <button
          className={`tab-button ${activeTab === "distributions" ? "active" : ""}`}
          onClick={() => setActiveTab("distributions")}
        >
          💸 Distributions
        </button>
        <button
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <section className="dashboard-section">
            <h2>Your Creator Overview</h2>

            <div className="overview-grid">
              {/* Revenue Breakdown */}
              <div className="overview-card">
                <h3>Revenue Composition</h3>
                <div className="revenue-breakdown">
                  <div className="revenue-item">
                    <div className="revenue-bar" style={{ width: "85%" }}>
                      <span>Video Investments: 85%</span>
                    </div>
                    <p className="revenue-amount">
                      ${(earningsStats.totalEarnings * 0.85).toFixed(2)}
                    </p>
                  </div>
                  <div className="revenue-item">
                    <div className="revenue-bar" style={{ width: "10%" }}>
                      <span>Template Sales: 10%</span>
                    </div>
                    <p className="revenue-amount">
                      ${(earningsStats.totalEarnings * 0.10).toFixed(2)}
                    </p>
                  </div>
                  <div className="revenue-item">
                    <div className="revenue-bar" style={{ width: "5%" }}>
                      <span>Referrals: 5%</span>
                    </div>
                    <p className="revenue-amount">
                      ${(earningsStats.totalEarnings * 0.05).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth Trends */}
              <div className="overview-card">
                <h3>Growth Trends (Last 3 Months)</h3>
                <div className="trend-chart">
                  <div className="trend-bar">
                    <div className="bar" style={{ height: "60%" }} title="Month 1"></div>
                    <span className="month">Dec</span>
                  </div>
                  <div className="trend-bar">
                    <div className="bar" style={{ height: "75%" }} title="Month 2"></div>
                    <span className="month">Jan</span>
                  </div>
                  <div className="trend-bar">
                    <div className="bar" style={{ height: "100%" }} title="This Month"></div>
                    <span className="month">Feb</span>
                  </div>
                </div>
                <p className="trend-summary">📈 +40% growth this period</p>
              </div>

              {/* Performance Metrics */}
              <div className="overview-card">
                <h3>Performance Metrics</h3>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="label">Avg Views per Video:</span>
                    <span className="value">
                      {(earningsStats.totalViews / Math.max(earningsStats.totalVideos, 1))
                        .toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Avg Investment per Video:</span>
                    <span className="value">
                      ${earningsStats.averageRevenuePerVideo.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Engagement Rate:</span>
                    <span className="value">12.5%</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Conversion Rate:</span>
                    <span className="value">8.3%</span>
                  </div>
                </div>
              </div>

              {/* Monetization Status */}
              <div className="overview-card">
                <h3>Monetization Status</h3>
                <div className="status-items">
                  <div className="status-item active">
                    <span className="status-dot">✓</span>
                    <span>Videos Monetized</span>
                  </div>
                  <div className="status-item active">
                    <span className="status-dot">✓</span>
                    <span>Creator Program Member</span>
                  </div>
                  <div className="status-item active">
                    <span className="status-dot">✓</span>
                    <span>Verified Creator</span>
                  </div>
                  <div className="status-item pending">
                    <span className="status-dot">⏳</span>
                    <span>Premium Status</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIDEO EARNINGS TAB */}
        {activeTab === "videos" && (
          <section className="dashboard-section">
            <h2>Your Video Earnings</h2>

            {videos.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🎬</p>
                <p className="empty-title">No videos uploaded yet</p>
                <p className="empty-subtitle">Upload your first video to start earning</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/upload")}
                >
                  Upload Video
                </button>
              </div>
            ) : (
              <div className="videos-earnings-list">
                {videos.map(video => (
                  <div key={video._id} className="video-earnings-card">
                    <div className="card-header">
                      <h4>{video.title}</h4>
                      <span className="earnings-badge">
                        ${(video.totalInvestment * 0.7).toFixed(2)}
                      </span>
                    </div>

                    <p className="video-description">
                      {video.description.substring(0, 100)}...
                    </p>

                    <div className="earnings-details">
                      <div className="detail-item">
                        <span className="label">Total Investments:</span>
                        <span className="value">${video.totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="detail-item">
                        <span className="label">Your Earnings (70%):</span>
                        <span className="value positive">
                          ${(video.totalInvestment * 0.7).toFixed(2)}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="label">Investors:</span>
                        <span className="value">{video.investmentCount || 0}</span>
                      </div>

                      <div className="detail-item">
                        <span className="label">Views:</span>
                        <span className="value">{video.views || 0}</span>
                      </div>

                      <div className="detail-item">
                        <span className="label">Uploaded:</span>
                        <span className="value">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/watch/${video._id}`)}
                      >
                        View Video
                      </button>
                      <button className="btn-tertiary">Analytics</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* DISTRIBUTIONS TAB */}
        {activeTab === "distributions" && (
          <section className="dashboard-section">
            <h2>Earnings Distributions</h2>

            {distributions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">💸</p>
                <p className="empty-title">No distributions yet</p>
                <p className="empty-subtitle">Distributions happen monthly when videos receive investments</p>
              </div>
            ) : (
              <div className="distributions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Video</th>
                      <th>Total Investment</th>
                      <th>Your Share (70%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map(dist => (
                      <tr key={dist._id}>
                        <td>{new Date(dist.createdAt).toLocaleDateString()}</td>
                        <td>{dist.videoId?.title || "Unknown"}</td>
                        <td>${dist.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="positive">
                          ${(dist.amount * 0.7).toFixed(2)}
                        </td>
                        <td>
                          <span className={`status ${dist.status?.toLowerCase()}`}>
                            {dist.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <section className="dashboard-section">
            <h2>Advanced Analytics</h2>

            <div className="analytics-grid">
              {/* Top Videos */}
              <div className="analytics-card">
                <h3>Top Performing Videos</h3>
                <div className="top-videos-list">
                  {videos
                    .sort((a, b) => (b.totalInvestment || 0) - (a.totalInvestment || 0))
                    .slice(0, 5)
                    .map((video, idx) => (
                      <div key={video._id} className="top-video-item">
                        <span className="rank">#{idx + 1}</span>
                        <span className="title">{video.title}</span>
                        <span className="earnings">
                          ${(video.totalInvestment * 0.7).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Audience Demographics */}
              <div className="analytics-card">
                <h3>Audience Demographics</h3>
                <div className="demographics">
                  <div className="demo-item">
                    <span>Ages 18-24:</span>
                    <div className="demo-bar" style={{ width: "35%" }}>35%</div>
                  </div>
                  <div className="demo-item">
                    <span>Ages 25-34:</span>
                    <div className="demo-bar" style={{ width: "40%" }}>40%</div>
                  </div>
                  <div className="demo-item">
                    <span>Ages 35-44:</span>
                    <div className="demo-bar" style={{ width: "18%" }}>18%</div>
                  </div>
                  <div className="demo-item">
                    <span>45+:</span>
                    <div className="demo-bar" style={{ width: "7%" }}>7%</div>
                  </div>
                </div>
              </div>

              {/* Subscriber Growth */}
              <div className="analytics-card">
                <h3>Subscriber Growth Last 3 Months</h3>
                <div className="growth-stats">
                  <div className="growth-item">
                    <span className="period">December</span>
                    <span className="value">1,250</span>
                  </div>
                  <div className="growth-item">
                    <span className="period">January</span>
                    <span className="value">1,580</span>
                    <span className="arrow">↑ +330</span>
                  </div>
                  <div className="growth-item">
                    <span className="period">February</span>
                    <span className="value">2,145</span>
                    <span className="arrow">↑ +565</span>
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="analytics-card">
                <h3>Engagement Statistics</h3>
                <div className="engagement-list">
                  <div className="engagement-item">
                    <span className="label">Avg Watch Time:</span>
                    <span className="value">4m 32s</span>
                  </div>
                  <div className="engagement-item">
                    <span className="label">Click-through Rate:</span>
                    <span className="value">12.5%</span>
                  </div>
                  <div className="engagement-item">
                    <span className="label">Share Rate:</span>
                    <span className="value">8.2%</span>
                  </div>
                  <div className="engagement-item">
                    <span className="label">Avg Rating:</span>
                    <span className="value">⭐ 4.6/5</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <section className="dashboard-actions">
        <button
          className="btn-primary btn-large"
          onClick={() => navigate("/upload")}
        >
          🎬 Upload New Video
        </button>
        <button
          className="btn-secondary btn-large"
          onClick={() => navigate("/profile")}
        >
          👤 Creator Profile
        </button>
      </section>
    </div>
  );
}

export default CreatorEarningsDashboard;
