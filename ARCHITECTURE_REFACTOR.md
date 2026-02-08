# 🎬 Sociora MVP - Architecture Refactoring Guide

## Current Status

### ✅ COMPLETED (Backend)

#### Video Model Enhancement
- Added `isPublic: { type: Boolean, default: true }` field
- **File**: `backend/models/Video.js`

#### API Endpoints Refactored

**POST /api/videos** (Upload)
- ✅ Validates `req.user.role === "creator"` → 403 error if not
- ✅ Sets `isPublic: true` by default
- ✅ Returns error: "Only creators can upload videos"
- **File**: `backend/routes/videos.js`

**GET /api/videos/public** (NEW - Main Homepage)
- ✅ NO authentication required
- ✅ Returns ONLY videos where `isPublic: true`
- ✅ Sorted by `createdAt` descending (newest first)
- ✅ Includes creator info (name, email)
- ✅ Calculates total investment per video
- **File**: `backend/routes/videos.js`

**GET /api/videos/public/discover** (Kept for backward compatibility)
- ✅ Still works (sorts by investment, then recency)

**GET /api/videos/search** (Public search)
- ✅ Case-insensitive title search
- ✅ No auth required

### ✅ COMPLETED (Frontend)

#### Critical Fix
- Updated `loadPublicVideos()` to fetch from `/api/videos/public`
- Frontend now loads public videos correctly on page load

#### Build Status
- ✅ Frontend builds successfully with react-router-dom installed
- ✅ No errors or warnings

---

## 🚀 NEXT STEPS TO IMPLEMENT

### STEP 1: Create Page Components

Create these files in `frontend/src/pages/`:

#### HomePage.jsx
```jsx
// Fetch public videos from GET /api/videos/public
// Display in grid layout
// No auth UI, no upload, no investments, no transparency
// Responsive grid: min-width 300px
```

#### LoginPage.jsx
```jsx
// Simple login form
// Redirect to / after successful login
```

#### SignupPage.jsx
```jsx
// Simple signup form
// Navigate to /login after success
```

#### UploadPage.jsx
```jsx
// Creator-only page
// Full upload form (title, description, file)
// Redirect to / if user.role !== "creator"
// Show: "Create a creator account to upload videos" if unauthorized
```

#### InvestmentsPage.jsx
```jsx
// Protected route (require login)
// Display:
//   - My Investments (from GET /api/transactions/me)
//   - Transparency Dashboard (from GET /api/transactions)
// Fetch on page load
// Auto-refresh every 5 seconds
```

#### ProfilePage.jsx
```jsx
// Protected route (require login)
// Display:
//   - User email
//   - User role
//   - Logout button
//   - Videos uploaded by this user (if creator)
```

---

### STEP 2: Create Navbar Component

Create `frontend/src/components/Navbar.jsx`:

**When NOT logged in:**
- Logo (clickable, goes to /)
- Search bar (in center)
- "Login" button (right)

**When logged in (User role):**
- Logo (clickable)
- Search bar
- "Investments" link
- User dropdown (email) → Logout option inside

**When logged in (Creator role):**
- Logo
- Search bar
- "Upload" button
- "Investments" link
- User dropdown (email) → Logout option

---

### STEP 3: Update App.jsx

Replace single-page App.jsx with Router structure:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [message, setMessage] = useState("");

  return (
    <BrowserRouter>
      <Navbar auth={auth} logout={logout} />
      {message && <div className="message">{message}</div>}
      
      <Routes>
        <Route path="/" element={<HomePage auth={auth} />} />
        <Route path="/login" element={<LoginPage setAuth={setAuth} />} />
        <Route path="/signup" element={<SignupPage setAuth={setAuth} />} />
        <Route path="/upload" element={auth?.role === "creator" ? <UploadPage /> : <Navigate to="/" />} />
        <Route path="/investments" element={auth ? <InvestmentsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={auth ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### STEP 4: Update main.jsx

Ensure main.jsx loads App with Router:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## 🎨 UI Architecture

### Current Issue (to be fixed)
- ❌ Home page shows auth forms, upload, investments, transparency
- ❌ Upload button visible to everyone
- ❌ Login/signup visible after login
- ❌ No proper page structure

### After Refactor (YouTube-like)
- ✅ Home page shows ONLY public videos
- ✅ Clean navbar with role-based buttons
- ✅ Auth hidden until needed (separate /login, /signup routes)
- ✅ Upload visible only to creators
- ✅ Investments visible only to logged-in users
- ✅ Clean routing between pages

---

## 📊 Data Flow

### Public Video Display
```
App loads
  → GET /api/videos/public (NO AUTH)
  → Response: [{ _id, title, description, creatorId, isPublic, totalInvestment }...]
  → Display in HomePage
```

### After Login
```
User logs in
  → Auth stored in localStorage
  → Navbar shows user email + role
  → User can access /investments, /upload (if creator), /profile
  → Data persists (no re-login on refresh)
```

### Upload New Video
```
Creator clicks Upload
  → Navigate to /upload
  → Submit form to POST /api/videos
  → Sets isPublic: true automatically
  → Video appears in GET /api/videos/public immediately
  → HomePage refreshes (5s auto-refresh)
```

---

## ✅ Existing APIs (DO NOT BREAK)

These continue to work as-is:

- ✅ POST /api/auth/signup
- ✅ POST /api/auth/login
- ✅ GET /api/videos (internal, authenticated)
- ✅ POST /api/transactions/invest
- ✅ GET /api/transactions (public ledger)
- ✅ GET /api/transactions/me (user investments)
- ✅ Revenue distribution service
- ✅ Blockchain/ledger integration

---

## 🔧 Implementation Checklist

- [ ] Create HomePage.jsx (fetch /api/videos/public, display grid)
- [ ] Create LoginPage.jsx (form + redirect)
- [ ] Create SignupPage.jsx (form + redirect)
- [ ] Create UploadPage.jsx (role-protected)
- [ ] Create InvestmentsPage.jsx (investments + transparency)
- [ ] Create ProfilePage.jsx (user info + logout)
- [ ] Create Navbar.jsx (role-based UI)
- [ ] Update App.jsx (Router structure)
- [ ] Update index.css (page-specific styles)
- [ ] Test all routes
- [ ] Test auth flows (login, logout, role-based access)
- [ ] Verify public videos load correctly
- [ ] Verify no breaking changes to existing APIs
- [ ] Test real-time updates (5s refresh)

---

## 📝 Summary

**Backend**: ✅ Ready (public videos API + role validation)
**Frontend**: 🔄 In Progress (needs router + page components)
**Status**: Safe to implement - no breaking changes to existing working features
