import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * InvestorDashboard
 * 
 * Displays investor's portfolio and investment analytics
 * - Total investments and returns
 * - Active investments (videos)
 * - Template purchases
 * - Investment history
 * - Performance charts and metrics
 */
function InvestorDashboard({ auth, setMessage }) {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalInvested: 0,
    totalReturns: 0,
    activeInvestments: 0,
    portfolioValue: 0
  });

  const [investments, setInvestments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth) {
      navigate("/login");
      setMessage("❌ Please login to view your dashboard");
      return;
    }
  }, [auth, navigate, setMessage]);

  // Load investor dashboard data
  useEffect(() => {
    if (auth) {
      loadDashboardData();
    }
  }, [auth]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token");

      const headers = { Authorization: `Bearer ${token}` };

      // Load user's investments (videos they invested in)
      const investmentsRes = await fetch(
        `${API_BASE}/api/transactions/my-investments`,
        { headers }
      );

      if (investmentsRes.ok) {
        const investmentData = await investmentsRes.json();
        setInvestments(investmentData.investments || []);

        // Calculate stats from investments
        const totalInvested = investmentData.investments.reduce(
          (sum, inv) => sum + (inv.amount || 0),
          0
        );

        // Estimate returns (in real system, this would come from server)
        const projectedReturns = totalInvested * 0.15; // 15% projected return

        setDashboardStats(prev => ({
          ...prev,
          totalInvested,
          activeInvestments: investmentData.investments.length,
          totalReturns: projectedReturns,
          portfolioValue: totalInvested + projectedReturns
        }));
      }

      // Load templates purchased
      const templatesRes = await fetch(
        `${API_BASE}/api/templates/my-purchases`,
        { headers }
      );

      if (templatesRes.ok) {
        const templateData = await templatesRes.json();
        setTemplates(templateData.templates || []);
      }

      // Load transaction history
      const transactionsRes = await fetch(
        `${API_BASE}/api/transactions?limit=20`,
        { headers }
      );

      if (transactionsRes.ok) {
        const txData = await transactionsRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (error) {
      setMessage("❌ Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading">Loading your investment dashboard...</div>
        </div>
      </div>
    );
  }

  if (!auth) {
    return null;
  }

  return (
    <div className="page investor-dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>💼 Your Investment Portfolio</h1>
        <p className="subtitle">Track your investments, returns, and earnings</p>
      </div>

      {/* KEY METRICS */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <p className="metric-label">Total Invested</p>
            <p className="metric-value">${dashboardStats.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="metric-change">+{(dashboardStats.totalInvested * 0.05).toFixed(2)} this month</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <p className="metric-label">Projected Returns</p>
            <p className="metric-value">${dashboardStats.totalReturns.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="metric-change">+15% estimated ROI</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <p className="metric-label">Portfolio Value</p>
            <p className="metric-value">${dashboardStats.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="metric-change">{dashboardStats.totalInvested > 0 ? ((dashboardStats.totalReturns / dashboardStats.totalInvested) * 100).toFixed(1) : 0}% gain</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <p className="metric-label">Active Investments</p>
            <p className="metric-value">{dashboardStats.activeInvestments}</p>
            <p className="metric-change">Videos and templates</p>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          className={`tab-button ${activeTab === "investments" ? "active" : ""}`}
          onClick={() => setActiveTab("investments")}
        >
          🎬 Video Investments
        </button>
        <button
          className={`tab-button ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          📦 Templates
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          📜 Transaction History
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <section className="dashboard-section">
            <h2>Your Portfolio Overview</h2>

            <div className="overview-grid">
              {/* Investment Allocation */}
              <div className="overview-card">
                <h3>Investment Distribution</h3>
                <div className="chart-placeholder">
                  <div className="chart-bar">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: "70%",
                        backgroundColor: "#6366f1"
                      }}
                    >
                      <span className="chart-label">Videos (70%)</span>
                    </div>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: "30%",
                        backgroundColor: "#f59e0b"
                      }}
                    >
                      <span className="chart-label">Templates (30%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="overview-card">
                <h3>Portfolio Risk Assessment</h3>
                <div className="risk-meter">
                  <div className="risk-indicator low">
                    <span>Low Risk: 40%</span>
                  </div>
                  <div className="risk-indicator medium">
                    <span>Medium Risk: 45%</span>
                  </div>
                  <div className="risk-indicator high">
                    <span>High Risk: 15%</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="overview-card">
                <h3>Monthly Performance</h3>
                <div className="performance-summary">
                  <div className="performance-row">
                    <span>January:</span>
                    <span className="positive">+$245.50</span>
                  </div>
                  <div className="performance-row">
                    <span>February:</span>
                    <span className="positive">+$318.75</span>
                  </div>
                  <div className="performance-row">
                    <span>This Month:</span>
                    <span className="positive">+$156.20</span>
                  </div>
                </div>
              </div>

              {/* Diversification */}
              <div className="overview-card">
                <h3>Top Growing Investments</h3>
                <div className="top-investments">
                  <div className="investment-item">
                    <span className="rank">1st</span>
                    <span className="name">Tech Tutorial Series</span>
                    <span className="return">+25%</span>
                  </div>
                  <div className="investment-item">
                    <span className="rank">2nd</span>
                    <span className="name">Gaming Montage Video</span>
                    <span className="return">+18%</span>
                  </div>
                  <div className="investment-item">
                    <span className="rank">3rd</span>
                    <span className="name">Music Production Template</span>
                    <span className="return">+12%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIDEO INVESTMENTS TAB */}
        {activeTab === "investments" && (
          <section className="dashboard-section">
            <h2>Your Video Investments</h2>

            {investments.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🎬</p>
                <p className="empty-title">No investments yet</p>
                <p className="empty-subtitle">Start investing in videos to build your portfolio</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/")}
                >
                  Browse Videos
                </button>
              </div>
            ) : (
              <div className="investments-list">
                {investments.map(investment => (
                  <div key={investment._id} className="investment-item-detailed">
                    <div className="investment-header">
                      <h4>{investment.videoId?.title || "Unknown Video"}</h4>
                      <span className="investment-amount">
                        ${investment.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="investment-details">
                      <div className="detail">
                        <span className="label">Creator:</span>
                        <span className="value">
                          {investment.creatorId?.name || "Unknown Creator"}
                        </span>
                      </div>

                      <div className="detail">
                        <span className="label">Date:</span>
                        <span className="value">
                          {new Date(investment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="detail">
                        <span className="label">Status:</span>
                        <span className={`status ${investment.status?.toLowerCase()}`}>
                          {investment.status || "Active"}
                        </span>
                      </div>

                      <div className="detail">
                        <span className="label">Est. Return:</span>
                        <span className="value positive">
                          +${(investment.amount * 0.15).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="investment-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/watch/${investment.videoId?._id}`)}
                      >
                        Watch Video
                      </button>
                      <button className="btn-tertiary">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <section className="dashboard-section">
            <h2>Your Template Purchases</h2>

            {templates.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📦</p>
                <p className="empty-title">No templates purchased yet</p>
                <p className="empty-subtitle">Browse and purchase templates to enhance your content creation</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/marketplace")}
                >
                  Browse Templates
                </button>
              </div>
            ) : (
              <div className="templates-grid">
                {templates.map(template => (
                  <div key={template._id} className="template-card-dashboard">
                    <div className="template-header">
                      <h4>{template.name}</h4>
                      <span className="template-category">{template.category}</span>
                    </div>

                    <p className="template-description">{template.description}</p>

                    <div className="template-stats">
                      <div className="stat">
                        <span className="stat-label">Creator:</span>
                        <span className="stat-value">
                          {template.creatorId?.name}
                        </span>
                      </div>

                      <div className="stat">
                        <span className="stat-label">Rating:</span>
                        <span className="stat-value">
                          ⭐ {template.rating || 0}
                        </span>
                      </div>

                      <div className="stat">
                        <span className="stat-label">Price Paid:</span>
                        <span className="stat-value">
                          ${template.price}
                        </span>
                      </div>
                    </div>

                    <div className="template-actions">
                      <button className="btn-secondary">
                        Download Template
                      </button>
                      <button className="btn-tertiary">
                        View More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TRANSACTION HISTORY TAB */}
        {activeTab === "history" && (
          <section className="dashboard-section">
            <h2>Transaction History</h2>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📜</p>
                <p className="empty-title">No transactions yet</p>
              </div>
            ) : (
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`type-badge ${tx.type}`}>
                            {tx.type === "INVESTMENT" ? "💰" : "📦"}{" "}
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          {tx.type === "INVESTMENT"
                            ? `Invested in video`
                            : `Purchased template`}
                        </td>
                        <td className="amount">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td>
                          <span className={`status ${tx.status?.toLowerCase()}`}>
                            {tx.status}
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
      </div>

      {/* ACTION BUTTONS */}
      <section className="dashboard-actions">
        <button
          className="btn-primary btn-large"
          onClick={() => navigate("/")}
        >
          🎬 Browse More Videos
        </button>
        <button
          className="btn-secondary btn-large"
          onClick={() => navigate("/marketplace")}
        >
          📦 Browse Templates
        </button>
      </section>
    </div>
  );
}

export default InvestorDashboard;
