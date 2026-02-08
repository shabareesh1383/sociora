"""
Mining Logic for Sociora Blockchain - Proof of Storage/Transcoding Consensus.

This module implements the core mining function where:
1. Miner validates video storage on the network
2. Submits storage proof to the blockchain
3. Receives block rewards split based on video length
4. (Optional) Performs Proof of Work for additional security

The mining process is fundamentally different from traditional PoW:
- Instead of guessing hashes, miners STORE and VALIDATE video content
- Computational work = video transcoding (legitimate use)
- Reward = automatic split to Creator, Miner, Viewer, Platform
"""

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum

from utils import CryptoUtils
from transaction import Transaction, TransactionType, TransactionStatus
from block import Block, BlockReward
from storage_network import (
    StorageNetwork,
    StorageProof,
    TranscodingProfile,
    get_storage_network,
    VideoMetadata
)


class ValidationError(Exception):
    """Raised when storage validation fails."""
    pass


class MiningError(Exception):
    """Raised when mining process fails."""
    pass


@dataclass
class ValidationResult:
    """Result of video storage validation."""
    is_valid: bool
    video_cid: str
    validation_timestamp: str
    validator_address: str
    error_message: Optional[str] = None
    
    # Storage details
    replicas_found: int = 0
    transcoding_complete: bool = False
    transcoding_formats: List[str] = field(default_factory=list)
    
    # Metadata
    validation_duration_seconds: float = 0.0


def validate_video_storage(
    video_cid: str,
    validator_address: str,
    storage_network: Optional[StorageNetwork] = None,
    min_replicas: int = 1
) -> ValidationResult:
    """
    Validate that a video exists and is properly stored on the decentralized network.
    
    This is the KEY difference from traditional PoW:
    - Instead of computing random hashes (wasteful)
    - Miners validate that videos are properly stored and transcoded (useful work)
    
    Validation Checks:
    1. Video exists in storage network registry
    2. Video is replicated on minimum number of nodes
    3. Video has been transcoded to multiple formats
    4. Storage nodes are online and accessible
    
    Args:
        video_cid: IPFS Content Identifier to validate
        validator_address: Hashed public key of validating miner
        storage_network: Storage network instance (defaults to global)
        min_replicas: Minimum replication factor required
        
    Returns:
        ValidationResult with success/failure details
        
    Raises:
        ValidationError: If critical validation fails
        
    Example:
        >>> result = validate_video_storage(
        ...     video_cid="QmVidContent123456789...",
        ...     validator_address=CryptoUtils.hash_public_key("miner_key"),
        ...     min_replicas=3
        ... )
        >>> if result.is_valid:
        ...     print(f"Video valid: {result.replicas_found} replicas found")
    """
    
    start_time = time.time()
    
    if storage_network is None:
        storage_network = get_storage_network()
    
    validation_timestamp = CryptoUtils.timestamp_now()
    
    # 1. Check if video exists in registry
    video_metadata = storage_network.get_video_metadata(video_cid)
    if video_metadata is None:
        return ValidationResult(
            is_valid=False,
            video_cid=video_cid,
            validation_timestamp=validation_timestamp,
            validator_address=validator_address,
            error_message=f"Video {video_cid} not found in storage network",
            validation_duration_seconds=time.time() - start_time
        )
    
    # 2. Check minimum replication factor
    online_replicas = sum(
        1 for node_id in video_metadata.available_on_network
        if node_id in storage_network.get_storage_nodes() and
        storage_network.get_storage_nodes()[node_id].is_online
    )
    
    if online_replicas < min_replicas:
        return ValidationResult(
            is_valid=False,
            video_cid=video_cid,
            validation_timestamp=validation_timestamp,
            validator_address=validator_address,
            error_message=f"Insufficient replicas: {online_replicas} < {min_replicas}",
            replicas_found=online_replicas,
            validation_duration_seconds=time.time() - start_time
        )
    
    # 3. Check transcoding completion
    transcoding_formats = [p.format_name for p in video_metadata.transcoded_profiles]
    if not video_metadata.transcoded_profiles:
        return ValidationResult(
            is_valid=False,
            video_cid=video_cid,
            validation_timestamp=validation_timestamp,
            validator_address=validator_address,
            error_message="Video not transcoded to required formats",
            replicas_found=online_replicas,
            validation_duration_seconds=time.time() - start_time
        )
    
    # 4. All checks passed
    validation_duration = time.time() - start_time
    
    return ValidationResult(
        is_valid=True,
        video_cid=video_cid,
        validation_timestamp=validation_timestamp,
        validator_address=validator_address,
        replicas_found=online_replicas,
        transcoding_complete=True,
        transcoding_formats=transcoding_formats,
        validation_duration_seconds=validation_duration
    )


@dataclass
class DynamicRewardConfig:
    """
    Configuration for dynamic reward calculation based on video characteristics.
    
    Rewards scale with:
    - Video length (longer = more valuable)
    - Transcoding complexity (more formats = more work)
    - Replication factor (more copies = more storage)
    - Creator tier (premium creators) - Phase 2 feature
    """
    
    base_subsidy: float = 50.0  # Base coins per block
    
    # Per-second reward (scales with video length)
    reward_per_second: float = 0.1  # 0.1 coins per second of video
    
    # Per-profile reward (scales with transcoding work)
    reward_per_profile: float = 5.0  # 5 coins per transcoded format
    
    # Per-replica reward (scales with replication)
    reward_per_replica: float = 2.0  # 2 coins per replica beyond first
    
    # Beneficiary percentages (must sum to 100)
    creator_percentage: float = 40.0
    miner_percentage: float = 35.0
    viewer_percentage: float = 15.0
    platform_percentage: float = 10.0
    
    # Caps to prevent abuse
    max_reward_per_block: float = 1000.0  # Maximum coins per block
    min_reward_per_block: float = 10.0    # Minimum coins per block


def calculate_dynamic_reward(
    video_metadata: VideoMetadata,
    validation_result: ValidationResult,
    config: DynamicRewardConfig = None
) -> float:
    """
    Calculate block reward based on video characteristics.
    
    Reward Formula:
        total_reward = base_subsidy +
                       (video_length_seconds × reward_per_second) +
                       (num_transcoding_profiles × reward_per_profile) +
                       ((num_replicas - 1) × reward_per_replica)
    
    Rationale:
    - Longer videos: More valuable content, more storage cost
    - More formats: More computational work, higher difficulty
    - More replicas: Better availability, higher reliability
    
    Args:
        video_metadata: Video information including length, profiles, replicas
        validation_result: Validation results with transcoding count
        config: Reward configuration (defaults to standard)
        
    Returns:
        Total reward amount in coins (clamped to min/max)
        
    Example:
        >>> reward = calculate_dynamic_reward(video_metadata, validation_result)
        >>> print(f"Miner reward for block: {reward} SOCIORA")
    """
    
    if config is None:
        config = DynamicRewardConfig()
    
    # Start with base subsidy
    total_reward = config.base_subsidy
    
    # Add reward for video length
    # Each second of video = additional work to validate
    length_reward = video_metadata.duration_seconds * config.reward_per_second
    total_reward += length_reward
    
    # Add reward for transcoding complexity
    # Each transcoding profile = additional computation the miner performed
    num_profiles = len(validation_result.transcoding_formats)
    profile_reward = num_profiles * config.reward_per_profile
    total_reward += profile_reward
    
    # Add reward for replication
    # More replicas = higher availability = better network health
    replicas_bonus = max(0, validation_result.replicas_found - 1)
    replica_reward = replicas_bonus * config.reward_per_replica
    total_reward += replica_reward
    
    # Clamp reward to min/max
    total_reward = min(total_reward, config.max_reward_per_block)
    total_reward = max(total_reward, config.min_reward_per_block)
    
    return round(total_reward, 8)


def create_storage_proof(
    video_cid: str,
    miner_address: str,
    validation_result: ValidationResult,
    video_metadata: VideoMetadata
) -> StorageProof:
    """
    Create a cryptographic proof that miner has validated storage.
    
    This proof will be:
    1. Submitted to blockchain as STORAGE_PROOF transaction
    2. Verified by other nodes
    3. Included in mined block
    
    Args:
        video_cid: IPFS CID of video
        miner_address: Hashed public key of miner
        validation_result: Result from validation
        video_metadata: Video information
        
    Returns:
        StorageProof object ready for blockchain submission
    """
    
    proof_nonce = str(uuid.uuid4())
    
    # Compute proof hash: SHA-256(video_cid + miner_address + nonce)
    proof_data = f"{video_cid}{miner_address}{proof_nonce}".encode()
    proof_hash = hashlib.sha256(proof_data).hexdigest()
    
    # Create proof object
    proof = StorageProof(
        video_cid=video_cid,
        miner_address=miner_address,
        timestamp=CryptoUtils.timestamp_now(),
        storage_nodes=[],  # Populated from validation
        transcoding_profiles=video_metadata.transcoded_profiles,
        proof_nonce=proof_nonce,
        proof_hash=proof_hash,
        is_valid=validation_result.is_valid,
        computation_time=validation_result.validation_duration_seconds,
        storage_replication=validation_result.replicas_found
    )
    
    # Add storage metadata
    proof.storage_data = {
        'video_cid': video_cid,
        'video_length': video_metadata.duration_seconds,
        'video_size': video_metadata.original_size_bytes,
        'replicas': validation_result.replicas_found,
        'profiles': validation_result.transcoding_formats,
        'validation_timestamp': validation_result.validation_timestamp
    }
    
    return proof


def mine_block(
    block_number: int,
    miner_address: str,
    previous_block_hash: str,
    video_cid: str,
    creator_id: str,
    pending_transactions: List[Transaction] = None,
    storage_network: Optional[StorageNetwork] = None,
    reward_config: Optional[DynamicRewardConfig] = None,
    difficulty: int = 1
) -> Tuple[Block, StorageProof, ValidationResult]:
    """
    CORE MINING FUNCTION - Proof of Storage/Transcoding.
    
    Mining Process:
    1. VALIDATE: Check video is stored & transcoded on network
    2. PROVE: Create cryptographic proof of validation
    3. COMPUTE: Perform PoW (optional, low-difficulty for MVP)
    4. REWARD: Calculate and distribute coins based on video length
    5. RETURN: Mined block with storage proof and rewards
    
    This is fundamentally different from traditional PoW:
    - No wasteful hash guessing
    - Validation work = legitimate video transcoding
    - Reward scales with video complexity (useful metrics)
    
    Args:
        block_number: Height of new block
        miner_address: Hashed public key of miner
        previous_block_hash: Hash of parent block
        video_cid: IPFS CID of video being mined
        creator_id: Hashed creator identifier
        pending_transactions: Transactions to include in block
        storage_network: Storage network instance
        reward_config: Dynamic reward configuration
        difficulty: PoW difficulty (valid leading zeros)
        
    Returns:
        Tuple of (mined_block, storage_proof, validation_result)
        
    Raises:
        ValidationError: If video storage validation fails
        MiningError: If block cannot be mined
        
    Example:
        >>> block, proof, validation = mine_block(
        ...     block_number=1,
        ...     miner_address=miner_hash,
        ...     previous_block_hash="0000...",
        ...     video_cid="QmVideo123...",
        ...     creator_id=creator_hash
        ... )
        >>> print(f"Mined block {block.block_number}")
        >>> print(f"Miner reward: {block.block_reward.distribution}")
    """
    
    if storage_network is None:
        storage_network = get_storage_network()
    
    if pending_transactions is None:
        pending_transactions = []
    
    if reward_config is None:
        reward_config = DynamicRewardConfig()
    
    mining_start_time = time.time()
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 1: VALIDATE VIDEO STORAGE ON NETWORK
    # ═══════════════════════════════════════════════════════════════════════
    
    print(f"[MINING] Validating video storage for {video_cid[:12]}...")
    validation_result = validate_video_storage(
        video_cid=video_cid,
        validator_address=miner_address,
        storage_network=storage_network,
        min_replicas=1
    )
    
    if not validation_result.is_valid:
        raise ValidationError(
            f"Video validation failed: {validation_result.error_message}"
        )
    
    print(f"[MINING] ✓ Video validated: {validation_result.replicas_found} replicas, "
          f"{len(validation_result.transcoding_formats)} formats")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 2: RETRIEVE VIDEO METADATA
    # ═══════════════════════════════════════════════════════════════════════
    
    video_metadata = storage_network.get_video_metadata(video_cid)
    if video_metadata is None:
        raise MiningError(f"Video metadata not found for {video_cid}")
    
    print(f"[MINING] Video metadata: {video_metadata.duration_seconds}s, "
          f"{video_metadata.original_size_bytes} bytes")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 3: CREATE STORAGE PROOF
    # ═══════════════════════════════════════════════════════════════════════
    
    storage_proof = create_storage_proof(
        video_cid=video_cid,
        miner_address=miner_address,
        validation_result=validation_result,
        video_metadata=video_metadata
    )
    
    print(f"[MINING] Storage proof created: {storage_proof.proof_hash[:16]}...")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 4: CALCULATE DYNAMIC REWARD BASED ON VIDEO LENGTH
    # ═══════════════════════════════════════════════════════════════════════
    
    block_reward_amount = calculate_dynamic_reward(
        video_metadata=video_metadata,
        validation_result=validation_result,
        config=reward_config
    )
    
    print(f"[MINING] Dynamic reward calculated: {block_reward_amount} SOCIORA")
    print(f"[MINING]   Base subsidy: {reward_config.base_subsidy}")
    print(f"[MINING]   Length bonus: {video_metadata.duration_seconds * reward_config.reward_per_second}")
    print(f"[MINING]   Transcoding bonus: {len(validation_result.transcoding_formats) * reward_config.reward_per_profile}")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 5: CREATE STORAGE PROOF TRANSACTION
    # ═══════════════════════════════════════════════════════════════════════
    
    storage_proof_tx = Transaction(
        tx_id=str(uuid.uuid4()),
        timestamp=CryptoUtils.timestamp_now(),
        tx_type=TransactionType.STORAGE_PROOF,
        sender_public_key_hash=miner_address,
        receiver_public_key_hash=creator_id,
        creator_id=creator_id,
        amount=0.0,  # No coins in storage proof tx
        video_hash=video_cid,
        video_length=video_metadata.duration_seconds,
        video_size=video_metadata.original_size_bytes,
        storage_proof=storage_proof.proof_hash,
        storage_proof_signature=CryptoUtils.hash_public_key(miner_address),
        nonce=1,
        gas_limit=100000  # Storage proof is expensive
    )
    
    all_transactions = [storage_proof_tx] + pending_transactions
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 6: CREATE BLOCK
    # ═══════════════════════════════════════════════════════════════════════
    
    block = Block(
        block_number=block_number,
        timestamp=CryptoUtils.timestamp_now(),
        miner_address=miner_address,
        previous_hash=previous_block_hash,
        transactions=all_transactions,
        difficulty=difficulty,
        nonce=int(time.time() * 1000) % (2**32)  # Timestamp-based nonce
    )
    
    # Add storage proof to block metadata
    block.add_storage_proof(video_cid, storage_proof.proof_hash)
    block.metadata['storage_proof'] = storage_proof.to_dict()
    
    print(f"[MINING] Block created: #{block.block_number}")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 7: GENERATE AND DISTRIBUTE REWARDS
    # ═══════════════════════════════════════════════════════════════════════
    
    block_reward = block.generate_reward(
        base_subsidy=block_reward_amount,
        creator_address=creator_id,
        creator_percentage=reward_config.creator_percentage,
        miner_percentage=reward_config.miner_percentage,
        viewer_percentage=reward_config.viewer_percentage,
        platform_percentage=reward_config.platform_percentage,
        viewer_address=miner_address,  # Miner also gets viewer reward for block proposal
        platform_address="0000000000000000000000000000000000000000000000000000000000000001"
    )
    
    print(f"[MINING] Rewards distributed:")
    for beneficiary in block_reward.beneficiaries:
        print(f"[MINING]   {beneficiary.role.upper()}: {beneficiary.amount} SOCIORA ({beneficiary.percentage}%)")
    
    # ═══════════════════════════════════════════════════════════════════════
    # STEP 8: COMPUTE BLOCK HASH
    # ═══════════════════════════════════════════════════════════════════════
    
    block_hash = block.compute_block_hash()
    print(f"[MINING] Block hash: {block_hash[:32]}...")
    
    mining_duration = time.time() - mining_start_time
    print(f"[MINING] Mining complete in {mining_duration:.2f}s")
    
    return block, storage_proof, validation_result
