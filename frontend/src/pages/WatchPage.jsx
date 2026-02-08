import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WatchPage = ({ auth, setMessage, onAuthUpdate }) => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInvesting, setIsInvesting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [isHated, setIsHated] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideo();
  }, [videoId, auth]);

  const loadEngagementStatus = async (creatorId) => {
    if (!auth) return;
    
    try {
      const token = localStorage.getItem("authToken");
      
      // Load follow status
      const followRes = await fetch(
        `${API_BASE}/api/engagement/${creatorId}/follow-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (followRes.ok) {
        const followData = await followRes.json();
        setIsFollowing(followData.isFollowing);
      }

      // Load love/hate status
      const engagementRes = await fetch(
        `${API_BASE}/api/engagement/video/${videoId}/engagement-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (engagementRes.ok) {
        const engagementData = await engagementRes.json();
        setIsLoved(engagementData.isLoved);
        setIsHated(engagementData.isHated);
      }
    } catch (error) {
      console.error("Failed to load engagement status:", error);
    }
  };

  const loadVideo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/videos/${videoId}`);
      if (!res.ok) throw new Error("Video not found");
      const data = await res.json();
      setVideo(data);
      setComments(data.comments || []);
      
      // Load engagement status if user is authenticated
      if (auth && data.creatorId?._id) {
        await loadEngagementStatus(data.creatorId._id);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load video");
      setTimeout(() => navigate("/"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setMessage("❌ Comment cannot be empty");
      return;
    }

    if (!auth) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ text: newComment })
      });

      if (!res.ok) throw new Error("Failed to post comment");
      const updatedVideo = await res.json();
      setVideo(updatedVideo);
      setComments(updatedVideo.comments || []);
      setNewComment("");
      setMessage("✅ Comment posted!");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to post comment");
    }
  };

  const handleInvest = async () => {
    if (!auth) {
      navigate("/login");
      return;
    }

    // Check if user is the creator
    if (auth.id === video.creatorId._id) {
      setMessage("❌ You are the creator of this video so you are not allowed to do such actions");
      return;
    }

    if (!investAmount || investAmount <= 0) {
      setMessage("❌ Please enter a valid investment amount");
      return;
    }

    setIsInvesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions/invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          videoId,
          toCreator: video.creatorId._id,
          amount: parseFloat(investAmount)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ ${data.message || "Investment failed"}`);
        setIsInvesting(false);
        return;
      }

      setMessage("✅ Investment successful!");
      setInvestAmount("");
      
      // 💰 Update balance in UI
      if (onAuthUpdate && auth) {
        onAuthUpdate({
          ...auth,
          cryptoBalance: (auth.cryptoBalance || 0) - parseFloat(investAmount)
        });
      }
      
      if (data.video) {
        setVideo(data.video);
      } else {
        loadVideo();
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Network error");
    } finally {
      setIsInvesting(false);
    }
  };

  const handleFollow = async () => {
    if (!auth) {
      navigate("/login");
      return;
    }

    // Check if user is the creator
    if (auth.id === video.creatorId._id) {
      setMessage("❌ You are the creator of this video so you are not allowed to do such actions");
      return;
    }

    // Optimistically update UI
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setEngagementLoading(true);
    
    try {
      const endpoint = wasFollowing ? "unfollow" : "follow";
      const res = await fetch(
        `${API_BASE}/api/engagement/${video.creatorId._id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        // Revert if failed
        setIsFollowing(wasFollowing);
        setMessage(`❌ ${data.message || "Failed to update follow status"}`);
      }
    } catch (error) {
      console.error(error);
      // Revert if failed
      setIsFollowing(wasFollowing);
      setMessage("❌ Network error");
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleLove = async () => {
    if (!auth) {
      navigate("/login");
      return;
    }

    // Check if user is the creator
    if (auth.id === video.creatorId._id) {
      setMessage("❌ You are the creator of this video so you are not allowed to do such actions");
      return;
    }

    // Optimistically update UI
    const wasLoved = isLoved;
    const wasHated = isHated;
    setIsLoved(true);
    setIsHated(false);
    setEngagementLoading(true);
    
    try {
      const res = await fetch(
        `${API_BASE}/api/engagement/video/${videoId}/love`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        // Update video with new counts from server
        setVideo(prev => ({
          ...prev,
          loveCount: data.loveCount || prev.loveCount,
          hateCount: data.hateCount || prev.hateCount
        }));
      } else {
        // Revert if failed
        setIsLoved(wasLoved);
        setIsHated(wasHated);
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      // Revert if failed
      setIsLoved(wasLoved);
      setIsHated(wasHated);
      setMessage("❌ Network error");
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleHate = async () => {
    if (!auth) {
      navigate("/login");
      return;
    }

    // Check if user is the creator
    if (auth.id === video.creatorId._id) {
      setMessage("❌ You are the creator of this video so you are not allowed to do such actions");
      return;
    }

    // Optimistically update UI
    const wasLoved = isLoved;
    const wasHated = isHated;
    setIsHated(true);
    setIsLoved(false);
    setEngagementLoading(true);
    
    try {
      const res = await fetch(
        `${API_BASE}/api/engagement/video/${videoId}/hate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        // Update video with new counts from server
        setVideo(prev => ({
          ...prev,
          loveCount: data.loveCount || prev.loveCount,
          hateCount: data.hateCount || prev.hateCount
        }));
      } else {
        // Revert if failed
        setIsLoved(wasLoved);
        setIsHated(wasHated);
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      // Revert if failed
      setIsLoved(wasLoved);
      setIsHated(wasHated);
      setMessage("❌ Network error");
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleUnlike = async () => {
    if (!auth) return;

    setEngagementLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/engagement/video/${videoId}/unlike`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const data = await res.json();
      if (res.ok) {
        setIsLoved(false);
        setIsHated(false);
        setMessage("✅ Reaction removed");
        setVideo({
          ...video,
          loveCount: data.loveCount,
          hateCount: data.hateCount
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEngagementLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="page-container">
        <div className="message-box">
          <p>Video not found</p>
          <button onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  const totalInvested = video.totalInvested || 0;

  return (
    <div className="page-container">
      <div className="watch-page-wrapper">
        {/* FIXED VIDEO SECTION */}
        <div className="video-fixed-section">
          <div className="video-player-container">
            <video
              className="video-player"
              controls
              autoPlay
              key={videoId}
            >
              <source
                src={`${API_BASE}${video.filePath}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* VIDEO TITLE */}
          <div className="video-title-bar">
            <h1 className="video-title">{video.title}</h1>
          </div>

          {/* HORIZONTAL BUTTONS AND STATS */}
          <div className="video-controls-bar">
            <div className="buttons-left-group">
              <button
                onClick={handleLove}
                disabled={engagementLoading}
                className={`btn-edge-icon ${isLoved ? "active" : ""}`}
                title="Love this video"
              >
                {isLoved ? "❤️" : "🤍"} <span className="count">{video.loveCount || 0}</span>
              </button>
              <button
                onClick={handleHate}
                disabled={engagementLoading}
                className={`btn-edge-icon ${isHated ? "active" : ""}`}
                title="Dislike this video"
              >
                👎 <span className="count">{video.hateCount || 0}</span>
              </button>
              <button
                onClick={handleFollow}
                disabled={engagementLoading}
                className={`btn-edge-icon-primary ${isFollowing ? "active" : ""}`}
                title={isFollowing ? "Unfollow" : "Follow"}
              >
                {isFollowing ? "✓ Following" : "➕ Follow"}
              </button>
            </div>

            <div className="stats-right-group">
              <span className="stat-item">💰 {(video.totalInvested || 0).toFixed(2)} SOCIORA</span>
              <span className="stat-item">💎 {video.uniqueInvestorCount || 0} Investors</span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT SECTION */}
        <div className="watch-page-scrollable">
          {/* CREATOR INFO */}
          <div className="creator-section">
            <div className="creator-info">
              <span className="creator-name">By {video.creatorId?.name || "Unknown Creator"}</span>
              <span className="video-date">{new Date(video.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* DESCRIPTION SECTION */}
          <div className="description-section">
            <h3>📝 Description</h3>
            <p className="video-description">{video.description}</p>
          </div>

          {/* INVESTMENT SECTION */}
          <div className="investment-section">
            <h3>💎 Invest in This Video</h3>
            <p>Earn returns when this video performs well</p>
            <div className="investment-input-group">
              <input
                type="number"
                placeholder="Amount (SOCIORA)"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                min="1"
                max="10000"
                disabled={isInvesting}
              />
              <button
                onClick={handleInvest}
                disabled={isInvesting || !investAmount}
                className="btn-invest"
              >
                {isInvesting ? "⏳ Investing..." : "🚀 Invest Now"}
              </button>
            </div>
            {video.minInvestment && (
              <p className="investment-note">
                Min: {video.minInvestment} SOCIORA | Expected ROI: {video.expectedROI}%
              </p>
            )}
          </div>

          {/* COMMENTS SECTION */}
          <div className="comments-section">
            <h3>💬 Comments ({comments.length})</h3>

            {auth && (
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                />
                <button type="submit" className="btn-comment">
                  Post Comment
                </button>
              </form>
            )}

            {!auth && (
              <p className="login-prompt">
                <button onClick={() => navigate("/login")}>Login</button> to comment
              </p>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment, idx) => (
                  <div key={idx} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{comment.userId?.name || "Anonymous"}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
