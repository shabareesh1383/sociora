import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Navbar = ({ auth, logout, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  const handleUploadClick = () => {
    if (!auth) {
      navigate("/login");
      return;
    }

    if (auth.role === "investor") {
      setShowRoleModal(true);
      return;
    }

    // User is creator
    navigate("/upload");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">Sociora</span>
        </Link>

        {/* SEARCH BAR */}
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-box"
          />
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="navbar-actions">
          {/* GLOBAL UPLOAD BUTTON - Available to everyone */}
          <button 
            onClick={handleUploadClick}
            className="btn-upload"
          >
            📤 Upload
          </button>

          {/* TEMPLATE MARKETPLACE - Available to everyone */}
          <Link to="/templates" className="btn-nav-link">
            📦 Templates
          </Link>

          {auth ? (
            <>
              {/* Investments link */}
              <Link to="/investments" className="btn-nav-link">
                📊 Investments
              </Link>

              {/* Wallet link */}
              <Link to="/wallet" className="btn-nav-link">
                💰 Wallet
              </Link>

              {/* BALANCE DISPLAY */}
              <div className="balance-display">
                <span className="balance-coins">🪙 {(auth.cryptoBalance || 0).toFixed(2)}</span>
              </div>

              {/* User dropdown */}
              <div className="user-dropdown">
                <button
                  className="btn-profile"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  👤 {auth.email?.split("@")[0]}
                </button>

                {showDropdown && (
                  <div className="dropdown-menu">
                    {auth.role === "creator" && (
                      <>
                        <Link to="/creator-dashboard" className="dropdown-item">
                          📈 Creator Dashboard
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}
                    {auth.role === "investor" && (
                      <>
                        <Link to="/investor-dashboard" className="dropdown-item">
                          📊 Investor Dashboard
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}
                    <Link to="/profile" className="dropdown-item">
                      Profile
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login button for guests */}
              <Link to="/login" className="btn-signin">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ROLE UPGRADE MODAL - For investors trying to upload */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Become a Creator</h2>
            <p>Your account is currently set as an <strong>Investor</strong>.</p>
            <p>To upload videos, you need to create or upgrade to a <strong>Creator</strong> account.</p>
            
            <div className="modal-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowRoleModal(false);
                  navigate("/profile");
                }}
              >
                Upgrade to Creator
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
