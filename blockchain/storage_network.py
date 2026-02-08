"""
Storage Network Simulation for Sociora Proof of Storage/Transcoding.

This module simulates a decentralized storage network (similar to IPFS/Filecoin)
where miners store and validate video content before receiving block rewards.

In production, this would interface with:
- IPFS: Content-addressable file system
- Arweave: Permanent storage layer
- Actual miner nodes: Running video transcoding services
"""

from dataclasses import dataclass, asdict, field
from typing import Dict, List, Optional, Tuple, Set
from enum import Enum
import hashlib
import json
from datetime import datetime, timedelta


class StorageStatus(Enum):
    """Status of stored content on the network."""
    UNKNOWN = "UNKNOWN"  # Not yet stored
    PENDING = "PENDING"  # Upload in progress
    STORED = "STORED"  # Stored on network
    REPLICATED = "REPLICATED"  # Stored on multiple nodes
    VERIFIED = "VERIFIED"  # Verification complete


class TranscodingStatus(Enum):
    """Status of video transcoding process."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReplicationFactor(Enum):
    """Number of copies to maintain on network."""
    MINIMAL = 1  # Single copy (risky)
    STANDARD = 3  # Three copies (default)
    HIGH = 6  # Six copies (high availability)


@dataclass
class TranscodingProfile:
    """Video transcoding output for a specific format."""
    format_name: str  # e.g., "h264_720p", "vp9_1080p"
    codec: str  # "h.264", "VP9", "AV1"
    resolution: str  # "720p", "1080p", "4K"
    bitrate: str  # "2500k", "5000k"
    size_bytes: int  # File size of transcoded version
    duration_seconds: int  # Duration in seconds
    hash: str  # SHA-256 of transcoded file


@dataclass
class StorageNode:
    """Represents a miner node storing content on network."""
    node_id: str  # Unique identifier
    address: str  # Hashed public key of miner
    region: str  # Geographic region (us-west, eu-central, etc.)
    storage_capacity: int  # Total storage in bytes
    storage_used: int  # Currently used storage in bytes
    reputation: float  # Node reputation score (0-100)
    is_online: bool = True


@dataclass
class StorageProof:
    """
    Cryptographic proof that a miner has stored and validated video content.
    
    This proof must be submitted before a miner can receive block rewards.
    The proof demonstrates:
    1. Video is accessible on network (stored)
    2. Video has been transcoded to multiple formats
    3. Miner has computational resources and capacity
    
    Attributes:
        video_cid: IPFS Content Identifier (content hash)
        miner_address: Hashed public key of miner
        timestamp: ISO 8601 timestamp of proof
        
        storage_nodes: Nodes storing this content (replication count)
        transcoding_profiles: List of transcoded formats with hashes
        
        proof_nonce: Random nonce for proof generation
        proof_hash: SHA-256 hash proving computation
        
        storage_data: Metadata about storage (size, addresses, etc.)
        is_valid: Whether this proof passes validation
    """
    video_cid: str
    miner_address: str
    timestamp: str
    
    storage_nodes: List[StorageNode]
    transcoding_profiles: List[TranscodingProfile]
    
    proof_nonce: str  # Random for computation
    proof_hash: str  # Result of proof computation
    
    storage_data: Dict = field(default_factory=dict)
    is_valid: bool = False
    
    # Metadata
    computation_time: float = 0.0  # Seconds
    storage_replication: int = 1  # Number of copies

    def to_dict(self) -> Dict:
        """Convert proof to dictionary for serialization."""
        return {
            'video_cid': self.video_cid,
            'miner_address': self.miner_address,
            'timestamp': self.timestamp,
            'storage_nodes': len(self.storage_nodes),
            'transcoding_profiles': len(self.transcoding_profiles),
            'proof_hash': self.proof_hash,
            'is_valid': self.is_valid,
            'computation_time': self.computation_time,
            'storage_replication': self.storage_replication
        }


@dataclass
class VideoMetadata:
    """Complete metadata and storage information about a video."""
    video_cid: str  # IPFS CIDv1
    creator_id: str  # Hashed creator address
    title: str
    duration_seconds: int
    original_size_bytes: int
    
    storage_status: StorageStatus = StorageStatus.UNKNOWN
    transcoding_status: TranscodingStatus = TranscodingStatus.NOT_STARTED
    
    uploaded_at: str = ""
    available_on_network: List[str] = field(default_factory=list)  # Node IDs
    transcoded_profiles: List[TranscodingProfile] = field(default_factory=list)
    
    replication_factor: int = 3  # Default: 3 copies
    total_cost_storage: float = 0.0  # Pinning cost
    total_cost_transcoding: float = 0.0  # Computation cost

    def is_fully_available(self) -> bool:
        """Check if video is stored and transcoded on network."""
        return (
            self.storage_status == StorageStatus.VERIFIED and
            self.transcoding_status == TranscodingStatus.COMPLETED and
            len(self.available_on_network) >= self.replication_factor
        )


class StorageNetwork:
    """
    Simulates a decentralized storage network maintaining video inventory.
    
    In production, this would be:
    - IPFS DHT (Distributed Hash Table)
    - Filecoin storage market
    - Arweave permanent storage
    
    For MVP, we simulate:
    - Video availability tracking
    - Node inventory management
    - Proof verification
    """
    
    def __init__(self):
        self.videos: Dict[str, VideoMetadata] = {}
        self.nodes: Dict[str, StorageNode] = {}
        self.proofs: Dict[str, StorageProof] = {}

    def register_node(
        self,
        node_id: str,
        miner_address: str,
        region: str,
        storage_capacity: int,
        reputation: float = 80.0
    ) -> StorageNode:
        """Register a storage node (miner) on the network."""
        node = StorageNode(
            node_id=node_id,
            address=miner_address,
            region=region,
            storage_capacity=storage_capacity,
            storage_used=0,
            reputation=reputation
        )
        self.nodes[node_id] = node
        return node

    def upload_video(
        self,
        video_cid: str,
        creator_id: str,
        title: str,
        duration_seconds: int,
        size_bytes: int
    ) -> VideoMetadata:
        """Register a video on the network after upload."""
        metadata = VideoMetadata(
            video_cid=video_cid,
            creator_id=creator_id,
            title=title,
            duration_seconds=duration_seconds,
            original_size_bytes=size_bytes,
            uploaded_at=datetime.utcnow().isoformat() + "Z"
        )
        self.videos[video_cid] = metadata
        return metadata

    def store_video_replica(
        self,
        video_cid: str,
        node_id: str
    ) -> bool:
        """Store a replica of video on a specific node."""
        if video_cid not in self.videos:
            return False
        if node_id not in self.nodes:
            return False
        
        video = self.videos[video_cid]
        node = self.nodes[node_id]
        
        # Check node has space
        if node.storage_used + video.original_size_bytes > node.storage_capacity:
            return False
        
        # Add to network and update node
        if node_id not in video.available_on_network:
            video.available_on_network.append(node_id)
            node.storage_used += video.original_size_bytes
        
        # Update status if all replicas stored
        if len(video.available_on_network) >= video.replication_factor:
            video.storage_status = StorageStatus.REPLICATED
        
        return True

    def transcode_video(
        self,
        video_cid: str,
        profiles: List[TranscodingProfile]
    ) -> bool:
        """Mark video as transcoded with multiple output formats."""
        if video_cid not in self.videos:
            return False
        
        video = self.videos[video_cid]
        video.transcoded_profiles = profiles
        video.transcoding_status = TranscodingStatus.COMPLETED
        
        return True

    def verify_video_storage(
        self,
        video_cid: str,
        min_replicas: int = 1
    ) -> bool:
        """Verify that video is available on network with minimum replication."""
        if video_cid not in self.videos:
            return False
        
        video = self.videos[video_cid]
        
        # Check replication factor
        available_nodes = len([n for n in video.available_on_network if self.nodes[n].is_online])
        if available_nodes < min_replicas:
            return False
        
        # Check transcoding completion
        if video.transcoding_status != TranscodingStatus.COMPLETED:
            return False
        
        # Mark as verified
        video.storage_status = StorageStatus.VERIFIED
        return True

    def get_video_metadata(self, video_cid: str) -> Optional[VideoMetadata]:
        """Retrieve video metadata."""
        return self.videos.get(video_cid)

    def get_storage_nodes(self) -> Dict[str, StorageNode]:
        """Get all registered storage nodes."""
        return self.nodes.copy()

    def offline_node(self, node_id: str) -> bool:
        """Mark a node as offline (handles node failure)."""
        if node_id not in self.nodes:
            return False
        self.nodes[node_id].is_online = False
        return True


# Global singleton instance
_storage_network: Optional[StorageNetwork] = None


def get_storage_network() -> StorageNetwork:
    """Get or create the global storage network."""
    global _storage_network
    if _storage_network is None:
        _storage_network = StorageNetwork()
    return _storage_network


def reset_storage_network() -> None:
    """Reset storage network (for testing)."""
    global _storage_network
    _storage_network = StorageNetwork()
