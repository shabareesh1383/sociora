import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProfilePage = ({ auth, setMessage, onLogout, onAuthUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      loadUserStats();
    }
  }, [auth, auth?.id]);

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE}/api/engagement/user/${auth.id}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="page-container">
        <div className="message-box">
          <p>Please log in to view your profile.</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const handleUpgradeToCreator = async () => {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/api/auth/upgrade-to-creator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.message || "Failed to upgrade account"}`);
        setLoading(false);
        return;
      }

      const updatedAuth = {
        ...auth,
        role: data.role,
        token: data.token,
        name: data.name,
        email: data.email,
        cryptoBalance: data.cryptoBalance,
        walletAddress: data.walletAddress,
        subscriptionTier: data.subscriptionTier
      };
      localStorage.setItem("socioraAuth", JSON.stringify(updatedAuth));
      localStorage.setItem("authToken", data.token);
      onAuthUpdate(updatedAuth);

      setMessage("✅ You have been upgraded to Creator! You can now upload videos.");
      setTimeout(() => navigate("/upload"), 1000);
    } catch (error) {
      setMessage("❌ Network error. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="profile-container">
        <h1>👤 My Profile</h1>

        {/* BASIC INFO */}
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="profile-item">
              <label>Name:</label>
              <p>{auth.name || "Not set"}</p>
            </div>

            <div className="profile-item">
              <label>Email:</label>
              <p>{auth.email || "Not available"}</p>
            </div>

            <div className="profile-item">
              <label>Account Type:</label>
              <p>
                <span className={`badge ${auth.role}`}>
                  {auth.role === "creator" ? "⭐ Creator" : "💼 Investor"}
                </span>
              </p>
            </div>

            <div className="profile-item">
              <label>Wallet Address:</label>
              <p className="wallet-code">{auth.walletAddress || "Not created"}</p>
            </div>
          </div>
        </div>

        {/* CRYPTO & BALANCE */}
        <div className="profile-section">
          <h2>💰 Crypto & Balance</h2>
          <div className="profile-info">
            <div className="profile-item">
              <label>Crypto Balance:</label>
              <p className="crypto-balance">🪙 {(auth.cryptoBalance || 0).toFixed(2)} SOCIORA</p>
            </div>

            <div className="profile-item">
              <label>Subscription Tier:</label>
              <p>
                <span className={`tier-badge ${auth.subscriptionTier || "free"}`}>
                  {auth.subscriptionTier?.toUpperCase() || "FREE"}
                </span>
              </p>
            </div>

            {auth.role === "creator" && stats && (
              <>
                <div className="profile-item">
                  <label>Total Earned:</label>
                  <p>💵 {(stats.totalEarned || 0).toFixed(2)} SOCIORA</p>
                </div>
              </>
            )}

            {auth.role === "investor" && stats && (
              <div className="profile-item">
                <label>Total Invested:</label>
                <p>💸 {(stats.totalInvested || 0).toFixed(2)} SOCIORA</p>
              </div>
            )}
          </div>
        </div>

        {/* ENGAGEMENT STATS */}
        {!statsLoading && stats && (
          <div className="profile-section">
            <h2>📊 Engagement & Following</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <label>Followers</label>
                <p className="stat-number">{stats.followers || 0}</p>
              </div>
              <div className="stat-card">
                <label>Following</label>
                <p className="stat-number">{stats.following || 0}</p>
              </div>
              <div className="stat-card">
                <label>Videos Loved</label>
                <p className="stat-number">❤️ {stats.videosLoved || 0}</p>
              </div>
              <div className="stat-card">
                <label>Videos Hated</label>
                <p className="stat-number">👎 {stats.videosHated || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATOR STATS */}
        {auth.role === "creator" && !statsLoading && stats && (
          <div className="profile-section">
            <h2>🎬 Creator Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <label>Videos Created</label>
                <p className="stat-number">{stats.videosCreated || 0}</p>
              </div>
              <div className="stat-card">
                <label>Unique Investors</label>
                <p className="stat-number">💎 {stats.uniqueInvestors || 0}</p>
              </div>
              <div className="stat-card">
                <label>Total Loves Received</label>
                <p className="stat-number">❤️ {stats.totalLovesReceived || 0}</p>
              </div>
              <div className="stat-card">
                <label>Unique Followers</label>
                <p className="stat-number">👥 {stats.followers || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATOR/INVESTOR SECTION */}
        <div className="profile-section">
          <h2>✨ Account Options</h2>
          {auth.role === "creator" && (
            <div className="profile-item">
              <p className="creator-info">
                ⭐ You are a verified creator. You can upload videos and earn revenue!
              </p>
              <button 
                onClick={() => navigate("/upload")}
                className="action-btn"
              >
                🎥 Upload New Video
              </button>
            </div>
          )}

          {auth.role === "investor" && (
            <div className="profile-item">
              <p className="investor-info">
                💼 Your account is set as Investor. Want to upload videos and earn?
              </p>
              <button 
                onClick={handleUpgradeToCreator}
                disabled={loading}
                className="upgrade-btn"
              >
                {loading ? "⏳ Upgrading..." : "⭐ Upgrade to Creator"}
              </button>
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <div className="profile-actions">
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

