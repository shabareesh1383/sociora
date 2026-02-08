import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SignupPage = ({ setMessage, onAuthUpdate }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investor");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("❌ Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "❌ Signup failed");
        setLoading(false);
        return;
      }

      // ✅ AUTO-LOGIN: Store token and auth data
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("socioraAuth", JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        cryptoBalance: data.cryptoBalance,
        walletAddress: data.walletAddress,
        subscriptionTier: data.subscriptionTier
      }));

      // Update app auth state
      if (onAuthUpdate) {
        onAuthUpdate({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          cryptoBalance: data.cryptoBalance,
          walletAddress: data.walletAddress,
          subscriptionTier: data.subscriptionTier
        });
      }

      setMessage(data.message); // Show "Account created! You received 100 SOCIORA coins"
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      setMessage("❌ Network error. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Create Sociora Account</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="investor">Investor (User)</option>
            <option value="creator">Creator</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
