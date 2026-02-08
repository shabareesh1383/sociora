import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CreateTemplate = ({ auth, setMessage }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "education",
    price: 50,
    features: [],
    licenseTerms: "",
    customFields: []
  });
  const [featureInput, setFeatureInput] = useState("");
  const [customFieldInput, setCustomFieldInput] = useState("");

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const removeFeature = (idx) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const addCustomField = () => {
    if (customFieldInput.trim()) {
      setForm(prev => ({
        ...prev,
        customFields: [...prev.customFields, { name: customFieldInput.trim(), type: "text" }]
      }));
      setCustomFieldInput("");
    }
  };

  const removeCustomField = (idx) => {
    setForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      setMessage("❌ Name and description are required");
      return;
    }

    if (form.features.length === 0) {
      setMessage("❌ Add at least one feature");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.message || "Failed to create template"}`);
        return;
      }

      setMessage("✅ Template created successfully!");
      setTimeout(() => navigate("/templates"), 2000);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <section className="create-template-section">
        <h1>📦 Create Template</h1>
        <p className="section-subtitle">Monetize your video templates and earn SOCIORA</p>

        <form className="create-template-form" onSubmit={handleSubmit}>
          {/* BASIC INFO */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Template Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., YouTube Intro Sequence"
                value={form.name}
                onChange={handleFieldChange}
                maxLength="100"
              />
              <p className="char-count">{form.name.length}/100</p>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description*</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe what this template does, what tools it uses, and who it's for..."
                value={form.description}
                onChange={handleFieldChange}
                rows="4"
                maxLength="500"
              />
              <p className="char-count">{form.description.length}/500</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleFieldChange}
                >
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="vlog">Vlog</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (SOCIORA)*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="10"
                  max="10000"
                  value={form.price}
                  onChange={handleFieldChange}
                />
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className="form-section">
            <h2>Features & Customization</h2>
            <p className="section-subtitle">What features does this template include?</p>

            <div className="form-group">
              <div className="add-item">
                <input
                  type="text"
                  placeholder="Enter a feature (e.g., Customizable text overlays)"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <button type="button" className="btn-add" onClick={addFeature}>
                  ➕ Add Feature
                </button>
              </div>

              <div className="feature-list">
                {form.features.map((feat, idx) => (
                  <div key={idx} className="feature-item">
                    <span>✓ {feat}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeFeature(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {form.features.length === 0 && (
                <p className="warning">⚠️ Add at least one feature</p>
              )}
            </div>
          </div>

          {/* CUSTOMIZABLE FIELDS */}
          <div className="form-section">
            <h2>Customizable Fields</h2>
            <p className="section-subtitle">What can buyers customize? (e.g., Text, Colors, Music)</p>

            <div className="form-group">
              <div className="add-item">
                <input
                  type="text"
                  placeholder="Enter custom field (e.g., Background Color)"
                  value={customFieldInput}
                  onChange={(e) => setCustomFieldInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomField())}
                />
                <button type="button" className="btn-add" onClick={addCustomField}>
                  ➕ Add Field
                </button>
              </div>

              <div className="field-list">
                {form.customFields.map((field, idx) => (
                  <div key={idx} className="field-item">
                    <span>🔧 {field.name}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeCustomField(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LICENSE TERMS */}
          <div className="form-section">
            <h2>License Terms</h2>

            <div className="form-group">
              <label htmlFor="licenseTerms">License Agreement</label>
              <textarea
                id="licenseTerms"
                name="licenseTerms"
                placeholder="Specify any license restrictions, usage terms, or commercial rights..."
                value={form.licenseTerms}
                onChange={handleFieldChange}
                rows="3"
              />
            </div>
          </div>

          {/* PRICING INFO */}
          <div className="pricing-info">
            <h3>💰 Revenue Breakdown</h3>
            <div className="breakdown">
              <div className="breakdown-item">
                <span>You Earn:</span>
                <span className="amount">{(form.price * 0.8).toFixed(0)} SOCIORA (80%)</span>
              </div>
              <div className="breakdown-item">
                <span>Platform Fee:</span>
                <span className="amount">{(form.price * 0.2).toFixed(0)} SOCIORA (20%)</span>
              </div>
              <div className="breakdown-item total">
                <span>Buyer Pays:</span>
                <span className="amount">{form.price} SOCIORA</span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "✅ Create Template"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/templates")}
            >
              ← Back to Marketplace
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateTemplate;
