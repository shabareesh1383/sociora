import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LoginPage = ({ setAuth, setMessage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("❌ Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "❌ Login failed");
        setLoading(false);
        return;
      }

      // Store auth object and token separately
      const authData = {
        token: data.token,
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        cryptoBalance: data.cryptoBalance,
        walletAddress: data.walletAddress,
        subscriptionTier: data.subscriptionTier
      };
      localStorage.setItem("socioraAuth", JSON.stringify(authData));
      localStorage.setItem("authToken", data.token);
      setAuth(authData);
      setMessage("✅ Logged in successfully!");
      setTimeout(() => navigate("/"), 500);
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
        <h1>Login to Sociora</h1>

        <form onSubmit={handleSubmit} className="auth-form">
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
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup">Create one here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
