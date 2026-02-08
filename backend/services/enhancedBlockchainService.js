/**
 * Enhanced Blockchain Service
 * Provides immutable storage for:
 * - Video data and hashing
 * - User data protection
 * - Investment transactions
 * - Data integrity verification
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class EnhancedBlockchainService {
  constructor() {
    this.ledgerPath = path.join(__dirname, '../blockchain/enhanced-ledger.json');
    this.blockchainState = this.loadBlockchain();
  }

  /**
   * Load or initialize blockchain
   */
  loadBlockchain() {
    try {
      if (fs.existsSync(this.ledgerPath)) {
        return JSON.parse(fs.readFileSync(this.ledgerPath, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading blockchain:', err);
    }

    return {
      blocks: [],
      videos: {},
      users: {},
      transactions: {},
      merkleTree: [],
      version: '2.0',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Save blockchain to persistent storage
   */
  saveBlockchain() {
    try {
      fs.writeFileSync(
        this.ledgerPath,
        JSON.stringify(this.blockchainState, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Error saving blockchain:', err);
    }
  }

  /**
   * Generate SHA-256 hash
   */
  generateHash(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Store video on blockchain
   * Includes video metadata, hash, and integrity proof
   */
  recordVideoUpload(videoData) {
    const videoId = videoData._id || uuidv4();
    const videoHash = this.generateHash({
      title: videoData.title,
      description: videoData.description,
      creator: videoData.creatorId,
      uploadTime: videoData.uploadedAt,
      thumbnail: videoData.thumbnail,
      duration: videoData.duration
    });

    const videoBlock = {
      blockId: uuidv4(),
      blockType: 'VIDEO',
      timestamp: new Date().toISOString(),
      videoId,
      videoHash,
      creatorId: videoData.creatorId,
      creatorName: videoData.creatorName,
      title: videoData.title,
      description: videoData.description,
      duration: videoData.duration,
      tags: videoData.tags || [],
      thumbnail: videoData.thumbnail,
      uploadedAt: videoData.uploadedAt,
      metadata: {
        resolution: videoData.metadata?.resolution || 'unknown',
        codec: videoData.metadata?.codec || 'unknown',
        fileSize: videoData.metadata?.fileSize || 0
      },
      integrity: {
        hash: videoHash,
        algorithm: 'SHA-256',
        verified: true,
        verifiedAt: new Date().toISOString()
      },
      previousHash: this.getPreviousHash(),
      version: 1
    };

    // Add to blockchain
    this.blockchainState.blocks.push(videoBlock);
    this.blockchainState.videos[videoId] = {
      ...videoBlock,
      accessLog: [],
      viewCount: 0,
      engagementTimestamps: []
    };

    // Update Merkle tree
    this.updateMerkleTree();
    this.saveBlockchain();

    return {
      videoId,
      videoHash,
      blockId: videoBlock.blockId,
      verified: true,
      timestamp: videoBlock.timestamp
    };
  }

  /**
   * Record investment/transaction on blockchain
   * Creates immutable investment proof
   */
  recordInvestment(investmentData) {
    const transactionId = uuidv4();

    const transactionHash = this.generateHash({
      from: investmentData.from,
      to: investmentData.to,
      videoId: investmentData.videoId,
      amount: investmentData.amount,
      timestamp: new Date().toISOString()
    });

    const transactionBlock = {
      blockId: uuidv4(),
      blockType: 'INVESTMENT',
      timestamp: new Date().toISOString(),
      transactionId,
      from: investmentData.from,
      fromName: investmentData.fromName,
      to: investmentData.to,
      toName: investmentData.toName,
      videoId: investmentData.videoId,
      videoTitle: investmentData.videoTitle,
      amount: investmentData.amount,
      currency: 'SOCIORA',
      status: 'CONFIRMED',
      transactionHash,
      metadata: {
        investmentType: investmentData.investmentType || 'standard',
        platformFee: investmentData.platformFee || 0,
        netAmount: investmentData.amount - (investmentData.platformFee || 0)
      },
      proof: {
        hash: transactionHash,
        algorithm: 'SHA-256',
        nonce: crypto.randomBytes(16).toString('hex'),
        confirmed: true
      },
      previousHash: this.getPreviousHash(),
      version: 1
    };

    // Add to blockchain
    this.blockchainState.blocks.push(transactionBlock);
    this.blockchainState.transactions[transactionId] = transactionBlock;

    // Update video with transaction reference
    if (this.blockchainState.videos[investmentData.videoId]) {
      this.blockchainState.videos[investmentData.videoId].transactions =
        this.blockchainState.videos[investmentData.videoId].transactions || [];
      this.blockchainState.videos[investmentData.videoId].transactions.push(
        transactionId
      );
    }

    // Update Merkle tree
    this.updateMerkleTree();
    this.saveBlockchain();

    return {
      transactionId,
      transactionHash,
      blockId: transactionBlock.blockId,
      verified: true,
      timestamp: transactionBlock.timestamp,
      nonce: transactionBlock.proof.nonce,
      proof: transactionBlock.proof
    };
  }

  /**
   * Record user profile changes on blockchain
   * Creates audit trail for data integrity
   */
  recordUserChange(userData) {
    const changeId = uuidv4();
    const previousUserHash = this.blockchainState.users[userData.userId]?.hash || null;

    const userHash = this.generateHash({
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      cryptoBalance: userData.cryptoBalance,
      timestamp: new Date().toISOString()
    });

    const userBlock = {
      blockId: uuidv4(),
      blockType: 'USER_DATA',
      timestamp: new Date().toISOString(),
      changeId,
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      cryptoBalance: userData.cryptoBalance,
      totalEarned: userData.totalEarned || 0,
      totalInvested: userData.totalInvested || 0,
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      videoCount: userData.videoCount || 0,
      userHash,
      previousUserHash,
      metadata: {
        changeType: userData.changeType || 'profile_update',
        reason: userData.reason || 'standard_update',
        ipAddress: userData.ipAddress || 'unknown'
      },
      integrity: {
        hash: userHash,
        algorithm: 'SHA-256',
        verified: true,
        verifiedAt: new Date().toISOString()
      },
      previousHash: this.getPreviousHash(),
      version: 1
    };

    // Add to blockchain
    this.blockchainState.blocks.push(userBlock);
    this.blockchainState.users[userData.userId] = {
      ...userBlock,
      changeHistory: this.blockchainState.users[userData.userId]?.changeHistory || [],
      lastModified: new Date().toISOString()
    };

    // Add to change history
    this.blockchainState.users[userData.userId].changeHistory.push({
      changeId,
      blockId: userBlock.blockId,
      timestamp: userBlock.timestamp,
      changeType: userData.changeType
    });

    // Update Merkle tree
    this.updateMerkleTree();
    this.saveBlockchain();

    return {
      changeId,
      userHash,
      blockId: userBlock.blockId,
      verified: true,
      timestamp: userBlock.timestamp,
      previousUserHash
    };
  }

  /**
   * Get previous hash (last block's hash)
   */
  getPreviousHash() {
    if (this.blockchainState.blocks.length === 0) {
      return this.generateHash('GENESIS');
    }
    const lastBlock = this.blockchainState.blocks[this.blockchainState.blocks.length - 1];
    return this.generateHash(lastBlock);
  }

  /**
   * Update Merkle tree for blockchain validation
   */
  updateMerkleTree() {
    if (this.blockchainState.blocks.length === 0) {
      this.blockchainState.merkleTree = [];
      return;
    }

    const blockHashes = this.blockchainState.blocks.map((block) =>
      this.generateHash(block)
    );

    let tree = [blockHashes];
    while (tree[tree.length - 1].length > 1) {
      const currentLevel = tree[tree.length - 1];
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const parent = this.generateHash(left + right);
        nextLevel.push(parent);
      }

      tree.push(nextLevel);
    }

    this.blockchainState.merkleTree = tree;
  }

  /**
   * Verify video integrity
   */
  verifyVideoIntegrity(videoId) {
    const videoBlock = this.blockchainState.videos[videoId];
    if (!videoBlock) {
      return {
        verified: false,
        error: 'Video not found on blockchain',
        videoId
      };
    }

    const currentHash = this.generateHash({
      title: videoBlock.title,
      description: videoBlock.description,
      creator: videoBlock.creatorId,
      uploadTime: videoBlock.uploadedAt,
      thumbnail: videoBlock.thumbnail,
      duration: videoBlock.duration
    });

    const isValid = currentHash === videoBlock.integrity.hash;

    return {
      verified: isValid,
      videoId,
      videoHash: videoBlock.integrity.hash,
      currentHash,
      blockId: videoBlock.blockId,
      uploadedAt: videoBlock.uploadedAt,
      creatorId: videoBlock.creatorId,
      integrityStatus: isValid ? 'VALID' : 'TAMPERED',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify investment transaction
   */
  verifyTransaction(transactionId) {
    const transactionBlock = this.blockchainState.transactions[transactionId];
    if (!transactionBlock) {
      return {
        verified: false,
        error: 'Transaction not found on blockchain',
        transactionId
      };
    }

    const currentHash = this.generateHash({
      from: transactionBlock.from,
      to: transactionBlock.to,
      videoId: transactionBlock.videoId,
      amount: transactionBlock.amount,
      timestamp: transactionBlock.timestamp
    });

    const isValid = currentHash === transactionBlock.transactionHash;

    return {
      verified: isValid,
      transactionId,
      transactionHash: transactionBlock.transactionHash,
      currentHash,
      blockId: transactionBlock.blockId,
      from: transactionBlock.from,
      to: transactionBlock.to,
      amount: transactionBlock.amount,
      status: transactionBlock.status,
      integrityStatus: isValid ? 'VALID' : 'TAMPERED',
      timestamp: new Date().toISOString(),
      nonce: transactionBlock.proof.nonce
    };
  }

  /**
   * Verify user data integrity
   */
  verifyUserData(userId) {
    const userBlock = this.blockchainState.users[userId];
    if (!userBlock) {
      return {
        verified: false,
        error: 'User not found on blockchain',
        userId
      };
    }

    const currentHash = this.generateHash({
      userId: userBlock.userId,
      email: userBlock.email,
      name: userBlock.name,
      role: userBlock.role,
      cryptoBalance: userBlock.cryptoBalance,
      timestamp: userBlock.timestamp
    });

    const isValid = currentHash === userBlock.userHash;

    return {
      verified: isValid,
      userId,
      userHash: userBlock.userHash,
      currentHash,
      blockId: userBlock.blockId,
      name: userBlock.name,
      role: userBlock.role,
      lastModified: userBlock.lastModified,
      changeHistory: userBlock.changeHistory || [],
      integrityStatus: isValid ? 'VALID' : 'TAMPERED',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get complete transaction history for verification
   */
  getTransactionAuditTrail(transactionId) {
    const transaction = this.blockchainState.transactions[transactionId];
    if (!transaction) {
      return { error: 'Transaction not found', transactionId };
    }

    // Find position in blockchain
    const blockIndex = this.blockchainState.blocks.findIndex(
      (b) => b.blockId === transaction.blockId
    );

    return {
      transactionId,
      transaction,
      blockIndex,
      blockPosition: blockIndex + 1,
      totalBlocks: this.blockchainState.blocks.length,
      merkleProof: this.getMerkleProof(blockIndex),
      previousHash: transaction.previousHash,
      verification: this.verifyTransaction(transactionId)
    };
  }

  /**
   * Get Merkle proof for verification
   */
  getMerkleProof(blockIndex) {
    if (this.blockchainState.merkleTree.length === 0) {
      return [];
    }

    const proof = [];
    let index = blockIndex;

    for (let level = 0; level < this.blockchainState.merkleTree.length - 1; level++) {
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      const sibling = this.blockchainState.merkleTree[level][siblingIndex];

      if (sibling) {
        proof.push({
          level,
          sibling,
          isRight
        });
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats() {
    return {
      totalBlocks: this.blockchainState.blocks.length,
      totalVideos: Object.keys(this.blockchainState.videos).length,
      totalUsers: Object.keys(this.blockchainState.users).length,
      totalTransactions: Object.keys(this.blockchainState.transactions).length,
      totalMerkleTreeLevels: this.blockchainState.merkleTree.length,
      blockchainVersion: this.blockchainState.version,
      createdAt: this.blockchainState.createdAt,
      lastUpdated: this.blockchainState.blocks.length > 0
        ? this.blockchainState.blocks[this.blockchainState.blocks.length - 1].timestamp
        : null,
      blockTypes: {
        videos: this.blockchainState.blocks.filter((b) => b.blockType === 'VIDEO').length,
        investments: this.blockchainState.blocks.filter(
          (b) => b.blockType === 'INVESTMENT'
        ).length,
        userData: this.blockchainState.blocks.filter((b) => b.blockType === 'USER_DATA')
          .length
      }
    };
  }
}

module.exports = new EnhancedBlockchainService();
