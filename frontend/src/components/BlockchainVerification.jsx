import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BlockchainVerification = ({ videoId, transactionId, userId }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Verify Video
  const verifyVideo = async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/api/blockchain/verify/video/${videoId}`
      );
      setVerification(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify Transaction
  const verifyTransaction = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/api/blockchain/verify/transaction/${transactionId}`
      );
      setVerification(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Get Audit Trail
  const getAuditTrail = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/api/blockchain/audit-trail/${transactionId}`
      );
      setVerification(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get audit trail');
    } finally {
      setLoading(false);
    }
  };

  // Get Blockchain Stats
  const getBlockchainStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/api/blockchain/stats`
      );
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get stats');
    } finally {
      setLoading(false);
    }
  };

  // Verify User Data
  const verifyUserData = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/api/blockchain/verify/user/${userId}`
      );
      setVerification(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔐 Blockchain Verification</h2>

      <div style={styles.buttonGroup}>
        {videoId && (
          <button onClick={verifyVideo} style={styles.button} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Video'}
          </button>
        )}
        {transactionId && (
          <>
            <button onClick={verifyTransaction} style={styles.button} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Transaction'}
            </button>
            <button onClick={getAuditTrail} style={styles.button} disabled={loading}>
              {loading ? 'Loading...' : 'View Audit Trail'}
            </button>
          </>
        )}
        {userId && (
          <button onClick={verifyUserData} style={styles.button} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify User Data'}
          </button>
        )}
        <button onClick={getBlockchainStats} style={styles.statsButton} disabled={loading}>
          {loading ? 'Loading...' : 'Blockchain Stats'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {verification && (
        <div style={styles.verification}>
          <div style={styles.header}>
            {verification.verified ? (
              <div style={styles.verified}>✅ VERIFIED</div>
            ) : (
              <div style={styles.notVerified}>❌ NOT VERIFIED</div>
            )}
          </div>

          <div style={styles.content}>
            {/* Video Verification */}
            {verification.videoId && (
              <>
                <div style={styles.field}>
                  <strong>Video ID:</strong> {verification.videoId}
                </div>
                <div style={styles.field}>
                  <strong>Status:</strong> {verification.integrityStatus}
                </div>
                <div style={styles.field}>
                  <strong>Video Hash:</strong>
                  <code style={styles.code}>{verification.videoHash?.substring(0, 32)}...</code>
                </div>
                <div style={styles.field}>
                  <strong>Uploaded By:</strong> {verification.creatorId}
                </div>
                <div style={styles.field}>
                  <strong>Uploaded At:</strong> {new Date(verification.uploadedAt).toLocaleString()}
                </div>
                <div style={styles.field}>
                  <strong>Block ID:</strong> {verification.blockId}
                </div>
                <div style={styles.field}>
                  <strong>Verified At:</strong> {new Date(verification.timestamp).toLocaleString()}
                </div>
              </>
            )}

            {/* Transaction Verification */}
            {verification.transactionId && (
              <>
                <div style={styles.field}>
                  <strong>Transaction ID:</strong> {verification.transactionId}
                </div>
                <div style={styles.field}>
                  <strong>Status:</strong> {verification.integrityStatus}
                </div>
                <div style={styles.field}>
                  <strong>From:</strong> {verification.from}
                </div>
                <div style={styles.field}>
                  <strong>To:</strong> {verification.to}
                </div>
                <div style={styles.field}>
                  <strong>Amount:</strong> {verification.amount} SOCIORA
                </div>
                <div style={styles.field}>
                  <strong>Status:</strong> {verification.status}
                </div>
                <div style={styles.field}>
                  <strong>Nonce:</strong>
                  <code style={styles.code}>{verification.nonce?.substring(0, 16)}...</code>
                </div>
                <div style={styles.field}>
                  <strong>Block ID:</strong> {verification.blockId}
                </div>
                <div style={styles.field}>
                  <strong>Verified At:</strong> {new Date(verification.timestamp).toLocaleString()}
                </div>
              </>
            )}

            {/* User Data Verification */}
            {verification.userId && !verification.transactionId && (
              <>
                <div style={styles.field}>
                  <strong>User ID:</strong> {verification.userId}
                </div>
                <div style={styles.field}>
                  <strong>Name:</strong> {verification.name}
                </div>
                <div style={styles.field}>
                  <strong>Role:</strong> {verification.role}
                </div>
                <div style={styles.field}>
                  <strong>Status:</strong> {verification.integrityStatus}
                </div>
                <div style={styles.field}>
                  <strong>Last Modified:</strong> {new Date(verification.lastModified).toLocaleString()}
                </div>
                <div style={styles.field}>
                  <strong>Change History:</strong> {verification.changeHistory?.length || 0} changes
                </div>
                <div style={styles.field}>
                  <strong>Block ID:</strong> {verification.blockId}
                </div>
              </>
            )}

            {/* Audit Trail */}
            {verification.merkleProof && (
              <>
                <div style={styles.field}>
                  <strong>Block Position:</strong> {verification.blockPosition} / {verification.totalBlocks}
                </div>
                <div style={styles.field}>
                  <strong>Merkle Proof Levels:</strong> {verification.merkleProof?.length || 0}
                </div>
                <div style={styles.field}>
                  <strong>Previous Hash:</strong>
                  <code style={styles.code}>{verification.previousHash?.substring(0, 32)}...</code>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {stats && (
        <div style={styles.stats}>
          <h3 style={styles.statsTitle}>📊 Blockchain Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalBlocks}</div>
              <div style={styles.statLabel}>Total Blocks</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalVideos}</div>
              <div style={styles.statLabel}>Videos</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalTransactions}</div>
              <div style={styles.statLabel}>Transactions</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalUsers}</div>
              <div style={styles.statLabel}>Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.blockTypes.videos}</div>
              <div style={styles.statLabel}>Video Blocks</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.blockTypes.investments}</div>
              <div style={styles.statLabel}>Investment Blocks</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.blockTypes.userData}</div>
              <div style={styles.statLabel}>User Data Blocks</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalMerkleTreeLevels}</div>
              <div style={styles.statLabel}>Merkle Levels</div>
            </div>
          </div>
          <div style={styles.statInfo}>
            <strong>Created:</strong> {new Date(stats.createdAt).toLocaleDateString()}
            <br />
            <strong>Last Updated:</strong> {new Date(stats.lastUpdated).toLocaleString()}
            <br />
            <strong>Version:</strong> {stats.blockchainVersion}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #333'
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    marginBottom: '15px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  statsButton: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  error: {
    backgroundColor: '#d32f2f',
    color: '#fff',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px'
  },
  verification: {
    backgroundColor: '#0d1b2a',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #1a3a52'
  },
  header: {
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #1a3a52'
  },
  verified: {
    color: '#4CAF50',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  notVerified: {
    color: '#d32f2f',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  content: {
    color: '#e0e0e0',
    fontSize: '14px'
  },
  field: {
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #1a3a52'
  },
  code: {
    backgroundColor: '#1a1a1a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    marginLeft: '5px'
  },
  stats: {
    backgroundColor: '#0d1b2a',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #1a3a52'
  },
  statsTitle: {
    color: '#2196F3',
    marginBottom: '20px',
    fontSize: '18px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  statCard: {
    backgroundColor: '#1a2a3a',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #1a3a52',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '5px'
  },
  statLabel: {
    color: '#90caf9',
    fontSize: '12px'
  },
  statInfo: {
    color: '#90caf9',
    fontSize: '12px',
    padding: '10px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px'
  }
};

export default BlockchainVerification;
