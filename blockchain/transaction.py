"""
Transaction class for Sociora protocol.
Handles video asset transfers, investments, and storage proofs with privacy-first design.
"""

from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict, Any
from enum import Enum
from utils import CryptoUtils


class TransactionType(Enum):
    """Enumeration of valid Sociora transaction types."""
    VIDEO_UPLOAD = "VIDEO_UPLOAD"  # Creator uploads video
    INVESTMENT = "INVESTMENT"  # Investor stakes in video
    DISTRIBUTION = "DISTRIBUTION"  # Reward distribution to beneficiaries
    STORAGE_PROOF = "STORAGE_PROOF"  # Miner proves storage/transcoding
    INTEREST_PAYOUT = "INTEREST_PAYOUT"  # Interest paid to investor
    WITHDRAWAL = "WITHDRAWAL"  # User withdraws funds from wallet
    PLATFORM_FEE = "PLATFORM_FEE"  # Platform collects fees


class TransactionStatus(Enum):
    """Enumeration of transaction lifecycle states."""
    PENDING = "PENDING"  # In mempool, not yet confirmed
    CONFIRMED = "CONFIRMED"  # Included in a block
    FINALIZED = "FINALIZED"  # Irreversible (after N blocks)
    FAILED = "FAILED"  # Transaction reverted or invalid


@dataclass
class Transaction:
    """
    Production-grade transaction for Sociora blockchain.
    
    Private Layer:
    - Sender and receiver are hashed public keys (no PII).
    - Video metadata is only hashes pointing to IPFS.
    
    Public Layer:
    - Amount, timestamp, and transaction type are visible on-chain.
    - Video hash and transaction hash are publicly verifiable.
    
    Attributes:
        tx_id: Unique transaction identifier (UUID or hash-based)
        timestamp: ISO 8601 timestamp of transaction
        tx_type: Type of transaction (enum)
        
        sender_public_key_hash: Hashed public key of sender (SHA-256)
        receiver_public_key_hash: Hashed public key of receiver (SHA-256)
        
        creator_id: Hashed creator identifier (for video ownership tracking)
        
        amount: Token amount involved in transaction (can be 0 for storage proofs)
        currency: Token symbol (default: "SOCIORA")
        
        video_hash: IPFS CIDv1 content hash (not the video file itself)
        video_length: Duration of video in seconds
        video_size: Size of video in bytes (for storage fee calculation)
        
        storage_proof: Miner's proof of transcoding/storage (optional)
        storage_proof_signature: Cryptographic signature of proof
        
        nonce: Unique per-sender number to prevent replay attacks
        gas_price: Fee per operation unit
        gas_limit: Maximum gas this transaction can consume
        
        status: Current lifecycle state
        block_hash: Hash of block containing this tx (None if pending)
        block_number: Height of block containing this tx (None if pending)
        
        metadata: Additional application-specific data (safe for extensions)
    """
    
    tx_id: str  # UUID v4 or hash-based identifier
    timestamp: str  # ISO 8601 format with Z suffix
    tx_type: TransactionType
    
    # Privacy-focused: Hashed identities instead of usernames/emails
    sender_public_key_hash: str  # SHA-256(public_key)
    receiver_public_key_hash: str  # SHA-256(public_key)
    creator_id: str  # Hashed creator identifier
    
    # Tokenomics
    amount: float  # Amount of coins
    currency: str = "SOCIORA"
    
    # Video-specific metadata
    video_hash: str  # IPFS CIDv1 (e.g., Qm...)
    video_length: int  # Duration in seconds
    video_size: int  # File size in bytes
    
    # Storage proof (for Proof of Transcoding/Storage)
    storage_proof: Optional[str] = None  # Proof data (encrypted or hash)
    storage_proof_signature: Optional[str] = None  # Miner's signature
    
    # Anti-replay and gas
    nonce: int = 0
    gas_price: float = 0.001  # Coins per gas unit
    gas_limit: int = 21000  # Standard transaction limit
    
    # Lifecycle and blockchain reference
    status: TransactionStatus = TransactionStatus.PENDING
    block_hash: Optional[str] = None
    block_number: Optional[int] = None
    
    # Custom metadata for extensions
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Cached hash of transaction (computed on demand)
    _tx_hash: Optional[str] = None

    def compute_tx_hash(self) -> str:
        """
        Compute and cache the transaction hash.
        Hash is computed from all fields except tx_hash itself to avoid circularity.
        
        Returns:
            SHA-256 hash of transaction
        """
        tx_dict = asdict(self)
        # Remove computed fields from hash
        tx_dict.pop('_tx_hash', None)
        tx_dict.pop('status', None)  # Status can change, shouldn't affect hash
        
        # Convert enums to strings for hashing
        if isinstance(tx_dict.get('tx_type'), TransactionType):
            tx_dict['tx_type'] = tx_dict['tx_type'].value
        
        self._tx_hash = CryptoUtils.generate_transaction_hash(tx_dict)
        return self._tx_hash

    @property
    def tx_hash(self) -> str:
        """Get transaction hash, computing if necessary."""
        if self._tx_hash is None:
            self.compute_tx_hash()
        return self._tx_hash

    def to_dict(self, include_hash: bool = True) -> Dict[str, Any]:
        """
        Convert transaction to dictionary for serialization.
        
        Args:
            include_hash: Whether to include transaction hash
            
        Returns:
            Dictionary representation of transaction
        """
        data = asdict(self)
        # Convert enums to strings
        data['tx_type'] = data['tx_type'].value
        data['status'] = data['status'].value
        
        if include_hash:
            data['tx_hash'] = self.tx_hash
        
        data.pop('_tx_hash', None)
        return data

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Transaction':
        """
        Reconstruct transaction from dictionary.
        
        Args:
            data: Dictionary representation
            
        Returns:
            Transaction instance
        """
        data = data.copy()
        data.pop('tx_hash', None)  # Remove hash before reconstruction
        data['tx_type'] = TransactionType[data['tx_type']]
        data['status'] = TransactionStatus[data['status']]
        return Transaction(**data)

    def verify_signature(self, public_key: str, signature: str) -> bool:
        """
        Verify transaction signature using sender's public key.
        
        Args:
            public_key: Sender's public key (unhashed)
            signature: Transaction signature to verify
            
        Returns:
            True if signature is valid
        """
        # Verify public key hash matches
        expected_hash = CryptoUtils.hash_public_key(public_key)
        if expected_hash != self.sender_public_key_hash:
            return False
        
        # Verify signature of transaction hash
        tx_hash = self.tx_hash
        return CryptoUtils.verify_signature(tx_hash, signature, public_key)

    def __repr__(self) -> str:
        return (
            f"Transaction(tx_id={self.tx_id}, "
            f"type={self.tx_type.value}, "
            f"amount={self.amount}{self.currency}, "
            f"video={self.video_hash[:12]}..., "
            f"status={self.status.value})"
        )
