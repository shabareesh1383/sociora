/**
 * Blockchain Verification Routes
 * Endpoints for verifying video, transaction, and user data integrity
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const enhancedBlockchainService = require('../services/enhancedBlockchainService');

/**
 * GET /api/blockchain/verify/video/:videoId
 * Verify video integrity on blockchain
 */
router.get('/verify/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    const verification = enhancedBlockchainService.verifyVideoIntegrity(videoId);

    if (!verification.verified && verification.error) {
      return res.status(404).json({
        success: false,
        message: verification.error,
        ...verification
      });
    }

    res.json({
      success: true,
      message: verification.integrityStatus === 'VALID' 
        ? '✅ Video integrity verified'
        : '❌ Video has been tampered with',
      ...verification
    });
  } catch (error) {
    console.error('Error verifying video:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying video integrity',
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/verify/transaction/:transactionId
 * Verify investment transaction integrity
 */
router.get('/verify/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const verification = enhancedBlockchainService.verifyTransaction(transactionId);

    if (!verification.verified && verification.error) {
      return res.status(404).json({
        success: false,
        message: verification.error,
        ...verification
      });
    }

    res.json({
      success: true,
      message: verification.integrityStatus === 'VALID'
        ? '✅ Transaction verified and immutable'
        : '❌ Transaction integrity compromised',
      ...verification
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying transaction',
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/verify/user/:userId
 * Verify user data integrity
 */
router.get('/verify/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const verification = enhancedBlockchainService.verifyUserData(userId);

    if (!verification.verified && verification.error) {
      return res.status(404).json({
        success: false,
        message: verification.error,
        ...verification
      });
    }

    res.json({
      success: true,
      message: verification.integrityStatus === 'VALID'
        ? '✅ User data verified'
        : '❌ User data has been modified',
      ...verification
    });
  } catch (error) {
    console.error('Error verifying user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user data',
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/audit-trail/:transactionId
 * Get complete audit trail for transaction verification
 */
router.get('/audit-trail/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const auditTrail = enhancedBlockchainService.getTransactionAuditTrail(transactionId);

    if (auditTrail.error) {
      return res.status(404).json({
        success: false,
        ...auditTrail
      });
    }

    res.json({
      success: true,
      message: '📋 Complete transaction audit trail',
      ...auditTrail
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit trail',
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/stats
 * Get blockchain statistics and health
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = enhancedBlockchainService.getBlockchainStats();

    res.json({
      success: true,
      message: '📊 Blockchain statistics',
      ...stats
    });
  } catch (error) {
    console.error('Error getting blockchain stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving blockchain stats',
      error: error.message
    });
  }
});

/**
 * POST /api/blockchain/record/video
 * Record video on blockchain (internal use)
 */
router.post('/record/video', auth, async (req, res) => {
  try {
    const { videoId, title, description, creatorId, creatorName, thumbnail, duration, tags, metadata } = req.body;

    // Verify user is creator
    if (req.user.id !== creatorId) {
      return res.status(403).json({
        success: false,
        message: '❌ Only creators can record their own videos'
      });
    }

    const result = enhancedBlockchainService.recordVideoUpload({
      _id: videoId,
      title,
      description,
      creatorId,
      creatorName,
      thumbnail,
      duration,
      tags,
      uploadedAt: new Date().toISOString(),
      metadata
    });

    res.json({
      success: true,
      message: '✅ Video recorded on blockchain',
      ...result
    });
  } catch (error) {
    console.error('Error recording video:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording video on blockchain',
      error: error.message
    });
  }
});

/**
 * POST /api/blockchain/record/transaction
 * Record investment transaction on blockchain (internal use)
 */
router.post('/record/transaction', auth, async (req, res) => {
  try {
    const {
      from,
      fromName,
      to,
      toName,
      videoId,
      videoTitle,
      amount,
      investmentType,
      platformFee
    } = req.body;

    // Verify user is investor
    if (req.user.id !== from) {
      return res.status(403).json({
        success: false,
        message: '❌ Only investors can record their transactions'
      });
    }

    const result = enhancedBlockchainService.recordInvestment({
      from,
      fromName,
      to,
      toName,
      videoId,
      videoTitle,
      amount,
      investmentType,
      platformFee
    });

    res.json({
      success: true,
      message: '✅ Transaction recorded on blockchain',
      ...result
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording transaction on blockchain',
      error: error.message
    });
  }
});

/**
 * POST /api/blockchain/record/user
 * Record user data change on blockchain (internal use)
 */
router.post('/record/user', auth, async (req, res) => {
  try {
    const {
      userId,
      email,
      name,
      role,
      cryptoBalance,
      totalEarned,
      totalInvested,
      followerCount,
      followingCount,
      videoCount,
      changeType,
      reason
    } = req.body;

    // Verify user owns their data
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: '❌ Cannot record other user data'
      });
    }

    const result = enhancedBlockchainService.recordUserChange({
      userId,
      email,
      name,
      role,
      cryptoBalance,
      totalEarned,
      totalInvested,
      followerCount,
      followingCount,
      videoCount,
      changeType,
      reason,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: '✅ User data change recorded on blockchain',
      ...result
    });
  } catch (error) {
    console.error('Error recording user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording user data on blockchain',
      error: error.message
    });
  }
});

module.exports = router;
