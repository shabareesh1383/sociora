# Phase 2 Quick Reference & Testing Guide

## 🚀 Quick Start

```bash
# Terminal 1 - Backend
cd backend
npm start
# Runs on http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## 📱 App Structure

```
App.jsx (BrowserRouter)
├── Navbar (Top navigation - always visible)
└── Routes
    ├── / → HomePage (public)
    ├── /login → LoginPage
    ├── /signup → SignupPage
    ├── /upload → UploadPage (creator-only)
    ├── /investments → InvestmentsPage (protected)
    ├── /profile → ProfilePage (protected)
    └── /* → Redirects to /
```

## 🧪 Test Scenarios

### Scenario 1: First Time User
```
1. Visit http://localhost:5173/
   → See public videos
2. Click "Sign In" button (top right)
   → Navigate to /login
3. Click "Sign Up" link
   → Navigate to /signup
4. Fill: Name, Email, Password
5. Choose Role: "Investor" or "Creator"
6. Submit
   → Message: "Account created! Redirecting to login..."
   → Auto-navigate to /login
7. Enter email & password
   → Message: "✅ Logged in successfully!"
   → Auto-navigate to /
   → Navbar changes: "Sign In" → "Upload" (if creator) + "Investments" + Profile dropdown
```

### Scenario 2: Browse Videos (Logged Out)
```
1. Visit /
   → See public videos in grid
2. Type in search box
   → Videos filter in real-time (case-insensitive)
3. Hover over video
   → NO "Invest" button visible (logged out)
4. Refresh page (every 5s auto)
   → Videos update if new ones added
```

### Scenario 3: Invest in Video (Must Be Logged In)
```
1. Login as investor
2. Visit /
3. See "Invest" button on each video
4. Click "Invest"
   → Modal/form appears (define invest amount)
   → Submit
   → Message: "✅ Investment of $X recorded!"
   → Auto-refresh videos & data
5. Click "Investments" link
   → See your investment in "My Investments" section
```

### Scenario 4: Creator Upload Video
```
1. Create account with role "Creator"
2. Login
3. See "Upload" button in navbar
4. Click "Upload"
   → Navigate to /upload
5. Fill form:
   - Video Title
   - Description
   - Select video file
6. Submit
   → Message: "✅ Video uploaded successfully!"
   → Auto-navigate to /
   → Your video appears in feed with isPublic=true
```

### Scenario 5: Non-Creator Trying to Upload
```
1. Create account with role "Investor"
2. Login
3. NO "Upload" button in navbar
4. Manually visit /upload
   → Warning message: "⚠️ Only creators can upload videos"
   → Button: "Go Home"
5. Click "Go Home"
   → Redirects to /
```

### Scenario 6: View Investments & Ledger
```
1. Login
2. Click "Investments" link
3. See two sections:
   
   SECTION 1: My Investments
   - Shows only YOUR investments
   - Columns: Video Title, Creator, Amount, Date
   - Auto-refreshes every 5s
   
   SECTION 2: Transparency Dashboard
   - Shows ALL platform transactions
   - Columns: Type (Investment/Distribution), Amount, Participant, Date
   - Investment badges vs Distribution badges
   
   STATS: Total Invested + Total Distributed
```

### Scenario 7: User Profile & Logout
```
1. Login
2. Click user dropdown (top right after login)
   → See: Email prefix + "Profile" link + "Logout" option
3. Click "Profile"
   → Navigate to /profile
4. See: Email, Account Type badge
5. Click "Logout"
   → localStorage cleared
   → Message: "✅ Logged out successfully!"
   → Navbar resets to "Sign In" button
   → Back on /
```

### Scenario 8: Protected Routes
```
1. Logged OUT
2. Try /investments
   → Redirects to /login automatically
3. Try /profile
   → Redirects to /login automatically
4. Try /upload
   → Redirects to /login automatically
```

### Scenario 9: Search Functionality
```
1. Visit /
2. See search bar in Navbar
3. Type "test"
   → Homepage videos filter in real-time
   → Only videos with "test" in title show
4. Clear search
   → All videos show again
5. Search is case-insensitive
```

### Scenario 10: Real-Time Refresh
```
1. Open /investments page
2. Open second browser tab also at /investments
3. In tab 1, add investment to video
4. Watch tab 2 auto-refresh (every 5s)
   → New investment appears without manual refresh
```

## 🔍 Error Handling Tests

### Test Invalid Login
```
1. Go to /login
2. Enter wrong password
   → Message: "❌ Login failed" (or specific error)
3. Try again with correct password
   → Success
```

### Test Duplicate Email Signup
```
1. Create account: test@example.com
2. Try creating another with same email
   → Message: "❌ Email already exists"
```

### Test Session Expiry
```
1. Login
2. Wait 2 hours (or delete authToken from localStorage)
3. Refresh page
   → Auth state clears
   → Logged out
4. Try accessing /investments
   → Redirects to /login
```

## 📊 Data to Verify

### HomePage
- [ ] Videos load from `/api/videos/public`
- [ ] Only videos with `isPublic: true` show
- [ ] Creator name displays correctly
- [ ] Investment total shows correctly
- [ ] Search filters work
- [ ] Invest button only shows when logged in

### LoginPage
- [ ] Form submits to `/api/auth/login`
- [ ] Auth object stored in localStorage with all fields
- [ ] Redirects to / after successful login
- [ ] Shows link to /signup

### SignupPage
- [ ] Form submits to `/api/auth/signup`
- [ ] Role is included (creator vs investor)
- [ ] Redirects to /login after success
- [ ] Validates required fields

### UploadPage
- [ ] Only accessible to role==="creator"
- [ ] Submits to `POST /api/videos`
- [ ] Sets `isPublic: true` on backend
- [ ] Shows uploaded video on homepage
- [ ] File input accepts video/* only

### InvestmentsPage
- [ ] My Investments loads from `/api/transactions/me`
- [ ] Dashboard loads from `/api/transactions`
- [ ] Only shows user's investments in "My Investments"
- [ ] Shows all platform transactions in "Dashboard"
- [ ] Both sections auto-refresh every 5s
- [ ] Stats calculate correctly

### Navbar
- [ ] Upload button only shows for creators
- [ ] Investments link requires login (soft redirect)
- [ ] User dropdown shows email prefix
- [ ] Search bar filters homepage videos
- [ ] Logout clears localStorage

## 🔐 Security Checks

- [ ] Non-creators cannot upload (403 from backend)
- [ ] Non-logged-in users cannot access protected routes
- [ ] Auth token properly stored in localStorage
- [ ] Auth token cleared on logout
- [ ] Private videos don't appear on public feed
- [ ] Cannot directly access other user's investment details

## ✅ Final Verification Checklist

- [ ] All 7 routes working
- [ ] All 6 pages render correctly
- [ ] Navbar updates based on auth state
- [ ] Search filters in real-time
- [ ] Real-time refresh (5s) works
- [ ] Login/logout flow works
- [ ] Protected routes redirect properly
- [ ] Creator-only features work
- [ ] Invest functionality works
- [ ] Transparency dashboard shows correct data
- [ ] No console errors
- [ ] Responsive on mobile/tablet

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` in frontend directory

### Issue: Port 5173 already in use
**Solution**: Kill process or use different port: `npm run dev -- --port 5174`

### Issue: API calls failing (404)
**Solution**: Ensure backend is running on port 5000: `cd backend && npm start`

### Issue: localStorage not working
**Solution**: Check browser DevTools → Application → LocalStorage

### Issue: Navbar not showing after login
**Solution**: Check console for errors, ensure setAuth is called in LoginPage

### Issue: Videos not loading on homepage
**Solution**: Verify `/api/videos/public` endpoint exists and returns data

---

## 📞 Support

If components aren't working:
1. Check browser console for errors (F12)
2. Check network tab - are API calls succeeding?
3. Verify backend is running (port 5000)
4. Verify frontend dev server is running (port 5173)
5. Clear localStorage and refresh: `localStorage.clear()`

---

**Phase 2 Testing Ready**: ✅
**Estimated Testing Time**: 30-45 minutes for full validation
