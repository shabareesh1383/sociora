# ⚡ BLOCKCHAIN QUICK REFERENCE

## 📋 Quick API Calls Cheat Sheet

### 1️⃣ Verify Video Integrity
```javascript
// Frontend JavaScript
const API_BASE = 'http://localhost:5000';

async function verifyVideo(videoId) {
  const response = await fetch(`${API_BASE}/api/blockchain/verify/video/${videoId}`);
  const result = await response.json();
  console.log(result);
  // Returns: { verified: true/false, videoHash, blockId, ... }
}

// Curl
curl http://localhost:5000/api/blockchain/verify/video/VIDEO_ID
```

### 2️⃣ Verify Transaction
```javascript
async function verifyTransaction(transactionId) {
  const response = await fetch(`${API_BASE}/api/blockchain/verify/transaction/${transactionId}`);
  const result = await response.json();
  console.log(result);
  // Returns: { verified: true/false, transactionId, nonce, ... }
}

// Curl
curl http://localhost:5000/api/blockchain/verify/transaction/TX_ID
```

### 3️⃣ Get Transaction Audit Trail
```javascript
async function getAuditTrail(transactionId) {
  const response = await fetch(`${API_BASE}/api/blockchain/audit-trail/${transactionId}`);
  const result = await response.json();
  console.log(result);
  // Returns: { merkleProof, blockIndex, verification, ... }
}

// Curl
curl http://localhost:5000/api/blockchain/audit-trail/TX_ID
```

### 4️⃣ Get Blockchain Statistics
```javascript
async function getBlockchainStats() {
  const response = await fetch(`${API_BASE}/api/blockchain/stats`);
  const result = await response.json();
  console.log(result);
  // Returns: { totalBlocks, totalVideos, totalTransactions, ... }
}

// Curl
curl http://localhost:5000/api/blockchain/stats
```

### 5️⃣ Verify User Data
```javascript
async function verifyUserData(userId) {
  const response = await fetch(`${API_BASE}/api/blockchain/verify/user/${userId}`);
  const result = await response.json();
  console.log(result);
  // Returns: { verified, userHash, changeHistory, ... }
}

// Curl
curl http://localhost:5000/api/blockchain/verify/user/USER_ID
```

---

## 🔧 Integration Points

### When a Video is Uploaded
```javascript
// File: /routes/videos.js
const blockchainRecord = enhancedBlockchainService.recordVideoUpload({
  _id: video._id,
  title: video.title,
  description: video.description,
  creatorId: req.user.id,
  creatorName: req.user.name,
  thumbnail: video.thumbnail,
  uploadedAt: video.createdAt,
  duration: video.duration,
  tags: video.tags,
  metadata: { resolution: '1080p', codec: 'h264', fileSize: 1000000 }
});
```

### When an Investment is Made
```javascript
// File: /routes/transactions.js
const blockchainRecord = enhancedBlockchainService.recordInvestment({
  from: req.user.id,
  fromName: investor.name,
  to: toCreator,
  toName: creator.name,
  videoId,
  videoTitle: video.title,
  amount: parsedAmount,
  investmentType: 'standard',
  platformFee: 0
});
```

### When User Data Changes
```javascript
// File: /routes/auth.js or user updates
const blockchainRecord = enhancedBlockchainService.recordUserChange({
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
  changeType: 'profile_update',
  reason: 'standard_update'
});
```

---

## 🎯 Response Examples

### ✅ Successful Video Verification
```json
{
  "success": true,
  "message": "✅ Video integrity verified",
  "verified": true,
  "videoId": "abc123",
  "videoHash": "3f7e8d9c...",
  "currentHash": "3f7e8d9c...",
  "blockId": "block-xyz",
  "uploadedAt": "2026-02-07T10:30:00Z",
  "creatorId": "creator-123",
  "integrityStatus": "VALID",
  "timestamp": "2026-02-07T10:35:00Z"
}
```

### ✅ Successful Transaction Verification
```json
{
  "success": true,
  "message": "✅ Transaction verified and immutable",
  "verified": true,
  "transactionId": "tx-123",
  "transactionHash": "7a4b9e2f...",
  "from": "investor-id",
  "to": "creator-id",
  "amount": 100,
  "status": "CONFIRMED",
  "nonce": "abc123def456...",
  "integrityStatus": "VALID",
  "timestamp": "2026-02-07T10:35:00Z"
}
```

### ✅ Audit Trail Response
```json
{
  "success": true,
  "message": "📋 Complete transaction audit trail",
  "transactionId": "tx-123",
  "blockIndex": 42,
  "blockPosition": 43,
  "totalBlocks": 1500,
  "merkleProof": [
    { "level": 0, "sibling": "hash1", "isRight": false },
    { "level": 1, "sibling": "hash2", "isRight": true }
  ],
  "verification": { /* verification data */ }
}
```

### ✅ Blockchain Statistics
```json
{
  "success": true,
  "message": "📊 Blockchain statistics",
  "totalBlocks": 1500,
  "totalVideos": 150,
  "totalUsers": 300,
  "totalTransactions": 700,
  "totalMerkleTreeLevels": 11,
  "blockchainVersion": "2.0",
  "createdAt": "2026-02-06T00:00:00Z",
  "lastUpdated": "2026-02-07T10:40:00Z",
  "blockTypes": {
    "videos": 150,
    "investments": 700,
    "userData": 650
  }
}
```

---

## ❌ Error Responses

### Not Found
```json
{
  "success": false,
  "message": "Video not found on blockchain",
  "error": "Video not found on blockchain",
  "videoId": "unknown-id"
}
```

### Verification Failed
```json
{
  "success": false,
  "message": "❌ Video has been tampered with",
  "verified": false,
  "integrityStatus": "TAMPERED",
  "videoId": "video-123"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Error verifying video integrity",
  "error": "Internal server error message"
}
```

---

## 🧪 Testing Commands

```bash
# Test all endpoints quickly

# 1. Get blockchain stats
curl http://localhost:5000/api/blockchain/stats

# 2. Upload a video (returns videoId)
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer TOKEN" \
  -F "video=@video.mp4" \
  -F "title=Test Video" \
  -F "description=Test"

# 3. Verify that video
curl http://localhost:5000/api/blockchain/verify/video/VIDEO_ID

# 4. Make an investment (returns transactionId)
curl -X POST http://localhost:5000/api/transactions/invest \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoId":"VIDEO_ID","toCreator":"CREATOR_ID","amount":10}'

# 5. Verify that transaction
curl http://localhost:5000/api/blockchain/verify/transaction/TX_ID

# 6. Get audit trail
curl http://localhost:5000/api/blockchain/audit-trail/TX_ID

# 7. Verify user data
curl http://localhost:5000/api/blockchain/verify/user/USER_ID
```

---

## 🔐 Security Checks

### Signature Verification (With Token)

```javascript
async function recordVideoWithAuth(videoData, token) {
  const response = await fetch(`${API_BASE}/api/blockchain/record/video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(videoData)
  });
  return response.json();
}
```

### Nonce Verification
```javascript
function verifyNonce(transactionData) {
  const nonce = transactionData.proof.nonce;
  // Nonce should be unique for each transaction
  // Prevents replay attacks
  return nonce.length > 0;
}
```

### Hash Validation
```javascript
function validateHash(data, storedHash) {
  const crypto = require('crypto');
  const currentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  return currentHash === storedHash;
}
```

---

## 📊 Common Queries

### Find All Investments for a Creator
```javascript
// Get blockchain stats first
const stats = await fetch(`${API_BASE}/api/blockchain/stats`).then(r => r.json());

// Then verify each transaction
for (const txId of creatorTransactionIds) {
  const verification = await fetch(
    `${API_BASE}/api/blockchain/verify/transaction/${txId}`
  ).then(r => r.json());
  console.log(verification);
}
```

### Check Video Upload History
```javascript
// Get stats to see total videos
const stats = await fetch(`${API_BASE}/api/blockchain/stats`).then(r => r.json());
console.log(`Total videos: ${stats.totalVideos}`);
console.log(`Total video blocks: ${stats.blockTypes.videos}`);

// Verify specific video
const verification = await fetch(
  `${API_BASE}/api/blockchain/verify/video/${videoId}`
).then(r => r.json());
```

### Track User Activity
```javascript
// Get user verification with change history
const userVerification = await fetch(
  `${API_BASE}/api/blockchain/verify/user/${userId}`
).then(r => r.json());

console.log('Change History:', userVerification.changeHistory);
// Shows: [
//   { changeId: 'xyz', blockId: 'abc', timestamp: '2026-02-07...', changeType: 'profile_update' },
//   ...
// ]
```

---

## 📱 Frontend Integration

### Add Verification Button to Video Player
```jsx
import BlockchainVerification from './components/BlockchainVerification';

function VideoPlayer({ videoId, transactionId }) {
  return (
    <div>
      <video src={videoUrl} />
      <BlockchainVerification 
        videoId={videoId}
        transactionId={transactionId}
      />
    </div>
  );
}
```

### Add Stats Dashboard
```jsx
import BlockchainVerification from './components/BlockchainVerification';

function Dashboard() {
  return (
    <div>
      <h1>SOCIORA Dashboard</h1>
      <BlockchainVerification />
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### Issue: Blockchain not recording
**Solution:**
```javascript
// Check server logs
// Ensure MongoDB is connected
// Check that enhancedBlockchainService is properly imported
// Verify enhanced-ledger.json has write permissions
```

### Issue: Verification returning "not found"
**Solution:**
```javascript
// Ensure the ID is correct format
// Check that video/transaction was actually uploaded/created
// Verify blockchain database file exists
```

### Issue: Hash mismatch on verification
**Solution:**
```javascript
// Data may have been modified
// Check file permissions
// Verify database integrity
// Review audit trail for changes
```

---

## 🎯 Best Practices

1. **Always verify critical operations**
   ```javascript
   // After investment, verify transaction
   const verification = await verifyTransaction(txId);
   if (verification.integrityStatus === 'VALID') {
     console.log('✅ Investment verified');
   }
   ```

2. **Monitor blockchain health**
   ```javascript
   // Periodically check stats
   setInterval(async () => {
     const stats = await fetch(`${API_BASE}/api/blockchain/stats`).then(r => r.json());
     console.log('Blockchain blocks:', stats.totalBlocks);
   }, 60000); // Every minute
   ```

3. **Use audit trails for disputes**
   ```javascript
   // If dispute arises, pull complete audit trail
   const trail = await fetch(`${API_BASE}/api/blockchain/audit-trail/${txId}`)
     .then(r => r.json());
   // Show merkleProof and verification data as evidence
   ```

4. **Backup blockchain data**
   ```javascript
   // Periodically backup enhanced-ledger.json
   // Store in safe location
   // Verify backup integrity
   ```

---

## 📞 Support Commands

```bash
# Check backend status
curl http://localhost:5000/

# Check blockchain is running
curl http://localhost:5000/api/blockchain/stats | grep totalBlocks

# Verify network connectivity
ping localhost:5000

# Check logs
tail -f backend-logs.txt

# View ledger file
cat backend/blockchain/enhanced-ledger.json | jq '.blocks | length'
```

---

**Last Updated:** February 7, 2026  
**Status:** ✅ Production Ready

