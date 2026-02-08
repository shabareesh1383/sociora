import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import WatchPage from "./pages/WatchPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadPage from "./pages/UploadPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import ProfilePage from "./pages/ProfilePage";
import CreatorDashboard from "./pages/CreatorDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import WalletPage from "./pages/WalletPage";
import TemplateMarketplace from "./pages/TemplateMarketplace";
import CreateTemplate from "./pages/CreateTemplate";

const getStoredAuth = () => {
  const raw = localStorage.getItem("socioraAuth");
  return raw ? JSON.parse(raw) : null;
};

const ProtectedRoute = ({ element, auth }) => {
  return auth ? element : <Navigate to="/login" replace />;
};

const App = () => {
  const [auth, setAuth] = useState(getStoredAuth());
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogout = () => {
    localStorage.removeItem("socioraAuth");
    setAuth(null);
    setMessage("✅ Logged out successfully!");
  };

  const handleAuthUpdate = (updatedAuth) => {
    setAuth(updatedAuth);
  };

  return (
    <BrowserRouter>
      <div className="app">
        {/* Navbar persistent across all pages */}
        <Navbar 
          auth={auth} 
          logout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Message display */}
        {message && <div className="message">{message}</div>}

        {/* Routes */}
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                auth={auth}
                searchQuery={searchQuery}
                setMessage={setMessage}
              />
            } 
          />

          <Route 
            path="/watch/:videoId" 
            element={
              <WatchPage 
                auth={auth}
                setMessage={setMessage}
                onAuthUpdate={handleAuthUpdate}
              />
            } 
          />

          <Route 
            path="/login" 
            element={
              auth ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage 
                  setAuth={setAuth}
                  setMessage={setMessage}
                />
              )
            } 
          />

          <Route 
            path="/signup" 
            element={
              auth ? (
                <Navigate to="/" replace />
              ) : (
                <SignupPage 
                  setMessage={setMessage}
                  onAuthUpdate={handleAuthUpdate}
                />
              )
            } 
          />

          <Route 
            path="/upload" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  auth?.role === "creator" ? (
                    <UploadPage 
                      auth={auth}
                      setMessage={setMessage}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            } 
          />

          <Route 
            path="/investments" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  <InvestmentsPage 
                    auth={auth}
                    setMessage={setMessage}
                  />
                }
              />
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  <ProfilePage 
                    auth={auth}
                    setMessage={setMessage}
                    onLogout={handleLogout}
                    onAuthUpdate={handleAuthUpdate}
                  />
                }
              />
            } 
          />

          <Route 
            path="/creator-dashboard" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  auth?.role === "creator" ? (
                    <CreatorDashboard 
                      auth={auth}
                      setMessage={setMessage}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            } 
          />

          <Route 
            path="/investor-dashboard" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  <InvestorDashboard 
                    auth={auth}
                    setMessage={setMessage}
                  />
                }
              />
            } 
          />

          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  <WalletPage 
                    auth={auth}
                    setMessage={setMessage}
                  />
                }
              />
            } 
          />

          <Route 
            path="/templates" 
            element={
              <TemplateMarketplace 
                auth={auth}
                setMessage={setMessage}
              />
            } 
          />

          <Route 
            path="/create-template" 
            element={
              <ProtectedRoute
                auth={auth}
                element={
                  auth?.role === "creator" ? (
                    <CreateTemplate 
                      auth={auth}
                      setMessage={setMessage}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            } 
          />

          {/* 404 - Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
