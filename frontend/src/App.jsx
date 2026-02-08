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
  const [myInvestments, setMyInvestments] = useState([]);

  const [uploadForm, setUploadForm] = useState({ title: "", description: "" });
  const [uploadFile, setUploadFile] = useState(null);
  const [investAmount, setInvestAmount] = useState(10);
  const [message, setMessage] = useState("");

  const getAuthHeaders = () => {
  const raw = localStorage.getItem("socioraAuth");
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  return { Authorization: `Bearer ${parsed.token}` };
};


  /* -------------------- LOADERS -------------------- */

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

  const fetchMyInvestments = async () => {
  const raw = localStorage.getItem("socioraAuth");
  if (!raw) return;

  const { token } = JSON.parse(raw);

  const res = await fetch(`${API_BASE}/api/transactions/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  setMyInvestments(Array.isArray(data) ? data : []);
};


  useEffect(() => {
    loadVideos();
    loadLedger();
  }, []);

  useEffect(() => {
    fetchMyInvestments();
  }, [auth]);

  /* -------------------- AUTH -------------------- */

  const handleSignup = async (e) => {
    e.preventDefault();
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

    setMessage("Signup successful! Please login.");
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
  await fetchMyInvestments();   
  setMessage("Logged in!");
};


  const handleLogout = () => {
    localStorage.removeItem("socioraAuth");
    setAuth(null);
    setMyInvestments([]);
  };

  /* -------------------- VIDEO UPLOAD -------------------- */

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!uploadFile) {
      setMessage("Please select a video");
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

  /* -------------------- INVEST -------------------- */

  const handleInvest = async (video) => {
  setMessage("");

  const res = await fetch(`${API_BASE}/api/transactions/invest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      videoId: video._id,
      toCreator: video.creatorId,
      amount: Number(investAmount)
    })
  });

  const data = await res.json();
  if (!res.ok) {
    setMessage(data.message || "Investment failed");
    return;
  }

  setMessage("Investment recorded!");
  await fetchMyInvestments();
  loadLedger();

};

  /* -------------------- TOTALS -------------------- */

  const totalInvested = ledger
    .filter(tx => !tx.transactionType)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDistributed = ledger
    .filter(tx => tx.transactionType === "DISTRIBUTION")
    .reduce((sum, tx) => sum + tx.amount, 0);

  /* -------------------- UI -------------------- */

  return (
    <div className="page">
      <header>
        <h1>Sociora MVP</h1>
        <p>Invest in creators with transparent transactions.</p>
      </header>

      {message && <div className="message">{message}</div>}

      {/* AUTH */}
      <section className="card">
        <h2>Auth</h2>
        <div className="grid">
          <form onSubmit={handleSignup}>
            <h3>Signup</h3>
            <input placeholder="Name" required
              value={signupForm.name}
              onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
            />
            <input placeholder="Email" type="email" required
              value={signupForm.email}
              onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
            />
            <input placeholder="Password" type="password" required
              value={signupForm.password}
              onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
            />
            <select
              value={signupForm.role}
              onChange={e => setSignupForm({ ...signupForm, role: e.target.value })}
            >
              <option value="creator">Creator</option>
              <option value="user">User</option>
            </select>
            <button>Create account</button>
          </form>

          <form onSubmit={handleLogin}>
            <h3>Login</h3>
            <input placeholder="Email" type="email" required
              value={loginForm.email}
              onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
            />
            <input placeholder="Password" type="password" required
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button>Login</button>
            {auth && (
              <button type="button" className="secondary" onClick={handleLogout}>
                Logout
              </button>
            )}
          </form>
        </div>
      </section>

      {/* UPLOAD */}
      <section className="card">
        <h2>Upload a Video</h2>
        <form onSubmit={handleUpload} className="stack">
          <input placeholder="Title" required
            value={uploadForm.title}
            onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
          />
          <textarea placeholder="Description" required
            value={uploadForm.description}
            onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
          />
          <input type="file" accept="video/*" required
            onChange={e => setUploadFile(e.target.files[0])}
          />
          <button>Upload</button>
        </form>
      </section>

      {/* VIDEOS */}
      <section className="card">
        <h2>Videos</h2>
        <label>
          Invest amount (USD)
          <input
            type="number"
            min="1"
            value={investAmount}
            onChange={e => setInvestAmount(e.target.value)}
          />
        </label>

        {videos.map(video => (
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
      </section>

      {/* MY INVESTMENTS */}
<section className="card">
  <h2>My Investments</h2>

  {myInvestments.length === 0 && <p>No investments yet.</p>}

  <ul className="ledger">
    {myInvestments.map((tx) => (
      <li key={tx.txId}>
        <strong>{tx.amount} USD</strong>{" "}
        invested in{" "}
        <strong>
          {tx.videoId ? "Video" : "Unknown Video"}
        </strong>{" "}
        on {new Date(tx.timestamp).toLocaleString()}
      </li>
    ))}
  </ul>
</section>


      {/* TRANSPARENCY */}
      <section className="card">
        <h2>Transparency Dashboard</h2>
        <p><strong>Total Invested:</strong> {totalInvested} USD</p>
        <p><strong>Total Distributed:</strong> {totalDistributed} USD</p>

        <ul className="ledger">
          {ledger.map(tx => (
            <li key={tx.txId}>
              <strong>{tx.amount} USD</strong>{" "}
              from {tx.fromUser === "platform" ? "Platform" : "User"}{" "}
              to {tx.toCreator === "platform" ? "Platform" : "Creator"}{" "}
              on {new Date(tx.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default App;
