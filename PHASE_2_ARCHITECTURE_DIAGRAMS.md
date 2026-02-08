# Phase 2 - Architecture Diagrams & Flow Charts

## 1. Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                   BrowserRouter                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │           Navbar (Persistent)                     │ │
│  │  [Logo] [Search] [Sign In|Upload|Investments|▼] │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                Routes                             │ │
│  │                                                   │ │
│  │  ┌──────────────────────────────────────────┐  │ │
│  │  │  /         → HomePage (public)           │  │ │
│  │  │  /login    → LoginPage                   │  │ │
│  │  │  /signup   → SignupPage                  │  │ │
│  │  │  /upload   → UploadPage (creator)        │  │ │
│  │  │  /investments → InvestmentsPage (auth)   │  │ │
│  │  │  /profile  → ProfilePage (auth)          │  │ │
│  │  │  /*        → Redirect to /               │  │ │
│  │  └──────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 2. Authentication Flow

```
START
  │
  ├─► [User Not Logged In]
  │    │
  │    ├─► Click "Sign In" → LoginPage
  │    │    ├─► Valid credentials → SetAuth → HomePage
  │    │    └─► Invalid → Error message
  │    │
  │    └─► Click "Sign Up" → SignupPage
  │         ├─► Create account → Login page
  │         └─► Already exists → Error message
  │
  └─► [User Logged In]
       │
       ├─► See username in navbar
       ├─► Access /upload (creators only)
       ├─► Access /investments
       ├─► Access /profile
       │
       └─► Click "Logout" → Clear auth → HomePage
```

## 3. User Role-Based Access

```
┌────────────────────────────────────────────┐
│         All Authenticated Users             │
├────────────────────────────────────────────┤
│  • View homepage (/)?       YES             │
│  • Search videos?            YES             │
│  • Invest in videos?         YES             │
│  • View /investments?        YES             │
│  • View /profile?            YES             │
│  • Upload videos?            NO              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│     Creator Role Specific                   │
├────────────────────────────────────────────┤
│  • See "Upload" button?      YES             │
│  • Access /upload?           YES             │
│  • Upload video?             YES             │
│  • Set video as public?      YES (default)   │
│  • View own videos' stats?   YES             │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│     Investor Role Specific                  │
├────────────────────────────────────────────┤
│  • See "Upload" button?      NO              │
│  • Access /upload?           NO (redirected)│
│  • Upload video?             NO              │
│  • Invest in videos?         YES             │
│  • View investments?         YES             │
│  • View transparency ledger? YES             │
└────────────────────────────────────────────┘
```

## 4. Page Interaction Flow

```
┌──────────────┐
│   HomePage   │ (PUBLIC - No auth needed)
│   /          │
└──────┬───────┘
       │
       ├─→ Fetches: GET /api/videos/public
       ├─→ Shows: All videos with isPublic=true
       ├─→ Feature: Search/filter videos
       ├─→ Feature: Invest button (logged-in only)
       └─→ Auto-refresh: Every 5 seconds
              │
              └─→ Clicking video → Future: /video/:id
                  Clicking "Invest" → POST /api/transactions/invest

┌──────────────┐
│  LoginPage   │ (PUBLIC - Redirect if logged in)
│  /login      │
└──────┬───────┘
       │
       ├─→ Calls: POST /api/auth/login
       ├─→ Stores: Auth in localStorage
       ├─→ Feature: Email/Password form
       ├─→ Feature: Link to signup
       └─→ Redirects: To / on success

┌──────────────┐
│  SignupPage  │ (PUBLIC - Redirect if logged in)
│  /signup     │
└──────┬───────┘
       │
       ├─→ Calls: POST /api/auth/signup
       ├─→ Feature: Name, Email, Password
       ├─→ Feature: Role selector (Creator/Investor)
       ├─→ Validates: All required fields
       └─→ Redirects: To /login on success

┌──────────────┐
│  UploadPage  │ (PROTECTED - Creator only)
│  /upload     │
└──────┬───────┘
       │
       ├─→ Auth check: role === "creator"
       ├─→ Shows: "Only creators..." if not creator
       ├─→ Calls: POST /api/videos
       ├─→ Features: Title, Description, Video file
       ├─→ Sets: isPublic = true
       └─→ Redirects: To / on success

┌─────────────────────┐
│  InvestmentsPage    │ (PROTECTED - Auth required)
│  /investments       │
└──────┬──────────────┘
       │
       ├─→ SECTION 1: My Investments
       │    ├─→ Calls: GET /api/transactions/me
       │    ├─→ Shows: Only user's investments
       │    └─→ Auto-refresh: Every 5 seconds
       │
       ├─→ SECTION 2: Transparency Dashboard
       │    ├─→ Calls: GET /api/transactions
       │    ├─→ Shows: All platform transactions
       │    └─→ Auto-refresh: Every 5 seconds
       │
       └─→ STATS: Total invested + distributed

┌──────────────┐
│  ProfilePage │ (PROTECTED - Auth required)
│  /profile    │
└──────┬───────┘
       │
       ├─→ Shows: User email & role
       ├─→ Shows: Creator badge (if creator)
       ├─→ Feature: Logout button
       └─→ Clears: localStorage on logout
```

## 5. API Call Dependency Map

```
FRONTEND              API ENDPOINTS              BACKEND
────────────────────────────────────────────────────────

HomePage
  ├── GET /api/videos/public ──────► [Public Videos]
  └── POST /api/transactions/invest ► [Create Investment]

LoginPage
  └── POST /api/auth/login ─────────► [Authenticate User]

SignupPage
  └── POST /api/auth/signup ────────► [Create Account]

UploadPage
  └── POST /api/videos ──────────────► [Store Video]

InvestmentsPage
  ├── GET /api/transactions/me ─────► [User Investments]
  └── GET /api/transactions ────────► [All Transactions]

ProfilePage
  └── [No API calls - uses cached auth]
```

## 6. Data Flow - Investment Example

```
┌─ User Clicks "Invest" on HomePage
│
├─ Check: Is user logged in?
│   ├─ No  → Redirect to /login
│   └─ Yes → Continue
│
├─ Call: POST /api/transactions/invest
│   │   Headers: Authorization: Bearer {token}
│   │   Body: { videoId, toCreator, amount }
│   │
│   └─► Backend validates:
│       ├─ Token valid?
│       ├─ User has funds?
│       ├─ Video exists?
│       └─ Create transaction in DB
│
├─ Response: Success or Error
│
├─ Frontend:
│   ├─ Show message: "✅ Investment of $X recorded!"
│   ├─ Auto-refresh videos (might have new investment amount)
│   └─ Auto-refresh investments page (if user there)
│
└─ User sees updated data (within 5s max)
```

## 7. Component Tree

```
App (Router)
├── Navbar
│   ├── Logo (Link to /)
│   ├── SearchBox
│   ├── NavLinks
│   │   ├── Login button (logged out)
│   │   ├── Upload link (creators only)
│   │   ├── Investments link (logged in)
│   │   └── UserDropdown (logged in)
│   │       ├── Profile link
│   │       └── Logout button
│   └── DropdownMenu
│
└── Routes
    ├── / → HomePage
    │   ├── VideoGrid
    │   │   ├── VideoCard (x many)
    │   │   │   ├── Title
    │   │   │   ├── Description
    │   │   │   ├── Creator info
    │   │   │   ├── Investment amount
    │   │   │   └── Invest button
    │   │   └── EmptyState
    │   └── SearchFilter
    │
    ├── /login → LoginPage
    │   ├── LoginForm
    │   │   ├── Email input
    │   │   ├── Password input
    │   │   ├── Submit button
    │   │   └── Signup link
    │   └── ErrorMessage
    │
    ├── /signup → SignupPage
    │   ├── SignupForm
    │   │   ├── Name input
    │   │   ├── Email input
    │   │   ├── Password input
    │   │   ├── Role selector
    │   │   ├── Submit button
    │   │   └── Login link
    │   └── ErrorMessage
    │
    ├── /upload → UploadPage
    │   ├── RoleGuard (creator only)
    │   ├── UploadForm
    │   │   ├── Title input
    │   │   ├── Description textarea
    │   │   ├── File input
    │   │   └── Submit button
    │   └── ErrorMessage
    │
    ├── /investments → InvestmentsPage
    │   ├── AuthGuard
    │   ├── StatsSection
    │   │   ├── Total invested
    │   │   └── Total distributed
    │   ├── MyInvestmentsSection
    │   │   ├── TransactionList
    │   │   │   └── TransactionItem (x many)
    │   │   └── EmptyState
    │   ├── DashboardSection
    │   │   ├── LedgerList
    │   │   │   └── LedgerItem (x many)
    │   │   └── EmptyState
    │   └── RefreshIndicator
    │
    └── /profile → ProfilePage
        ├── AuthGuard
        ├── ProfileInfo
        │   ├── Email
        │   ├── Role
        │   └── CreatorBadge (conditional)
        ├── LogoutButton
        └── Optional: UserVideos list
```

## 8. Auth State Lifecycle

```
┌─ Initialization
│  └─ App mounts → getStoredAuth() from localStorage
│
├─ When auth exists:
│  ├─ Navbar shows: Upload (creators), Investments, Profile dropdown
│  ├─ HomePage shows: Invest buttons
│  ├─ /investments, /profile, /upload accessible
│  └─ /login, /signup redirect to /
│
├─ Login Flow:
│  ├─ User fills form
│  ├─ Submit → POST /api/auth/login
│  ├─ Backend returns: { _id, email, name, role, token }
│  ├─ Frontend: localStorage.setItem("socioraAuth", JSON.stringify(data))
│  ├─ Frontend: setAuth(data)
│  └─ Navbar re-renders with new auth state
│
├─ Logout Flow:
│  ├─ User clicks logout
│  ├─ Frontend: localStorage.removeItem("socioraAuth")
│  ├─ Frontend: setAuth(null)
│  ├─ Navbar re-renders as logged out
│  └─ Message shows for 5 seconds
│
└─ Session Expiry:
   └─ (Future: Handle 401 responses)
```

## 9. Real-Time Update Pattern

```
┌─────────────────────────────────────────────────────┐
│          Component mounts (useEffect)                │
│                     │                               │
│         ┌───────────┴───────────┐                  │
│         │                       │                  │
│    Immediate call        Schedule interval         │
│         │                       │                  │
│         └─────────────┬─────────┘                  │
│                       │                            │
│                   API Call                         │
│                 (GET request)                      │
│                       │                            │
│         ┌─────────────┴─────────────┐             │
│         │                           │             │
│      Success                      Error           │
│         │                           │             │
│     setData(...)             console.error(...)   │
│         │                           │             │
│         └─────────────┬─────────────┘             │
│                       │                            │
│            Wait 5 seconds (5000ms)                │
│                       │                            │
│                Repeat API Call                     │
│                       │                            │
│    (Until component unmounts - cleanup)           │
│                       │                            │
│         clearInterval(interval)                    │
│                       │                            │
└─────────────────────────────────────────────────────┘
```

## 10. Error Handling Flow

```
User Action
    │
    ├─► Form Submission / API Call
    │   │
    │   ├─► Validation Error
    │   │   └─ setMessage("❌ Please fill in all fields")
    │   │      └─ Message displays for 5s
    │   │
    │   └─► API Response
    │       │
    │       ├─ res.ok === true
    │       │  └─ Success flow (setData, navigate, etc.)
    │       │
    │       └─ res.ok === false
    │          │
    │          ├─ 400 Bad Request
    │          │  └─ setMessage(data.message)
    │          │
    │          ├─ 401 Unauthorized
    │          │  ├─ localStorage.removeItem("socioraAuth")
    │          │  ├─ setAuth(null)
    │          │  └─ Navigate to /login
    │          │
    │          ├─ 403 Forbidden (not creator for upload)
    │          │  └─ setMessage("❌ Only creators can upload")
    │          │
    │          └─ 500 Server Error
    │             └─ setMessage("❌ Server error, try again")
    │
    └─► Network Error
        └─ catch block
           └─ setMessage("❌ Network error. Please try again.")
```

---

## Summary

Phase 2 creates a **clean, scalable multi-page architecture** with:
- ✅ 7 routes handling different user flows
- ✅ Persistent Navbar with role-based UI
- ✅ Real-time data refresh (5 second polling)
- ✅ Protected routes with proper redirects
- ✅ Comprehensive error handling
- ✅ localStorage auth persistence
- ✅ Zero breaking changes to backend

**Status**: ✅ Complete and Ready for Testing
