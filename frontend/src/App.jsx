import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getStoredAuth = () => {
  const raw = localStorage.getItem("socioraAuth");
  return raw ? JSON.parse(raw) : null;
};

const App = () => {
  const [auth, setAuth] = useState(getStoredAuth());
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator"
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [videos, setVideos] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "" });
  const [uploadFile, setUploadFile] = useState(null);
  const [investAmount, setInvestAmount] = useState(10);
  const [message, setMessage] = useState("");

  const authHeaders = auth ? { Authorization: `Bearer ${auth.token}` } : {};

  const loadVideos = async () => {
    const res = await fetch(`${API_BASE}/api/videos`);
    const data = await res.json();
    setVideos(data);
  };

  const loadLedger = async () => {
    const res = await fetch(`${API_BASE}/api/transactions`);
    const data = await res.json();
    setLedger(data);
  };

  useEffect(() => {
    loadVideos();
    loadLedger();
  }, []);

  const handleSignup = async (event) => {
    event.preventDefault();
    setMessage("");

    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupForm)
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Signup failed");
      return;
    }

    setMessage("Signup successful! Now login.");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm)
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Login failed");
      return;
    }

    localStorage.setItem("socioraAuth", JSON.stringify(data));
    setAuth(data);
    setMessage("Logged in!");
  };

  const handleLogout = () => {
    localStorage.removeItem("socioraAuth");
    setAuth(null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!uploadFile) {
      setMessage("Please choose a video file");
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);
    formData.append("video", uploadFile);

    const res = await fetch(`${API_BASE}/api/videos`, {
      method: "POST",
      headers: authHeaders,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Upload failed");
      return;
    }

    setMessage("Video uploaded!");
    setUploadForm({ title: "", description: "" });
    setUploadFile(null);
    loadVideos();
  };

  const handleInvest = async (video) => {
    setMessage("");

    const res = await fetch(`${API_BASE}/api/transactions/invest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({
        videoId: video._id,
        toCreator: video.creatorId,
        amount: investAmount
      })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Investment failed");
      return;
    }

    setLedger(data.ledger);
    setMessage("Investment recorded on mock blockchain!");
  };

  return (
    <div className="page">
      <header>
        <h1>Sociora MVP</h1>
        <p>Invest in creators with transparent transactions.</p>
      </header>

      {message && <div className="message">{message}</div>}

      <section className="card">
        <h2>Auth</h2>
        <div className="grid">
          <form onSubmit={handleSignup}>
            <h3>Signup</h3>
            <input
              placeholder="Name"
              value={signupForm.name}
              onChange={(event) =>
                setSignupForm({ ...signupForm, name: event.target.value })
              }
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={signupForm.email}
              onChange={(event) =>
                setSignupForm({ ...signupForm, email: event.target.value })
              }
              required
            />
            <input
              placeholder="Password"
              type="password"
              value={signupForm.password}
              onChange={(event) =>
                setSignupForm({ ...signupForm, password: event.target.value })
              }
              required
            />
            <select
              value={signupForm.role}
              onChange={(event) =>
                setSignupForm({ ...signupForm, role: event.target.value })
              }
            >
              <option value="creator">Creator</option>
              <option value="user">User</option>
            </select>
            <button type="submit">Create account</button>
          </form>

          <form onSubmit={handleLogin}>
            <h3>Login</h3>
            <input
              placeholder="Email"
              type="email"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm({ ...loginForm, email: event.target.value })
              }
              required
            />
            <input
              placeholder="Password"
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm({ ...loginForm, password: event.target.value })
              }
              required
            />
            <button type="submit">Login</button>
            {auth && (
              <button type="button" className="secondary" onClick={handleLogout}>
                Logout
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="card">
        <h2>Upload a Video</h2>
        <form onSubmit={handleUpload} className="stack">
          <input
            placeholder="Title"
            value={uploadForm.title}
            onChange={(event) =>
              setUploadForm({ ...uploadForm, title: event.target.value })
            }
            required
          />
          <textarea
            placeholder="Description"
            value={uploadForm.description}
            onChange={(event) =>
              setUploadForm({ ...uploadForm, description: event.target.value })
            }
            required
          />
          <input
            type="file"
            accept="video/*"
            onChange={(event) => setUploadFile(event.target.files[0])}
            required
          />
          <button type="submit">Upload</button>
        </form>
      </section>

      <section className="card">
        <h2>Videos</h2>
        <div className="stack">
          <label>
            Invest amount (USD)
            <input
              type="number"
              min="1"
              value={investAmount}
              onChange={(event) => setInvestAmount(event.target.value)}
            />
          </label>
          {videos.length === 0 && <p>No videos yet.</p>}
          {videos.map((video) => (
            <div key={video._id} className="video-row">
              <div>
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
              <button onClick={() => handleInvest(video)} disabled={!auth}>
                {auth ? "Invest" : "Login to invest"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Transparency Dashboard</h2>
        {ledger.length === 0 && <p>No transactions yet.</p>}
        <ul className="ledger">
          {ledger.map((tx) => (
            <li key={tx.txId}>
              <strong>{tx.amount} USD</strong> from {tx.fromUser} to {tx.toCreator} on
              {" "}{new Date(tx.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default App;
