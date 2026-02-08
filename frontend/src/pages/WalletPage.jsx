import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WalletPage = ({ auth, setMessage }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!auth) return;
    loadWalletData();
  }, [auth, filter]);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      const walletRes = await fetch(`${API_BASE}/api/crypto/wallet`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!walletRes.ok) throw new Error("Failed to load wallet");
      const walletData = await walletRes.json();
      setWallet(walletData);

      // Load transactions
      const params = new URLSearchParams();
      if (filter !== "all") params.append("type", filter);
      params.append("limit", "50");

      const txRes = await fetch(
        `${API_BASE}/api/crypto/transactions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (!txRes.ok) throw new Error("Failed to load transactions");
      const txData = await txRes.json();
      setTransactions(txData.transactions);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading">Loading wallet...</div></div>;
  }

  if (!wallet) {
    return <div className="page-container"><div className="message-box">Wallet not available</div></div>;
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage("✅ Copied to clipboard");
  };

  return (
    <div className="page-container">
      <section className="wallet-section">
        <h1>💼 Crypto Wallet</h1>

        {/* WALLET INFO */}
        <div className="wallet-card">
          <div className="wallet-balance">
            <h2>Your Balance</h2>
            <div className="balance-display">
              <span className="amount">{wallet.balance.toFixed(2)}</span>
              <span className="currency">SOCIORA Tokens</span>
            </div>
          </div>

          <div className="wallet-address">
            <h3>Wallet Address</h3>
            <div className="address-display">
              <input 
                type="text" 
                value={wallet.walletAddress} 
                readOnly
                className="address-input"
              />
              <button 
                className="btn-copy"
                onClick={() => copyToClipboard(wallet.walletAddress)}
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>

        {/* ACCOUNT STATS */}
        <div className="wallet-stats">
          <h2>📊 Account Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="label">Account Type</span>
              <span className="value">{wallet.role === "creator" ? "🎬 Creator" : "💼 Investor"}</span>
            </div>
            <div className="stat-box">
              <span className="label">Subscription Tier</span>
              <span className="value">{wallet.subscriptionTier.toUpperCase()}</span>
            </div>
            <div className="stat-box">
              <span className="label">Total Earned</span>
              <span className="value">{wallet.stats.totalEarned.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <span className="label">Total Invested</span>
              <span className="value">{wallet.stats.totalInvested.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <span className="label">Total Returns</span>
              <span className="value">{wallet.stats.totalReturns.toFixed(2)}</span>
            </div>
            {wallet.role === "creator" && (
              <div className="stat-box">
                <span className="label">Videos Uploaded</span>
                <span className="value">{wallet.stats.videosCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* TRANSACTION FILTERS */}
        <div className="transaction-filters">
          <h2>📝 Transaction History</h2>
          <div className="filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Transactions
            </button>
            <button
              className={`filter-btn ${filter === "video_investment" ? "active" : ""}`}
              onClick={() => setFilter("video_investment")}
            >
              Investments
            </button>
            <button
              className={`filter-btn ${filter === "crypto_generation" ? "active" : ""}`}
              onClick={() => setFilter("crypto_generation")}
            >
              Crypto Generated
            </button>
            <button
              className={`filter-btn ${filter === "investor_returns" ? "active" : ""}`}
              onClick={() => setFilter("investor_returns")}
            >
              Returns
            </button>
            <button
              className={`filter-btn ${filter === "template_purchase" ? "active" : ""}`}
              onClick={() => setFilter("template_purchase")}
            >
              Template Purchases
            </button>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className="transaction-item">
                <div className="tx-icon">
                  {tx.transactionType === "video_investment" && "💸"}
                  {tx.transactionType === "crypto_generation" && "🎬"}
                  {tx.transactionType === "investor_returns" && "💰"}
                  {tx.transactionType === "template_purchase" && "📦"}
                  {tx.transactionType === "platform_fee" && "🏢"}
                  {!["video_investment", "crypto_generation", "investor_returns", "template_purchase", "platform_fee"].includes(tx.transactionType) && "📝"}
                </div>
                
                <div className="tx-info">
                  <h4>{tx.transactionType.replace(/_/g, " ").toUpperCase()}</h4>
                  <p className="tx-description">{tx.description}</p>
                  <span className="tx-hash">Hash: {tx.transactionHash.substring(0, 20)}...</span>
                </div>

                <div className="tx-amount">
                  <span className={`amount ${tx.fromUser ? "negative" : "positive"}`}>
                    {tx.fromUser ? "-" : "+"}{tx.amount.toFixed(2)}
                  </span>
                  <span className={`status ${tx.status}`}>{tx.status}</span>
                </div>

                <div className="tx-date">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </div>

                {tx.blockchainConfirmed && (
                  <span className="blockchain-badge">✓ Confirmed</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default WalletPage;
