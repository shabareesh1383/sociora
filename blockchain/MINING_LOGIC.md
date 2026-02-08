"""
SOCIORA MINING - PROOF OF STORAGE/TRANSCODING

═══════════════════════════════════════════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════════════════════════

Sociora replaces traditional Proof of Work with Proof of Storage/Transcoding:

TRADITIONAL PoW:
├─ Miners: Compete to guess random hashes (CPU-intensive, wasteful)
├─ Work: Compute SHA-256(random_nonce) billions of times
├─ Validation: Anyone can verify answer by hashing once
├─ Benefit to network: NONE (pure computation waste)
└─ Energy: ~100 TWh/year (Bitcoin)

SOCIORA PROOF OF TRANSCODING:
├─ Miners: Store videos and validate transcoding (storage-intensive, useful)
├─ Work: Download, verify, and transcode video to multiple formats
├─ Validation: Anyone can verify transcoded files exist on network
├─ Benefit to network: MASSIVE (distributed storage + faster playback)
└─ Energy: Proportional to actual content storage/processing (useful work)

KEY INSIGHT:
┌────────────────────────────────────────────────────────────────────────────┐
│ In Bitcoin: Miners do wasteful work → earn coins → mine is profitable   │
│                                                                            │
│ In Sociora: Miners do useful work → earn coins → mining IS THE SERVICE  │
│             Miners = Content Delivery Network (CDN)                       │
└────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════════
MINING WORKFLOW
═══════════════════════════════════════════════════════════════════════════════════════════════════

Step 1: UPLOAD PHASE
───────────────────────────────────────────────────────────────────────────────────────────────

Creator uploads video:
  1. Calculate IPFS CIDv1 hash of video file
  2. Register video metadata in network registry
  3. Video is immediately available to miners (PENDING status)
  
Example:
  Creator: "Publishing 10-minute tutorial"
    → Video file (150 MB) → IPFS → CID = QmTutorialVideo123...
    → Register in network
    → Miners can now download and store


Step 2: DISTRIBUTION & REPLICATION PHASE
───────────────────────────────────────────────────────────────────────────────────────────────

Network ships video to multiple miners:
  1. Network decides replication factor (e.g., 3 copies)
  2. Video is distributed to 3 different storage nodes
  3. Each node stores full or partial copy
  4. Nodes maintain access to video (e.g., 30 days pinned)
  
Example:
  Network replicates tutorial across:
    ✓ Miner US West (region: us-west)
    ✓ Miner EU Central (region: eu-central)
    ✓ Miner AP Southeast (region: ap-southeast)
    
  Video status: REPLICATED


Step 3: TRANSCODING PHASE
───────────────────────────────────────────────────────────────────────────────────────────────

Miners independently transcode video:
  1. Each miner downloads video copy
  2. Encodes to multiple formats:
     • H.264 @ 480p (low bandwidth)
     • H.264 @ 720p (standard)
     • VP9 @ 1080p (high quality)
     • AV1 @ 4K (ultra high quality)
  3. Computes hash of each transcoded version
  4. Stores transcodes on network (broadcast to peers)
  
Example:
  Miner US West transcodes tutorial:
    → H.264 480p  (35 MB)
    → H.264 720p  (80 MB)
    → VP9 1080p   (120 MB)
    
  Miner computes SHA-256 hash of each transcode
  Stores locally + broadcasts completion to network
  
  Video status: TRANSCODING COMPLETE
  Transcoding profiles: 3 available


Step 4: VALIDATION PHASE (PROOF OF STORAGE)
───────────────────────────────────────────────────────────────────────────────────────────────

Miner proves storage and transcoding completion:
  1. Miner calls: validate_video_storage(video_cid)
  2. Validation checks:
     ✓ Video exists on network (at least 1 replica)
     ✓ Minimum replication factor met (e.g., 3 copies)
     ✓ Video has been transcoded to all formats
     ✓ Transcoding hashes match expected values
  3. If all checks pass → Validation SUCCESSFUL
  4. Miner cannot mine block without successful validation
  
Example:
  Miner US West validates QmTutorialVideo123:
    ✓ Found on network (3 replicas)
    ✓ Replication: 3/3 nodes online
    ✓ Transcoding: All 3 formats completed
    ✓ Duration: 0.234 seconds
    
  Validation Result: VALID ✓


Step 5: STORAGE PROOF GENERATION
───────────────────────────────────────────────────────────────────────────────────────────────

If validation passes, create cryptographic proof:
  1. Generate proof_nonce (random UUID)
  2. Compute proof_hash = SHA-256(video_cid + miner_address + nonce)
  3. Create StorageProof object with:
     • Miner's address
     • Video CID
     • Transcoding profiles list
     • Proof hash
     • Replication count
  4. This proof is the "work" that earns mining reward
  
Proof Structure:
  {
    "video_cid": "QmTutorialVideo123456789ABCDEFGH",
    "miner_address": "a7f2c8d9e1b3f4a6...",  (hashed)
    "proof_hash": "8x2Jb4Lk7e...",
    "storage_replication": 3,
    "transcoding_profiles": [
      "h264_480p",
      "h264_720p",
      "vp9_1080p"
    ]
  }


Step 6: DYNAMIC REWARD CALCULATION
───────────────────────────────────────────────────────────────────────────────────────────────

System calculates block reward based on video characteristics:
  
  total_reward = base_subsidy +
                 (video_length_seconds × reward_per_second) +
                 (num_transcoding_profiles × reward_per_profile) +
                 ((num_replicas - 1) × reward_per_replica)
  
  Rationale:
    • Longer videos = more valuable content = more storage cost = more reward
    • More transcoding profiles = more computation = higher difficulty
    • More replicas = better network availability = more security
  
Example 1: Short Tutorial (10 minutes)
  base_subsidy:       50.0 SOCIORA
  length_bonus:       600s × 0.1 = 60.0 SOCIORA
  profile_bonus:      3 × 5.0 = 15.0 SOCIORA
  replica_bonus:      (3-1) × 2.0 = 4.0 SOCIORA
  ─────────────────────────────────
  TOTAL:              129.0 SOCIORA
  
Example 2: Feature Film (90 minutes)
  base_subsidy:       50.0 SOCIORA
  length_bonus:       5400s × 0.1 = 540.0 SOCIORA
  profile_bonus:      3 × 5.0 = 15.0 SOCIORA
  replica_bonus:      (2-1) × 2.0 = 2.0 SOCIORA
  ─────────────────────────────────
  TOTAL:              607.0 SOCIORA

REWARD RATIO: Feature film gets 4.7× more reward (due to 9× longer duration)


Step 7: MULTI-BENEFICIARY REWARD DISTRIBUTION
───────────────────────────────────────────────────────────────────────────────────────────────

Block reward is automatically split:
  
  Creator:   40% (video ownership)
  Miner:     35% (storage/transcoding validation)
  Viewer:    15% (proof of attention)
  Platform:  10% (infrastructure)
  
Example: Short tutorial (129 SOCIORA total)
  Creator:   129 × 0.40 = 51.6 SOCIORA
  Miner:     129 × 0.35 = 45.15 SOCIORA
  Viewer:    129 × 0.15 = 19.35 SOCIORA
  Platform:  129 × 0.10 = 12.9 SOCIORA
  ─────────────────────────────────────
  TOTAL:     129.0 SOCIORA ✓ (sum = 100%)


Step 8: BLOCK CREATION & MINING
───────────────────────────────────────────────────────────────────────────────────────────────

Miner creates and publishes block:
  1. Create Block object with:
     • Block number (chain height)
     • Storage proof transaction
     • Pending transactions to include
     • VideoProof metadata
  2. Compute block hash = SHA-256(block_header)
  3. Broadcast block to network
  4. Other nodes validate and accept
  
Block Contents:
  {
    "block_number": 1,
    "block_hash": "aabbccdd...",
    "miner_address": "a7f2c8d9...",
    "previous_hash": "0000...",
    "transactions": [
      {
        "tx_type": "STORAGE_PROOF",
        "video_hash": "QmTutorialVideo123...",
        "storage_proof": "8x2Jb4Lk7e...",
        ...
      },
      ... other pending transactions
    ],
    "block_reward": {
      "base_reward": 50.0,
      "total_reward": 129.0,
      "distribution": {
        "creator|Qm...": 51.6,
        "miner|Qm...": 45.15,
        "viewer|Qm...": 19.35,
        "platform|000...": 12.9
      }
    }
  }


═══════════════════════════════════════════════════════════════════════════════════════════════════
API REFERENCE
═══════════════════════════════════════════════════════════════════════════════════════════════════

validate_video_storage(video_cid, validator_address, storage_network=None, min_replicas=1)
─────────────────────────────────────────────────────────────────────────────────────────

Core validation function for Proof of Storage consensus.

Args:
    video_cid: IPFS Content Identifier to validate
    validator_address: Hashed public key of validating miner
    storage_network: StorageNetwork instance (defaults to global)
    min_replicas: Minimum replication factor required

Returns:
    ValidationResult object with:
        • is_valid: Whether validation passed
        • replicas_found: Number of online replicas
        • transcoding_complete: Whether all formats transcoded
        • transcoding_formats: List of available formats
        • validation_duration_seconds: How long validation took
        • error_message: If validation failed

Raises:
    ValidationError: If critical checks fail

Example:
    from blockchain import validate_video_storage, CryptoUtils
    
    result = validate_video_storage(
        video_cid="QmVidContent123...",
        validator_address=CryptoUtils.hash_public_key("miner_key"),
        min_replicas=3
    )
    
    if result.is_valid:
        print(f"Video valid on {result.replicas_found} nodes")
        print(f"Available formats: {result.transcoding_formats}")


calculate_dynamic_reward(video_metadata, validation_result, config=None)
────────────────────────────────────────────────────────────────────────

Calculate block reward based on video characteristics.

Args:
    video_metadata: VideoMetadata object with video info
    validation_result: ValidationResult from storage validation
    config: DynamicRewardConfig (uses defaults if None)

Returns:
    Total reward amount in coins (float, clamped to min/max)

Example:
    from blockchain import calculate_dynamic_reward, DynamicRewardConfig
    
    config = DynamicRewardConfig(
        base_subsidy=50.0,
        reward_per_second=0.1,
        reward_per_profile=5.0,
        reward_per_replica=2.0
    )
    
    reward = calculate_dynamic_reward(video, validation, config)
    print(f"Miner earns {reward} SOCIORA for storing this video")


mine_block(block_number, miner_address, previous_block_hash, video_cid, creator_id, ...)
──────────────────────────────────────────────────────────────────────────────────────────

MAIN MINING FUNCTION - Orchestrates entire mining process.

Args:
    block_number: Height of new block
    miner_address: Hashed public key of miner
    previous_block_hash: Parent block hash
    video_cid: IPFS CID of video being mined
    creator_id: Hashed creator identifier
    pending_transactions: List of transactions to include
    storage_network: StorageNetwork instance
    reward_config: DynamicRewardConfig
    difficulty: PoW difficulty (leading zeros)

Returns:
    Tuple of (Block, StorageProof, ValidationResult)

Raises:
    ValidationError: If video validation fails
    MiningError: If block cannot be mined

Example:
    from blockchain import mine_block, DynamicRewardConfig, CryptoUtils
    
    block, proof, validation = mine_block(
        block_number=1,
        miner_address=CryptoUtils.hash_public_key("miner_key"),
        previous_block_hash="0000...",
        video_cid="QmVidContent123...",
        creator_id=CryptoUtils.hash_public_key("creator_key"),
        reward_config=DynamicRewardConfig()
    )
    
    print(f"Mined block {block.block_number}")
    print(f"Total reward: {block.block_reward.total_reward} SOCIORA")
    print(f"Beneficiaries:")
    for b in block.block_reward.beneficiaries:
        print(f"  {b.role}: {b.amount} SOCIORA")


═══════════════════════════════════════════════════════════════════════════════════════════════════
CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════════════════════════

DynamicRewardConfig dataclass controls reward calculations:

    @dataclass
    class DynamicRewardConfig:
        base_subsidy: float = 50.0              # Base coins per block
        reward_per_second: float = 0.1          # 0.1 coins/second of video
        reward_per_profile: float = 5.0         # 5 coins per transcode format
        reward_per_replica: float = 2.0         # 2 coins per replica (beyond 1st)
        
        creator_percentage: float = 40.0        # Creator's share
        miner_percentage: float = 35.0          # Miner's share
        viewer_percentage: float = 15.0         # Viewer's share
        platform_percentage: float = 10.0       # Platform's share
        
        max_reward_per_block: float = 1000.0    # Cap reward
        min_reward_per_block: float = 10.0      # Floor reward

Custom configuration example:

    config = DynamicRewardConfig(
        base_subsidy=100.0,          # Higher base reward
        reward_per_second=0.15,      # Reward longer videos more
        creator_percentage=45.0,     # Creators earn more
        miner_percentage=30.0,
        viewer_percentage=15.0,
        platform_percentage=10.0
    )
    
    block, proof, validation = mine_block(
        ...
        reward_config=config
    )


═══════════════════════════════════════════════════════════════════════════════════════════════════
KEY ADVANTAGES OVER TRADITIONAL PoW
═══════════════════════════════════════════════════════════════════════════════════════════════════

1. USEFUL WORK
   ├─ Bitcoin: Miners compute hashes → waste energy → 0 benefit to network
   └─ Sociora: Miners store videos → distribute content → massive benefit

2. SCALABLE DIFFICULTY
   ├─ Bitcoin: Network adjusts PoW difficulty
   └─ Sociora: Video characteristics naturally vary difficulty
      (longer/more complex = harder = more reward)

3. DEMOCRATIZED MINING
   ├─ Bitcoin: Requires ASICs ($10k+) + cheap electricity
   └─ Sociora: Any storage node can mine (no specialized hardware)

4. ENVIRONMENTALLY FRIENDLY
   ├─ Bitcoin: ~100 TWh/year electricity
   └─ Sociora: Energy use = actual content delivery (0 waste)

5. INTEGRATED INCENTIVES
   ├─ Bitcoin: Miners → hashing → mining pools
   └─ Sociora: Miners = CDN nodes automatically rewarded

6. STORAGE CAPACITY AS SECURITY
   ├─ Bitcoin: Hash rate as security metric
   └─ Sociora: Storage availability + redundancy = security


═══════════════════════════════════════════════════════════════════════════════════════════════════
ATTACK VECTORS & MITIGATIONS
═══════════════════════════════════════════════════════════════════════════════════════════════════

Attack: Fake Storage Claim
├─ Attacker: Claim to store video without actually storing it
├─ Mitigation: Random audits - check specific bytes of video
└─ Cost: Dishonest node loses reputation + slashed coins

Attack: Proof Reuse
├─ Attacker: Submit same storage proof for multiple videos
├─ Mitigation: Proof includes video_cid + miner_address (unique per video/miner)
└─ Cost: Cryptographic binding prevents reuse

Attack: Sybil Attack (Fake Miners)
├─ Attacker: Create 100 fake miner addresses
├─ Mitigation: Reputation system - new nodes earn slowly + stake requirement
└─ Cost: Attack requires capital + time (Phase 2 feature)

Attack: Withholding Transcoding
├─ Attacker: Store video but skip transcoding
├─ Mitigation: Validation checks transcoding completion
└─ Cost: Cannot earn reward without transcoding


═══════════════════════════════════════════════════════════════════════════════════════════════════
FUTURE ENHANCEMENTS (PHASE 2+)
═══════════════════════════════════════════════════════════════════════════════════════════════════

1. PROOF OF REPLICATION
   ├─ Miners prove they maintain N copies over time
   ├─ Continuous earning (not just block creation)
   └─ Prevents content loss

2. ZERO-KNOWLEDGE PROOFS
   ├─ Miners can prove storage without revealing content
   ├─ Privacy + verification
   └─ Better for sensitive content

3. REPUTATION SYSTEM
   ├─ Node reputation based on:
   │  ├─ Storage uptime
   │  ├─ Transcoding quality
   │  ├─ Geographic diversity
   │  └─ Speed
   ├─ Higher reputation = higher rewards
   └─ Incentivizes quality

4. DYNAMIC PERCENTAGES
   ├─ Creator tier system (verified → premium → professional)
   ├─ Viewer engagement metrics
   ├─ Seasonal adjustments
   └─ Smart contract governance

5. LAYER 2 SCALING
   ├─ State channels for frequent transactions
   ├─ Off-chain storage coordination
   ├─ Batched proof submission
   └─ 100x+ throughput improvement


═══════════════════════════════════════════════════════════════════════════════════════════════════
FILES & STRUCTURE
═══════════════════════════════════════════════════════════════════════════════════════════════════

blockchain/
├─ mining.py
│  ├─ validate_video_storage()          ← Core validation function
│  ├─ calculate_dynamic_reward()        ← Reward calculation
│  ├─ create_storage_proof()            ← Proof generation
│  ├─ mine_block()                      ← Main mining orchestration
│  ├─ DynamicRewardConfig               ← Configuration dataclass
│  ├─ ValidationResult                  ← Validation output
│  └─ ValidationError, MiningError      ← Custom exceptions
│
├─ storage_network.py
│  ├─ StorageNetwork                    ← Network simulation
│  ├─ VideoMetadata                     ← Video information
│  ├─ StorageProof                      ← Proof dataclass
│  ├─ TranscodingProfile                ← Transcode information
│  └─ StorageStatus, TranscodingStatus  ← Enums
│
├─ mining_examples.py
│  ├─ example_1_setup_storage_network()
│  ├─ example_2_upload_and_transcode_videos()
│  ├─ example_3_replicate_videos_on_network()
│  ├─ example_4_validate_video_storage()
│  ├─ example_5_dynamic_reward_calculation()
│  └─ example_6_mine_block_with_storage_proof()
│
└─ MINING_LOGIC.md ← This file


═══════════════════════════════════════════════════════════════════════════════════════════════════
RUNNING THE EXAMPLES
═══════════════════════════════════════════════════════════════════════════════════════════════════

Execute all mining examples:

    $ cd blockchain
    $ python mining_examples.py
    
    This will:
    1. Setup storage network with 3 miner nodes
    2. Upload 2 videos (short + feature film)
    3. Transcode to multiple formats
    4. Replicate across network
    5. Validate storage for each video
    6. Calculate dynamic rewards
    7. Mine complete blocks with reward distribution


═══════════════════════════════════════════════════════════════════════════════════════════════════
QUESTIONS?
═══════════════════════════════════════════════════════════════════════════════════════════════════

Q: Why not use IPFS/Filecoin directly?
A: They're great! We're using their concepts:
   • IPFS: Content-addressable storage + CID hashes
   • Filecoin: Storage proofs + miner incentives
   
   Sociora adds:
   • Video-specific: Transcoding detection
   • Integrated: Rewards built into consensus
   • Fast: Real-time proof validation

Q: How do we prevent miners from lying about transcoding?
A: Multi-layer verification:
   • On-chain: Proof hash verification
   • Network: Spot-check random transcodes
   • Client: Request specific format from multiple nodes
   • Economic: Slashing if caught lying

Q: What if a miner is offline?
A: System handles gracefully:
   • Offline node removed from available pool
   • Remaining copies still accessible
   • New miners can download + replicate
   • Eventually replication restored to target factor

Q: Can a creator farm mining by uploading fake content?
A: No, because:
   • Reward scales with video length
   • But storage/transcoding cost is real
   • 90-minute feature = real storage cost
   • Farmer cannot profit if encoding cost > reward
   • Reputation system (Phase 2) penalizes spam

═══════════════════════════════════════════════════════════════════════════════════════════════════
"""

print(__doc__)
