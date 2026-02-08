"""
Example usage and test cases for Sociora blockchain data structures.
Demonstrates Block, Transaction, and Reward distribution in action.
"""

import uuid
from utils import CryptoUtils
from transaction import Transaction, TransactionType, TransactionStatus
from block import Block, BlockReward, Beneficiary, ConsensusMechanism


def example_1_simple_video_upload():
    """
    Example 1: Creator uploads a video (VIDEO_UPLOAD transaction)
    """
    print("\n" + "="*80)
    print("EXAMPLE 1: Video Upload Transaction")
    print("="*80)
    
    # Simulate user public keys (in production, these come from users' wallets)
    creator_public_key = "creator_node_public_key_abc123"
    miner_public_key = "validator_node_public_key_xyz789"
    
    # Hash the public keys for privacy
    creator_hash = CryptoUtils.hash_public_key(creator_public_key)
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    creator_id_hash = creator_hash  # Creator ID for ownership tracking
    
    # Create a video upload transaction
    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        timestamp=CryptoUtils.timestamp_now(),
        tx_type=TransactionType.VIDEO_UPLOAD,
        
        # Privacy: Hashed identities
        sender_public_key_hash=creator_hash,
        receiver_public_key_hash=miner_hash,
        creator_id=creator_id_hash,
        
        # Tokenomics (can be 0 for upload)
        amount=0.0,
        currency="SOCIORA",
        
        # Video metadata
        video_hash="QmVidContent123456789ABCDEFGH",  # IPFS CIDv1
        video_length=600,  # 10 minutes
        video_size=500000000,  # 500 MB
        
        # Gas specification
        gas_price=0.001,
        gas_limit=50000,
        nonce=1
    )
    
    # Compute transaction hash
    tx_hash = tx.compute_tx_hash()
    
    print(f"\nTransaction Created:")
    print(f"  TX ID: {tx.tx_id}")
    print(f"  Type: {tx.tx_type.value}")
    print(f"  Video IPFS Hash: {tx.video_hash}")
    print(f"  Video Length: {tx.video_length}s")
    print(f"  Creator ID: {tx.creator_id[:16]}...")
    print(f"  Sender (Hashed): {tx.sender_public_key_hash[:16]}...")
    print(f"  Receiver (Hashed): {tx.receiver_public_key_hash[:16]}...")
    print(f"  TX Hash: {tx_hash[:32]}...")
    print(f"  Status: {tx.status.value}")


def example_2_investment_transaction():
    """
    Example 2: Investor stakes coins in a video creator (INVESTMENT transaction)
    """
    print("\n" + "="*80)
    print("EXAMPLE 2: Investment Transaction (Staking)")
    print("="*80)
    
    investor_public_key = "investor_wallet_public_key_123"
    creator_public_key = "creator_wallet_public_key_456"
    
    investor_hash = CryptoUtils.hash_public_key(investor_public_key)
    creator_hash = CryptoUtils.hash_public_key(creator_public_key)
    
    investment_tx = Transaction(
        tx_id=str(uuid.uuid4()),
        timestamp=CryptoUtils.timestamp_now(),
        tx_type=TransactionType.INVESTMENT,
        
        sender_public_key_hash=investor_hash,
        receiver_public_key_hash=creator_hash,
        creator_id=creator_hash,
        
        # Investment amount
        amount=100.0,
        currency="SOCIORA",
        
        # Video being invested in
        video_hash="QmVidContent123456789ABCDEFGH",
        video_length=600,
        video_size=500000000,
        
        # Gas for blockchain recording
        gas_price=0.001,
        gas_limit=21000,
        nonce=2,
        
        # Investment specific metadata
        metadata={
            'lock_period': 2592000,  # 30 days in seconds
            'expected_return_percent': 12.5
        }
    )
    
    print(f"\nInvestment Transaction Created:")
    print(f"  Investor: {investor_hash[:16]}...")
    print(f"  Creator: {creator_hash[:16]}...")
    print(f"  Investment Amount: {investment_tx.amount} {investment_tx.currency}")
    print(f"  Lock Period: {investment_tx.metadata['lock_period']} seconds")
    print(f"  Expected Return: {investment_tx.metadata['expected_return_percent']}%")
    print(f"  Video: {investment_tx.video_hash}")


def example_3_block_creation_and_reward_distribution():
    """
    Example 3: Mining a block with multi-beneficiary reward distribution
    """
    print("\n" + "="*80)
    print("EXAMPLE 3: Block Mining with Reward Distribution")
    print("="*80)
    
    # Setup identities
    creator_public_key = "creator_node_public_key_abc123"
    miner_public_key = "validator_node_public_key_xyz789"
    viewer_public_key = "viewer_wallet_public_key_999"
    platform_wallet = "0000000000000000000000000000000000000000000000000000000000000001"
    
    creator_hash = CryptoUtils.hash_public_key(creator_public_key)
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    viewer_hash = CryptoUtils.hash_public_key(viewer_public_key)
    
    # Create sample transactions for the block
    transactions = []
    for i in range(3):
        tx = Transaction(
            tx_id=str(uuid.uuid4()),
            timestamp=CryptoUtils.timestamp_now(),
            tx_type=TransactionType.DISTRIBUTION,
            sender_public_key_hash=miner_hash,
            receiver_public_key_hash=creator_hash,
            creator_id=creator_hash,
            amount=10.0,
            video_hash="QmVidContent123456789ABCDEFGH",
            video_length=600,
            video_size=500000000,
            nonce=i
        )
        transactions.append(tx)
    
    # Create block
    block = Block(
        block_number=1,
        timestamp=CryptoUtils.timestamp_now(),
        miner_address=miner_hash,
        previous_hash="0000000000000000000000000000000000000000000000000000000000000000",  # Genesis
        transactions=transactions,
        difficulty=1,
        nonce=12345
    )
    
    print(f"\nBlock Created:")
    print(f"  Block Number: {block.block_number}")
    print(f"  Miner: {block.miner_address[:16]}...")
    print(f"  Transactions: {len(block.transactions)}")
    print(f"  Previous Hash: {block.previous_hash[:32]}...")
    
    # Generate reward with multi-beneficiary distribution
    print(f"\nGenerating Reward (Proof of Transcoding)...")
    
    block_reward = block.generate_reward(
        base_subsidy=50.0,  # 50 SOCIORA coins minted
        creator_address=creator_hash,
        creator_percentage=40.0,  # Creator gets 40%
        miner_percentage=35.0,    # Miner gets 35%
        viewer_percentage=15.0,   # Viewer (PoA) gets 15%
        platform_percentage=10.0, # Platform gets 10%
        viewer_address=viewer_hash,
        platform_address=platform_wallet
    )
    
    print(f"\n  Base Subsidy: {block_reward.base_subsidy} SOCIORA")
    print(f"  Transaction Fees: {block_reward.fee_reward} SOCIORA")
    print(f"  Total Reward: {block_reward.total_reward} SOCIORA")
    print(f"  Consensus: {block_reward.consensus_type.value}")
    
    print(f"\n  Reward Distribution:")
    for beneficiary in block_reward.beneficiaries:
        print(f"    {beneficiary.role.upper()}: {beneficiary.amount} SOCIORA ({beneficiary.percentage}%)")
        print(f"      Address: {beneficiary.address[:16]}...")
    
    # Compute and display block hash
    block_hash = block.compute_block_hash()
    print(f"\n  Block Hash: {block_hash[:32]}...")


def example_4_storage_proof():
    """
    Example 4: Miner submits storage proof for transcoding
    """
    print("\n" + "="*80)
    print("EXAMPLE 4: Storage Proof (Proof of Transcoding)")
    print("="*80)
    
    miner_public_key = "validator_node_public_key_xyz789"
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    
    # Create block
    block = Block(
        block_number=2,
        timestamp=CryptoUtils.timestamp_now(),
        miner_address=miner_hash,
        previous_hash="aabbccdd1234567890",
        transactions=[],
        difficulty=2,
        nonce=54321
    )
    
    # Add storage proofs for videos
    video_hashes = [
        "QmVidContent123456789ABCDEFGH",
        "QmVidContent987654321ZYXWVUTS"
    ]
    
    print(f"\nBlock {block.block_number}:")
    print(f"  Miner: {miner_hash[:16]}...")
    
    for video_hash in video_hashes:
        # In production, signature comes from miner's private key signing proof
        miner_signature = CryptoUtils.hash_public_key(f"{video_hash}:{miner_public_key}")
        block.add_storage_proof(video_hash, miner_signature)
        print(f"\n  Video Proof Added:")
        print(f"    Video Hash: {video_hash}")
        print(f"    Miner Signature: {miner_signature[:32]}...")
    
    print(f"\n  Total Storage Proofs: {len(block.video_proofs)}")


def example_5_transaction_serialization():
    """
    Example 5: Serialize and deserialize transactions (for storage/transmission)
    """
    print("\n" + "="*80)
    print("EXAMPLE 5: Transaction Serialization")
    print("="*80)
    
    creator_hash = CryptoUtils.hash_public_key("creator_key")
    miner_hash = CryptoUtils.hash_public_key("miner_key")
    
    # Create transaction
    original_tx = Transaction(
        tx_id=str(uuid.uuid4()),
        timestamp=CryptoUtils.timestamp_now(),
        tx_type=TransactionType.VIDEO_UPLOAD,
        sender_public_key_hash=creator_hash,
        receiver_public_key_hash=miner_hash,
        creator_id=creator_hash,
        amount=0.0,
        video_hash="QmVidContent123456789ABCDEFGH",
        video_length=600,
        video_size=500000000,
        nonce=1
    )
    
    # Serialize to dict
    tx_dict = original_tx.to_dict(include_hash=True)
    print(f"\nSerialized Transaction (JSON-compatible):")
    print(f"  TX ID: {tx_dict['tx_id']}")
    print(f"  Type: {tx_dict['tx_type']}")
    print(f"  Hash: {tx_dict['tx_hash'][:32]}...")
    
    # Deserialize back to object
    restored_tx = Transaction.from_dict(tx_dict)
    print(f"\nDeserialized Transaction:")
    print(f"  TX ID: {restored_tx.tx_id}")
    print(f"  Type: {restored_tx.tx_type.value}")
    print(f"  Status: {restored_tx.status.value}")
    print(f"  Same Hash: {restored_tx.tx_hash == tx_dict['tx_hash']}")


def run_all_examples():
    """Execute all example scenarios."""
    print("\n" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + " "*20 + "SOCIORA BLOCKCHAIN - DATA STRUCTURE EXAMPLES" + " "*15 + "█")
    print("█" + " "*78 + "█")
    print("█"*80)
    
    example_1_simple_video_upload()
    example_2_investment_transaction()
    example_3_block_creation_and_reward_distribution()
    example_4_storage_proof()
    example_5_transaction_serialization()
    
    print("\n" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + " "*25 + "EXAMPLES COMPLETE" + " "*36 + "█")
    print("█" + " "*78 + "█")
    print("█"*80 + "\n")


if __name__ == "__main__":
    run_all_examples()
