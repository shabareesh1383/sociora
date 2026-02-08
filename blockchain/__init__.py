"""
Sociora Blockchain Package

Production-grade Python implementation of the Sociora protocol:
- Video Mining Consensus (Proof of Transcoding/Storage)
- Multi-beneficiary Reward Distribution
- Privacy-first Design (Public Layer + Private Layer)
- Indian VDA & Global Compliance Ready

Core Components:
- Transaction: On-chain operations with video metadata
- Block: Container for transactions implementing PoT consensus
- BlockReward: Smart reward distribution across Creator, Miner, Viewer, Platform
- CryptoUtils: Hashing, signing, and cryptographic operations
- TokenomicsUtils: Revenue split calculations and validation
- Mining: Proof of Storage/Transcoding consensus implementation
- StorageNetwork: Decentralized storage network simulation
"""

from .utils import CryptoUtils, TokenomicsUtils
from .transaction import Transaction, TransactionType, TransactionStatus
from .block import Block, BlockReward, Beneficiary, ConsensusMechanism
from .mining import (
    validate_video_storage,
    calculate_dynamic_reward,
    create_storage_proof,
    mine_block,
    DynamicRewardConfig,
    ValidationError,
    MiningError,
    ValidationResult
)
from .storage_network import (
    StorageNetwork,
    StorageProof,
    TranscodingProfile,
    VideoMetadata,
    StorageNode,
    StorageStatus,
    TranscodingStatus,
    ReplicationFactor,
    get_storage_network,
    reset_storage_network
)

__version__ = "1.0.0"
__author__ = "Sociora Blockchain Team"

__all__ = [
    # Utilities
    'CryptoUtils',
    'TokenomicsUtils',
    
    # Transactions
    'Transaction',
    'TransactionType',
    'TransactionStatus',
    
    # Blocks
    'Block',
    'BlockReward',
    'Beneficiary',
    'ConsensusMechanism',
    
    # Mining (Proof of Storage/Transcoding)
    'validate_video_storage',
    'calculate_dynamic_reward',
    'create_storage_proof',
    'mine_block',
    'DynamicRewardConfig',
    'ValidationError',
    'MiningError',
    'ValidationResult',
    
    # Storage Network
    'StorageNetwork',
    'StorageProof',
    'TranscodingProfile',
    'VideoMetadata',
    'StorageNode',
    'StorageStatus',
    'TranscodingStatus',
    'ReplicationFactor',
    'get_storage_network',
    'reset_storage_network',
]
