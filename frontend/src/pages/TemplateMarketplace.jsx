import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TemplateMarketplace = ({ auth, setMessage }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, [category]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);

      const res = await fetch(`${API_BASE}/api/templates?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (template) => {
    if (!auth) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/templates/${template._id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.message || "Purchase failed"}`);
        return;
      }

      setMessage(`✅ Template purchased! Transaction: ${data.transaction.transactionHash}`);
      setShowPurchaseModal(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error(error);
      setMessage("❌ Purchase failed");
    }
  };

  return (
    <div className="page-container">
      <section className="marketplace-section">
        <h1>📦 Template Marketplace</h1>

        {/* CATEGORY FILTER */}
        <div className="category-filter">
          <button
            className={`cat-btn ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            All Templates
          </button>
          <button
            className={`cat-btn ${category === "education" ? "active" : ""}`}
            onClick={() => setCategory("education")}
          >
            Education
          </button>
          <button
            className={`cat-btn ${category === "business" ? "active" : ""}`}
            onClick={() => setCategory("business")}
          >
            Business
          </button>
          <button
            className={`cat-btn ${category === "entertainment" ? "active" : ""}`}
            onClick={() => setCategory("entertainment")}
          >
            Entertainment
          </button>
          <button
            className={`cat-btn ${category === "gaming" ? "active" : ""}`}
            onClick={() => setCategory("gaming")}
          >
            Gaming
          </button>
          <button
            className={`cat-btn ${category === "music" ? "active" : ""}`}
            onClick={() => setCategory("music")}
          >
            Music
          </button>
        </div>

        {/* TEMPLATES GRID */}
        {loading ? (
          <div className="loading">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <p>No templates available in this category</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template._id} className="template-card">
                <div className="template-preview">
                  <div className="preview-icon">📋</div>
                </div>

                <div className="template-content">
                  <h3>{template.name}</h3>
                  <p className="description">{template.description}</p>

                  <div className="template-meta">
                    <span className="creator">By {template.creatorId.name}</span>
                    <span className="category">{template.category}</span>
                  </div>

                  <div className="template-stats">
                    <div className="stat">
                      <span className="label">Rating:</span>
                      <span className="value">⭐ {template.rating?.toFixed(1) || "N/A"}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Downloads:</span>
                      <span className="value">{template.downloads}</span>
                    </div>
                  </div>

                  <div className="template-features">
                    <p className="features-label">Features:</p>
                    {template.features.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="feature-badge">✓ {feat}</span>
                    ))}
                    {template.features.length > 3 && (
                      <span className="feature-more">+{template.features.length - 3} more</span>
                    )}
                  </div>

                  <div className="template-footer">
                    <span className="price">{template.price} SOCIORA</span>
                    <div className="actions">
                      <button
                        className="btn-info"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        ℹ️ Info
                      </button>
                      <button
                        className="btn-purchase"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPurchaseModal(true);
                        }}
                      >
                        💳 Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INFO MODAL */}
        {selectedTemplate && !showPurchaseModal && (
          <div className="modal-overlay" onClick={() => setSelectedTemplate(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedTemplate(null)}>✕</button>

              <h2>{selectedTemplate.name}</h2>
              <p className="modal-description">{selectedTemplate.description}</p>

              <div className="modal-details">
                <div className="detail">
                  <span className="label">Creator:</span>
                  <span className="value">{selectedTemplate.creatorId.name}</span>
                </div>
                <div className="detail">
                  <span className="label">Category:</span>
                  <span className="value">{selectedTemplate.category}</span>
                </div>
                <div className="detail">
                  <span className="label">Price:</span>
                  <span className="value">{selectedTemplate.price} SOCIORA</span>
                </div>
                <div className="detail">
                  <span className="label">Rating:</span>
                  <span className="value">⭐ {selectedTemplate.rating?.toFixed(1) || "N/A"}</span>
                </div>
              </div>

              <div className="modal-features">
                <h3>Features & Customization</h3>
                <ul>
                  {selectedTemplate.features.map((feat, idx) => (
                    <li key={idx}>✓ {feat}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-license">
                <h3>License Terms</h3>
                <p>{selectedTemplate.licenseTerms || "No specific terms"}</p>
              </div>

              <button
                className="btn-purchase-modal"
                onClick={() => {
                  setShowPurchaseModal(true);
                }}
              >
                💳 Purchase for {selectedTemplate.price} SOCIORA
              </button>
            </div>
          </div>
        )}

        {/* PURCHASE CONFIRMATION MODAL */}
        {showPurchaseModal && selectedTemplate && (
          <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>✕</button>

              <h2>Confirm Purchase</h2>
              <p className="confirmation-text">
                Are you sure you want to purchase <strong>{selectedTemplate.name}</strong>?
              </p>

              <div className="purchase-details">
                <div className="detail">
                  <span className="label">Template:</span>
                  <span className="value">{selectedTemplate.name}</span>
                </div>
                <div className="detail">
                  <span className="label">Price:</span>
                  <span className="value">{selectedTemplate.price} SOCIORA</span>
                </div>
                <div className="detail">
                  <span className="label">Creator Earnings:</span>
                  <span className="value">{(selectedTemplate.price * 0.8).toFixed(2)} SOCIORA</span>
                </div>
                <div className="detail">
                  <span className="label">Platform Fee:</span>
                  <span className="value">{(selectedTemplate.price * 0.2).toFixed(2)} SOCIORA</span>
                </div>
              </div>

              <p className="note">
                💡 This transaction will be recorded on the blockchain for transparency.
              </p>

              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={() => handlePurchase(selectedTemplate)}
                >
                  ✓ Confirm Purchase
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATOR SECTION */}
        {auth && auth.role === "creator" && (
          <div className="creator-section">
            <h2>📦 Create Your Template</h2>
            <p>Monetize your expertise by creating and selling video templates</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/create-template")}
            >
              ➕ Create Template
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default TemplateMarketplace;
