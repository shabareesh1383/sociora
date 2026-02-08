"""
Utility functions for Sociora blockchain cryptographic operations and privacy.
Handles hashing, key derivation, and secure identity management.
"""

import hashlib
import hmac
from typing import Union
from datetime import datetime
import json


class CryptoUtils:
    """Cryptographic utilities for Sociora protocol."""

    @staticmethod
    def hash_public_key(public_key: str) -> str:
        """
        Hash a public key (sender/receiver identity) using SHA-256.
        This ensures PII is not stored on-chain, only hashed addresses.
        
        Args:
            public_key: Raw public key string (Base58 format recommended)
            
        Returns:
            Hashed public key (hex string)
        """
        return hashlib.sha256(public_key.encode()).hexdigest()

    @staticmethod
    def hash_ipfs_cid(ipfs_cid: str) -> str:
        """
        Hash IPFS CID for verification and double-hashing.
        This creates a content-addressable reference.
        
        Args:
            ipfs_cid: IPFS Content Identifier (CIDv1 or CIDv0)
            
        Returns:
            SHA-256 hash of the IPFS CID
        """
        return hashlib.sha256(ipfs_cid.encode()).hexdigest()

    @staticmethod
    def verify_signature(message: str, signature: str, public_key: str) -> bool:
        """
        Verify HMAC signature using public key.
        Simple implementation; production should use ed25519 or similar.
        
        Args:
            message: Original message/data
            signature: HMAC signature to verify
            public_key: Public key for verification
            
        Returns:
            True if signature is valid, False otherwise
        """
        expected_sig = hmac.new(
            public_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_sig)

    @staticmethod
    def generate_transaction_hash(transaction_dict: dict) -> str:
        """
        Generate deterministic hash of transaction data.
        Used for transaction integrity verification.
        
        Args:
            transaction_dict: Transaction data as dictionary
            
        Returns:
            SHA-256 hash of transaction
        """
        # Sort keys for deterministic hashing
        json_str = json.dumps(transaction_dict, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()

    @staticmethod
    def generate_block_hash(block_dict: dict) -> str:
        """
        Generate deterministic hash of block data.
        Excludes 'hash' field to prevent circular references.
        
        Args:
            block_dict: Block data as dictionary
            
        Returns:
            SHA-256 hash of block
        """
        # Create copy to avoid modifying original
        block_copy = {k: v for k, v in block_dict.items() if k != 'hash'}
        json_str = json.dumps(block_copy, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()

    @staticmethod
    def timestamp_now() -> str:
        """
        Get current ISO 8601 timestamp for blockchain events.
        Used consistently across blocks and transactions.
        
        Returns:
            ISO format timestamp string
        """
        return datetime.utcnow().isoformat() + "Z"


class TokenomicsUtils:
    """Utilities for tokenomics calculations and revenue splits."""

    @staticmethod
    def calculate_reward_split(
        total_reward: float,
        creator_percentage: float,
        miner_percentage: float,
        viewer_percentage: float,
        platform_percentage: float
    ) -> dict:
        """
        Calculate reward distribution across beneficiaries.
        Ensures percentages sum to 100 and handles rounding.
        
        Args:
            total_reward: Total coins to distribute
            creator_percentage: Creator share (0-100)
            miner_percentage: Miner/Validator share (0-100)
            viewer_percentage: Viewer (Proof of Attention) share (0-100)
            platform_percentage: Platform/Company share (0-100)
            
        Returns:
            Dict with distribution amounts for each beneficiary
            
        Raises:
            ValueError: If percentages don't sum to 100
        """
        total_percent = (
            creator_percentage + miner_percentage + 
            viewer_percentage + platform_percentage
        )
        
        if abs(total_percent - 100.0) > 0.01:  # Allow small floating-point error
            raise ValueError(
                f"Reward percentages must sum to 100. Got {total_percent}"
            )
        
        return {
            'creator': round(total_reward * (creator_percentage / 100), 8),
            'miner': round(total_reward * (miner_percentage / 100), 8),
            'viewer': round(total_reward * (viewer_percentage / 100), 8),
            'platform': round(total_reward * (platform_percentage / 100), 8),
        }

    @staticmethod
    def validate_percentages(
        creator: float,
        miner: float,
        viewer: float,
        platform: float
    ) -> bool:
        """
        Validate that all percentages are positive and sum to 100.
        
        Args:
            creator: Creator percentage
            miner: Miner percentage
            viewer: Viewer percentage
            platform: Platform percentage
            
        Returns:
            True if valid, False otherwise
        """
        if any(p < 0 for p in [creator, miner, viewer, platform]):
            return False
        
        total = creator + miner + viewer + platform
        return abs(total - 100.0) <= 0.01
