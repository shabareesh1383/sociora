import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const InvestmentsPage = ({ auth, setMessage }) => {
  const [myInvestments, setMyInvestments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const navigate = useNavigate();

  // Redirect if not logged in
  if (!auth) {
    return (
      <div className="page-container">
        <div className="message-box">
          <p>Please log in to view investments.</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  // Load my investments
  const loadMyInvestments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      const data = await res.json();
      setMyInvestments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading investments:", error);
      setMyInvestments([]);
    } finally {
      setLoadingMine(false);
    }
  };

  // Load transparency ledger
  const loadLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      const data = await res.json();
      setLedger(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading ledger:", error);
      setLedger([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadMyInvestments();
    loadLedger();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadMyInvestments();
      loadLedger();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalInvested = myInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalDistributed = ledger
    .filter(entry => entry.type === "distribution")
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);

  return (
    <div className="page-container">
      <h1>Investments & Revenue Transparency</h1>

      {/* Summary Stats */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Invested</h3>
          <p className="stat-value">${totalInvested.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue Distributed</h3>
          <p className="stat-value">${totalDistributed.toFixed(2)}</p>
        </div>
      </div>

      {/* My Investments */}
      <div className="investments-section">
        <h2>My Investments</h2>
        {loadingMine ? (
          <p>Loading...</p>
        ) : myInvestments.length === 0 ? (
          <p className="no-data">You haven't invested yet.</p>
        ) : (
          <div className="transactions-list">
            {myInvestments.map((investment) => (
              <div key={investment._id} className="transaction-item">
                <div className="transaction-info">
                  <h4>{investment.videoTitle || "Untitled Video"}</h4>
                  <p className="creator-name">
                    by {investment.creatorName || "Unknown Creator"}
                  </p>
                  <p className="transaction-date">
                    {new Date(investment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="transaction-amount">
                  <span className="badge investment">Investment</span>
                  <p>${investment.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transparency Ledger */}
      <div className="ledger-section">
        <h2>Revenue Transparency Dashboard</h2>
        <p className="ledger-info">
          Complete ledger of all investments and revenue distributions on the platform.
        </p>
        {loadingLedger ? (
          <p>Loading...</p>
        ) : ledger.length === 0 ? (
          <p className="no-data">No transactions yet.</p>
        ) : (
          <div className="transactions-list">
            {ledger.map((entry) => (
              <div key={entry._id} className="transaction-item">
                <div className="transaction-info">
                  <h4>{entry.videoTitle || "Untitled Video"}</h4>
                  <p className="creator-name">
                    {entry.type === "investment"
                      ? `Investor: ${entry.investorName || "Unknown"}`
                      : `Creator: ${entry.creatorName || "Unknown"}`}
                  </p>
                  <p className="transaction-date">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="transaction-amount">
                  <span className={`badge ${entry.type}`}>
                    {entry.type === "investment" ? "Investment" : "Distribution"}
                  </span>
                  <p>${entry.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentsPage;
