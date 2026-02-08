"""
Mining Examples for Sociora - Proof of Storage/Transcoding Consensus.

This module demonstrates the complete mining workflow:
1. Register storage nodes (miners)
2. Upload videos to network
3. Transcode videos to multiple formats
4. Validate video storage
5. Mine blocks with dynamic rewards
6. Inspect reward distribution based on video length
"""

import uuid
from utils import CryptoUtils
from storage_network import (
    get_storage_network,
    reset_storage_network,
    TranscodingProfile,
    VideoMetadata
)
from mining import (
    validate_video_storage,
    calculate_dynamic_reward,
    create_storage_proof,
    mine_block,
    DynamicRewardConfig,
    ValidationError,
    MiningError
)
from transaction import TransactionType


def example_1_setup_storage_network():
    """
    Example 1: Setup storage network with miner nodes.
    
    This simulates registering multiple storage nodes (miners)
    that will validate and store videos.
    """
    print("\n" + "="*80)
    print("EXAMPLE 1: Setup Storage Network with Miner Nodes")
    print("="*80)
    
    reset_storage_network()
    network = get_storage_network()
    
    # Register multiple storage nodes (miners)
    miners = [
        {
            'node_id': 'miner-us-west-01',
            'miner_public_key': 'miner_us_west_public_key',
            'region': 'us-west',
            'capacity': 10_000_000_000  # 10 GB
        },
        {
            'node_id': 'miner-eu-central-01',
            'miner_public_key': 'miner_eu_central_public_key',
            'region': 'eu-central',
            'capacity': 10_000_000_000  # 10 GB
        },
        {
            'node_id': 'miner-ap-southeast-01',
            'miner_public_key': 'miner_ap_southeast_public_key',
            'region': 'ap-southeast',
            'capacity': 10_000_000_000  # 10 GB
        }
    ]
    
    print("\nRegistering storage nodes:")
    for miner_info in miners:
        miner_hash = CryptoUtils.hash_public_key(miner_info['miner_public_key'])
        node = network.register_node(
            node_id=miner_info['node_id'],
            miner_address=miner_hash,
            region=miner_info['region'],
            storage_capacity=miner_info['capacity'],
            reputation=85.0
        )
        print(f"  ✓ {node.node_id}")
        print(f"    Region: {node.region}")
        print(f"    Capacity: {node.storage_capacity / 1_000_000_000:.1f} GB")
        print(f"    Reputation: {node.reputation}/100")


def example_2_upload_and_transcode_videos():
    """
    Example 2: Upload videos and simulate transcoding.
    
    Videos are uploaded to the storage network and transcoded
    into multiple formats for different devices/bandwidth.
    """
    print("\n" + "="*80)
    print("EXAMPLE 2: Upload Videos and Transcode")
    print("="*80)
    
    network = get_storage_network()
    creator_public_key = 'creator_wallet_public_key'
    creator_hash = CryptoUtils.hash_public_key(creator_public_key)
    
    # Video 1: Short tutorial
    print("\nUploading Video 1: Tutorial (10 minutes)")
    video1_cid = "QmTutorialVideo123456789ABCDEFGH"
    video1 = network.upload_video(
        video_cid=video1_cid,
        creator_id=creator_hash,
        title="Getting Started with Sociora",
        duration_seconds=600,  # 10 minutes
        size_bytes=150_000_000  # 150 MB
    )
    print(f"  CID: {video1_cid}")
    print(f"  Duration: {video1.duration_seconds}s")
    print(f"  Size: {video1.original_size_bytes / 1_000_000:.1f} MB")
    
    # Transcode to multiple formats
    transcoding_profiles = [
        TranscodingProfile(
            format_name="h264_480p",
            codec="h.264",
            resolution="480p",
            bitrate="1500k",
            size_bytes=35_000_000,
            duration_seconds=600,
            hash=CryptoUtils.hash_public_key("h264_480p_hash")
        ),
        TranscodingProfile(
            format_name="h264_720p",
            codec="h.264",
            resolution="720p",
            bitrate="3500k",
            size_bytes=80_000_000,
            duration_seconds=600,
            hash=CryptoUtils.hash_public_key("h264_720p_hash")
        ),
        TranscodingProfile(
            format_name="vp9_1080p",
            codec="VP9",
            resolution="1080p",
            bitrate="6000k",
            size_bytes=120_000_000,
            duration_seconds=600,
            hash=CryptoUtils.hash_public_key("vp9_1080p_hash")
        ),
    ]
    
    network.transcode_video(video1_cid, transcoding_profiles)
    print(f"  ✓ Transcoded to {len(transcoding_profiles)} formats:")
    for profile in transcoding_profiles:
        print(f"    • {profile.format_name} ({profile.resolution}) - {profile.size_bytes / 1_000_000:.1f} MB")
    
    # Video 2: Feature film (longer, higher reward)
    print("\nUploading Video 2: Film (90 minutes)")
    video2_cid = "QmFeatureFilm123456789ABCDEFGHIJ"
    video2 = network.upload_video(
        video_cid=video2_cid,
        creator_id=creator_hash,
        title="The Sociora Story - A Documentary",
        duration_seconds=5400,  # 90 minutes
        size_bytes=2_000_000_000  # 2 GB
    )
    print(f"  CID: {video2_cid}")
    print(f"  Duration: {video2.duration_seconds}s ({video2.duration_seconds / 60:.0f} minutes)")
    print(f"  Size: {video2.original_size_bytes / 1_000_000_000:.2f} GB")
    
    # Transcode feature film
    feature_profiles = [
        TranscodingProfile(
            format_name="h264_1080p",
            codec="h.264",
            resolution="1080p",
            bitrate="8000k",
            size_bytes=450_000_000,
            duration_seconds=5400,
            hash=CryptoUtils.hash_public_key("feature_h264_1080p")
        ),
        TranscodingProfile(
            format_name="vp9_4k",
            codec="VP9",
            resolution="4K",
            bitrate="15000k",
            size_bytes=900_000_000,
            duration_seconds=5400,
            hash=CryptoUtils.hash_public_key("feature_vp9_4k")
        ),
        TranscodingProfile(
            format_name="av1_4k",
            codec="AV1",
            resolution="4K",
            bitrate="10000k",
            size_bytes=600_000_000,
            duration_seconds=5400,
            hash=CryptoUtils.hash_public_key("feature_av1_4k")
        ),
    ]
    
    network.transcode_video(video2_cid, feature_profiles)
    print(f"  ✓ Transcoded to {len(feature_profiles)} formats")
    
    return video1_cid, video2_cid


def example_3_replicate_videos_on_network():
    """
    Example 3: Distribute video replicas across network.
    
    Videos are stored on multiple nodes for redundancy
    and availability.
    """
    print("\n" + "="*80)
    print("EXAMPLE 3: Replicate Videos Across Network")
    print("="*80)
    
    network = get_storage_network()
    nodes = list(network.get_storage_nodes().keys())
    
    # Replicate short video on all 3 nodes
    video1_cid = "QmTutorialVideo123456789ABCDEFGH"
    print(f"\nReplicating video 1 ({video1_cid[:12]}...) across {len(nodes)} nodes:")
    for node_id in nodes:
        success = network.store_video_replica(video1_cid, node_id)
        status = "✓" if success else "✗"
        print(f"  {status} {node_id}")
    
    # Replicate feature on 2 nodes only (partial replication)
    video2_cid = "QmFeatureFilm123456789ABCDEFGHIJ"
    print(f"\nReplicating video 2 ({video2_cid[:12]}...) on 2 nodes:")
    for node_id in nodes[:2]:
        success = network.store_video_replica(video2_cid, node_id)
        status = "✓" if success else "✗"
        print(f"  {status} {node_id}")


def example_4_validate_video_storage():
    """
    Example 4: Validate video storage on network.
    
    Demonstrates the validate_video_storage function which is
    the core of Proof of Storage consensus.
    """
    print("\n" + "="*80)
    print("EXAMPLE 4: Validate Video Storage")
    print("="*80)
    
    network = get_storage_network()
    miner_public_key = 'miner_us_west_public_key'
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    
    video1_cid = "QmTutorialVideo123456789ABCDEFGH"
    
    print(f"\nValidating {video1_cid[:12]}...")
    validation_result = validate_video_storage(
        video_cid=video1_cid,
        validator_address=miner_hash,
        storage_network=network,
        min_replicas=1
    )
    
    if validation_result.is_valid:
        print(f"  ✓ Validation PASSED")
        print(f"    Replicas found: {validation_result.replicas_found}")
        print(f"    Transcoding complete: {validation_result.transcoding_complete}")
        print(f"    Formats: {', '.join(validation_result.transcoding_formats)}")
        print(f"    Validation time: {validation_result.validation_duration_seconds:.3f}s")
    else:
        print(f"  ✗ Validation FAILED: {validation_result.error_message}")


def example_5_dynamic_reward_calculation():
    """
    Example 5: Calculate dynamic rewards based on video length.
    
    Shows how rewards scale with video characteristics:
    - Longer videos = more reward (more storage/transcoding work)
    - More profiles = more reward (more computation)
    - More replicas = more reward (better network health)
    """
    print("\n" + "="*80)
    print("EXAMPLE 5: Dynamic Reward Calculation")
    print("="*80)
    
    network = get_storage_network()
    reward_config = DynamicRewardConfig()
    
    # Short video
    video1_cid = "QmTutorialVideo123456789ABCDEFGH"
    video1 = network.get_video_metadata(video1_cid)
    
    # Simulate validation for short video
    miner_public_key = 'miner_us_west_public_key'
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    validation1 = validate_video_storage(video1_cid, miner_hash, network, 1)
    
    reward1 = calculate_dynamic_reward(video1, validation1, reward_config)
    
    print(f"\nShort Video (10 minutes):")
    print(f"  Duration: {video1.duration_seconds}s")
    print(f"  Transcoding profiles: {len(video1.transcoded_profiles)}")
    print(f"  Storage replicas: {validation1.replicas_found}")
    print(f"\n  Reward Breakdown:")
    print(f"    Base subsidy: {reward_config.base_subsidy} SOCIORA")
    print(f"    Length bonus (600s × 0.1): {video1.duration_seconds * reward_config.reward_per_second} SOCIORA")
    print(f"    Profile bonus (3 × 5): {len(video1.transcoded_profiles) * reward_config.reward_per_profile} SOCIORA")
    print(f"    Replica bonus ((1-1) × 2): {max(0, validation1.replicas_found - 1) * reward_config.reward_per_replica} SOCIORA")
    print(f"  ─────────────────────────────────")
    print(f"  TOTAL REWARD: {reward1} SOCIORA")
    
    # Feature film
    video2_cid = "QmFeatureFilm123456789ABCDEFGHIJ"
    video2 = network.get_video_metadata(video2_cid)
    validation2 = validate_video_storage(video2_cid, miner_hash, network, 1)
    
    reward2 = calculate_dynamic_reward(video2, validation2, reward_config)
    
    print(f"\nFeature Film (90 minutes):")
    print(f"  Duration: {video2.duration_seconds}s")
    print(f"  Transcoding profiles: {len(video2.transcoded_profiles)}")
    print(f"  Storage replicas: {validation2.replicas_found}")
    print(f"\n  Reward Breakdown:")
    print(f"    Base subsidy: {reward_config.base_subsidy} SOCIORA")
    print(f"    Length bonus ({video2.duration_seconds}s × 0.1): {video2.duration_seconds * reward_config.reward_per_second} SOCIORA")
    print(f"    Profile bonus ({len(video2.transcoded_profiles)} × 5): {len(video2.transcoded_profiles) * reward_config.reward_per_profile} SOCIORA")
    print(f"    Replica bonus (({validation2.replicas_found}-1) × 2): {max(0, validation2.replicas_found - 1) * reward_config.reward_per_replica} SOCIORA")
    print(f"  ─────────────────────────────────")
    print(f"  TOTAL REWARD: {reward2} SOCIORA")
    
    print(f"\nReward Comparison:")
    print(f"  Short video: {reward1} SOCIORA")
    print(f"  Feature film: {reward2} SOCIORA")
    print(f"  Difference: {reward2 - reward1} SOCIORA ({(reward2 - reward1) / reward1 * 100:.1f}% more)")


def example_6_mine_block_with_storage_proof():
    """
    Example 6: Mine a complete block with storage proof.
    
    This is the MAIN mining function demonstrating:
    1. Video storage validation
    2. Dynamic reward calculation
    3. Reward distribution to beneficiaries
    4. Block hash computation
    """
    print("\n" + "="*80)
    print("EXAMPLE 6: Mine Block with Storage Proof")
    print("="*80)
    
    network = get_storage_network()
    
    creator_public_key = 'creator_wallet_public_key'
    creator_hash = CryptoUtils.hash_public_key(creator_public_key)
    
    miner_public_key = 'miner_us_west_public_key'
    miner_hash = CryptoUtils.hash_public_key(miner_public_key)
    
    video_cid = "QmTutorialVideo123456789ABCDEFGH"
    
    reward_config = DynamicRewardConfig(
        base_subsidy=50.0,
        reward_per_second=0.1,
        reward_per_profile=5.0,
        reward_per_replica=2.0,
        creator_percentage=40.0,
        miner_percentage=35.0,
        viewer_percentage=15.0,
        platform_percentage=10.0
    )
    
    print(f"\nMining parameters:")
    print(f"  Block number: 1")
    print(f"  Creator: {creator_hash[:16]}...")
    print(f"  Miner: {miner_hash[:16]}...")
    print(f"  Video: {video_cid[:12]}...")
    
    try:
        block, storage_proof, validation = mine_block(
            block_number=1,
            miner_address=miner_hash,
            previous_block_hash="0000000000000000000000000000000000000000000000000000000000000000",
            video_cid=video_cid,
            creator_id=creator_hash,
            storage_network=network,
            reward_config=reward_config,
            difficulty=1
        )
        
        print(f"\n✓ BLOCK MINED SUCCESSFULLY")
        print(f"\nBlock Details:")
        print(f"  Block number: {block.block_number}")
        print(f"  Block hash: {block.block_hash[:32]}...")
        print(f"  Transactions: {len(block.transactions)}")
        print(f"  Miner: {block.miner_address[:16]}...")
        
        print(f"\nStorage Proof:")
        print(f"  Video CID: {storage_proof.video_cid}")
        print(f"  Proof hash: {storage_proof.proof_hash[:32]}...")
        print(f"  Valid: {storage_proof.is_valid}")
        print(f"  Replicas: {storage_proof.storage_replication}")
        print(f"  Profiles: {len(storage_proof.transcoding_profiles)}")
        
        print(f"\nValidation Result:")
        print(f"  Valid: {validation.is_valid}")
        print(f"  Replicas found: {validation.replicas_found}")
        print(f"  Formats: {', '.join(validation.transcoding_formats)}")
        
        print(f"\nBlock Reward Distribution:")
        if block.block_reward:
            for beneficiary in block.block_reward.beneficiaries:
                print(f"  {beneficiary.role.upper()}: {beneficiary.amount} SOCIORA ({beneficiary.percentage}%)")
                print(f"    Address: {beneficiary.address[:16]}...")
        
    except (ValidationError, MiningError) as e:
        print(f"\n✗ MINING FAILED: {e}")


def run_all_mining_examples():
    """Execute all mining examples."""
    print("\n" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + " "*14 + "SOCIORA MINING - PROOF OF STORAGE/TRANSCODING EXAMPLES" + " "*10 + "█")
    print("█" + " "*78 + "█")
    print("█"*80)
    
    example_1_setup_storage_network()
    example_2_upload_and_transcode_videos()
    example_3_replicate_videos_on_network()
    example_4_validate_video_storage()
    example_5_dynamic_reward_calculation()
    example_6_mine_block_with_storage_proof()
    
    print("\n" + "█"*80)
    print("█" + " "*78 + "█")
    print("█" + " "*25 + "MINING EXAMPLES COMPLETE" + " "*30 + "█")
    print("█" + " "*78 + "█")
    print("█"*80 + "\n")


if __name__ == "__main__":
    run_all_mining_examples()
