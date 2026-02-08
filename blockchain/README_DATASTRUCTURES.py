"""
Sociora Blockchain Data Structures Documentation

This module contains production-grade Python implementations of Sociora's core blockchain components:
- Transaction: Represents on-chain operations (VIDEO_UPLOAD, INVESTMENT, DISTRIBUTION, etc.)
- Block: Contains validated transactions and implements Proof of Transcoding/Storage
- BlockReward: Handles multi-beneficiary reward distribution (Creator, Miner, Viewer, Platform)
- Beneficiary: Represents reward recipients with their share percentages

ARCHITECTURE PRINCIPLES:

1. PRIVACY-FIRST DESIGN
   ├─ Public Layer: Transaction amounts, timestamps, hashes visible on-chain
   ├─ Private Layer: Sender/Receiver are HASHED public keys (no PII)
   └─ Video Metadata: IPFS CID hashes only, not actual files (stored off-chain)

2. VIDEO MINING CONSENSUS (Proof of Transcoding/Storage)
   ├─ Traditional PoW: Miners compete to guess hashes (CPU-intensive)
   └─ Sociora PoT: Miners validate video storage/transcoding (storage-driven)
      ├─ User uploads video → sharded & encrypted
      ├─ Miners store & verify transcoding
      ├─ Consensus reached → Block mined
      └─ Coins minted & split to beneficiaries

3. TOKENOMICS (Automatic Revenue Split)
   └─ Minted coins distributed via smart contract:
       ├─ Creator: ~40% (video owner)
       ├─ Miner: ~35% (storage validator)
       ├─ Viewer: ~15% (Proof of Attention)
       └─ Platform: ~10% (infrastructure & fees)

4. MULTI-BENEFICIARY REWARD DISTRIBUTION
   ├─ Each block generates reward = base_subsidy + transaction_fees
   ├─ Reward split across 4 beneficiary types
   ├─ Percentages are validated: must sum to 100%
   └─ Amounts computed with 8 decimal precision (dust reduction)

5. COMPLIANCE & SECURITY
   ├─ Transaction signatures: HMAC-SHA256 (production: use ed25519)
   ├─ Block integrity: SHA-256 hash includes all fields except hash itself
   ├─ Nonce-based replay attack prevention
   ├─ Gas pricing: Prevents network spam
   └─ KYC/AML hooks: Applied at gateway level, not protocol level

KEY CLASSES:

╔═════════════════════════════════════════════════════════════════════════════╗
║ TRANSACTION                                                                 ║
╠═════════════════════════════════════════════════════════════════════════════╣
║ Core on-chain operation representing value transfer or state change         ║
║                                                                              ║
║ Privacy Fields:                                                             ║
║   • sender_public_key_hash: SHA-256(public_key) - NO USERNAME/EMAIL        ║
║   • receiver_public_key_hash: SHA-256(public_key) - NO USERNAME/EMAIL      ║
║   • creator_id: Hashed creator identifier for ownership tracking            ║
║                                                                              ║
║ Video Metadata:                                                             ║
║   • video_hash: IPFS CIDv1 (e.g., Qm...)                                   ║
║   • video_length: Duration in seconds                                       ║
║   • video_size: File size in bytes (for storage fee calculation)            ║
║                                                                              ║
║ Financial:                                                                  ║
║   • amount: Coins involved (can be 0 for storage proofs)                    ║
║   • gas_price: Per-unit fee (prevents spam)                                 ║
║   • gas_limit: Maximum units this tx can consume                            ║
║                                                                              ║
║ Lifecycle:                                                                  ║
║   • status: PENDING → CONFIRMED → FINALIZED                                ║
║   • block_hash: None until included in block                                ║
║                                                                              ║
║ Methods:                                                                    ║
║   • compute_tx_hash(): Deterministic SHA-256 hash                           ║
║   • verify_signature(): HMAC signature validation                           ║
║   • to_dict() / from_dict(): Serialization for storage/transmission         ║
╚═════════════════════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════════════════════╗
║ BLOCK                                                                        ║
╠═════════════════════════════════════════════════════════════════════════════╣
║ Container for validated transactions implementing Proof of Transcoding       ║
║                                                                              ║
║ Consensus Data:                                                             ║
║   • miner_address: Hashed public key of mining validator                    ║
║   • previous_hash: Parent block hash (0x00... for genesis)                  ║
║   • video_proofs: List of storage proofs submitted by miner                 ║
║   • proof_of_work: Nonce or proof satisfying consensus                      ║
║                                                                              ║
║ Transaction Container:                                                      ║
║   • transactions: List of validated Transaction objects                     ║
║   • transaction_hashes: Merkle tree root for verification                   ║
║                                                                              ║
║ Reward Distribution:                                                        ║
║   • block_reward: BlockReward object with multi-beneficiary split           ║
║   • generate_reward(): Create reward distribution (core feature)            ║
║                                                                              ║
║ Methods:                                                                    ║
║   • compute_block_hash(): Deterministic block identifier                    ║
║   • add_transaction(): Append validated tx to block                         ║
║   • add_storage_proof(): Record miner's video validation                    ║
║   • to_dict() / from_dict(): Serialization                                  ║
╚═════════════════════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════════════════════╗
║ BLOCK REWARD                                                                 ║
╠═════════════════════════════════════════════════════════════════════════════╣
║ Handles multi-beneficiary reward distribution for Sociora tokenomics        ║
║                                                                              ║
║ Reward Sources:                                                             ║
║   • base_reward: Coins minted for block (consensus subsidy)                 ║
║   • fee_reward: Transaction fees collected in block                         ║
║   • total_reward: base_reward + fee_reward                                  ║
║                                                                              ║
║ Beneficiaries:                                                              ║
║   • Creator: ~40% - Video ownership reward                                  ║
║   • Miner: ~35% - Storage validation reward                                 ║
║   • Viewer: ~15% - Proof of Attention reward                                ║
║   • Platform: ~10% - Infrastructure & fee collection                        ║
║                                                                              ║
║ Distribution:                                                               ║
║   • Percentages must sum to 100% (validated)                                ║
║   • Amounts rounded to 8 decimal places                                     ║
║   • Each beneficiary has address (hashed public key) + amount                ║
║                                                                              ║
║ Methods:                                                                    ║
║   • calculate_distribution(): Compute amounts per address                   ║
║   • validate_distribution(): Verify total equals reward (tolerance)         ║
║   • to_dict(): Serializable representation                                  ║
╚═════════════════════════════════════════════════════════════════════════════╝

USAGE EXAMPLE:

    from transaction import Transaction, TransactionType
    from block import Block
    from utils import CryptoUtils
    
    # 1. Create transaction with video metadata
    tx = Transaction(
        tx_id="uuid-here",
        timestamp=CryptoUtils.timestamp_now(),
        tx_type=TransactionType.VIDEO_UPLOAD,
        sender_public_key_hash=CryptoUtils.hash_public_key("creator_key"),
        receiver_public_key_hash=CryptoUtils.hash_public_key("miner_key"),
        creator_id=CryptoUtils.hash_public_key("creator_key"),
        amount=0.0,
        video_hash="QmVidContent123456789...",
        video_length=600,
        video_size=500000000,
        nonce=1
    )
    
    # 2. Create block with transactions
    block = Block(
        block_number=1,
        timestamp=CryptoUtils.timestamp_now(),
        miner_address=CryptoUtils.hash_public_key("miner_key"),
        previous_hash="0000...",
        transactions=[tx]
    )
    
    # 3. Generate multi-beneficiary reward
    block.generate_reward(
        base_subsidy=50.0,
        creator_address=CryptoUtils.hash_public_key("creator_key"),
        creator_percentage=40.0,
        miner_percentage=35.0,
        viewer_percentage=15.0,
        platform_percentage=10.0,
        viewer_address=CryptoUtils.hash_public_key("viewer_key")
    )
    
    # 4. Inspect reward distribution
    for beneficiary in block.block_reward.beneficiaries:
        print(f"{beneficiary.role}: {beneficiary.amount} SOCIORA")

TRANSACTION TYPES:

    VIDEO_UPLOAD        - Creator uploads video (amount=0, contains video_hash)
    INVESTMENT          - Investor stakes coins in creator/video
    DISTRIBUTION        - Miner sends earned coins to creator/viewer
    STORAGE_PROOF       - Miner proves video storage/transcoding
    INTEREST_PAYOUT     - Investment interest paid to investor
    WITHDRAWAL          - User withdraws coins to external wallet
    PLATFORM_FEE        - Platform fee collection

TRANSACTION STATUSES:

    PENDING             - In mempool, not yet included
    CONFIRMED           - Included in block (1 confirmation)
    FINALIZED           - Irreversible (after N blocks, typically 12+)
    FAILED              - Transaction reverted or invalid

PRIVACY GUARANTEES:

    ✓ User identities are hashed (SHA-256)
    ✓ No PII stored on-chain
    ✓ Video files stored off-chain (IPFS), only hash on-chain
    ✓ KYC/AML compliance applied at gateway, not protocol
    ✓ Public layer (amounts, hashes) visible for auditability
    ✓ Private layer (sender/receiver actual keys) off-chain

SECURITY CONSIDERATIONS:

    1. Signature Verification:
       - All transactions should be signed by sender's private key
       - Use ed25519 in production (not HMAC-SHA256)
       
    2. Nonce Management:
       - Prevents replay attacks
       - Must increment per sender
       
    3. Gas Pricing:
       - Prevents network spam
       - Adjustable difficulty factor
       
    4. Block Linking:
       - Each block references previous hash
       - Creates immutable chain
       
    5. Reward Validation:
       - Beneficiary percentages always sum to 100%
       - Rounding errors managed with 8 decimals

FILE STRUCTURE:

    utils.py
    ├─ CryptoUtils
    │  ├─ hash_public_key(public_key) -> hashed_key
    │  ├─ hash_ipfs_cid(ipfs_cid) -> hash
    │  ├─ verify_signature(message, sig, key) -> bool
    │  ├─ generate_transaction_hash(tx_dict) -> hash
    │  ├─ generate_block_hash(block_dict) -> hash
    │  └─ timestamp_now() -> ISO_timestamp
    │
    └─ TokenomicsUtils
       ├─ calculate_reward_split(...) -> distribution_dict
       └─ validate_percentages(...) -> bool

    transaction.py
    ├─ TransactionType (enum)
    ├─ TransactionStatus (enum)
    └─ Transaction (dataclass)
       ├─ compute_tx_hash()
       ├─ verify_signature()
       ├─ to_dict()
       └─ from_dict()

    block.py
    ├─ ConsensusMechanism (enum)
    ├─ Beneficiary (dataclass)
    ├─ BlockReward (dataclass)
    │  ├─ calculate_distribution()
    │  ├─ validate_distribution()
    │  └─ to_dict()
    │
    └─ Block (dataclass)
       ├─ compute_block_hash()
       ├─ generate_reward()
       ├─ add_transaction()
       ├─ add_storage_proof()
       ├─ to_dict()
       └─ from_dict()

    examples.py
    ├─ example_1_simple_video_upload()
    ├─ example_2_investment_transaction()
    ├─ example_3_block_creation_and_reward_distribution()
    ├─ example_4_storage_proof()
    ├─ example_5_transaction_serialization()
    └─ run_all_examples()

NEXT STEPS:

    1. Implement Smart Contracts for Revenue Split Logic
    2. Create Mining Consensus Algorithm (Proof of Transcoding)
    3. Build IPFS Integration Layer
    4. Implement KYC/AML Gateway
    5. Create State Machine for Transaction Lifecycle
    6. Build Merkle Tree for Transaction Verification
    7. Implement Full Node Client
    8. Add Database Layer for Persistence

QUESTIONS?

Refer to examples.py for comprehensive usage demonstrations.
"""

print(__doc__)
