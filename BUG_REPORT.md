╔══════════════════════════════════════════════════════════════════════════════╗
║                    CRITICAL BUGS IDENTIFIED & VERIFIED                       ║
║                     Senior Full-Stack Engineer Review                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

SEVERITY: 🔴 CRITICAL (2) | 🟡 HIGH (2) | 🟢 MEDIUM (2)

═══════════════════════════════════════════════════════════════════════════════
🔴 CRITICAL BUGS
═══════════════════════════════════════════════════════════════════════════════

BUG #1: Frontend - investAmount State Type Mismatch
─────────────────────────────────────────────────────
FILE: frontend/src/App.jsx (Line 288)
SEVERITY: CRITICAL

PROBLEM:
  const [investAmount, setInvestAmount] = useState(10);  // ← Initialized as NUMBER
  
  onChange={e => setInvestAmount(e.target.value)}  // ← Sets as STRING!
  
  Later sent as: amount: Number(investAmount)  // ← Converts back to number
  
IMPACT:
  - State inconsistency: number → string → number
  - If handleInvest called before user changes input, investAmount is 10 (number)
  - After one keystroke, investAmount becomes string "10"
  - This breaks state purity and React's optimization assumptions
  - Can cause subtle bugs in comparisons and calculations

ROOT CAUSE:
  HTML input[type="number"].value returns string, not parsed number

EVIDENCE:
  Input field reads from React state but onChange doesn't parse the value
  
FIX REQUIRED:
  onChange={e => setInvestAmount(Number(e.target.value))}


BUG #2: Frontend - Missing Error Handling in fetchMyInvestments
──────────────────────────────────────────────────────────────
FILE: frontend/src/App.jsx (Line 47-58)
SEVERITY: CRITICAL

PROBLEM:
  const fetchMyInvestments = async () => {
    const raw = localStorage.getItem("socioraAuth");
    if (!raw) return;
    const { token } = JSON.parse(raw);
    const res = await fetch(`${API_BASE}/api/transactions/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();  // ❌ Parses JSON even if 401
    setMyInvestments(Array.isArray(data) ? data : []);  // ❌ No error check
  };

IMPACT:
  - If token expires: API returns 401, response is { message: "Invalid token" }
  - Code tries to setMyInvestments([]) with error object
  - User loses "My Investments" list without knowing why
  - No re-login prompt or error message
  - Silent failure - worst type of bug

SCENARIO:
  1. User logs in at 2:00 PM, token expires at 3:00 PM
  2. User comes back at 4:00 PM and clicks something that triggers fetchMyInvestments
  3. API returns 401 (expired token)
  4. Code sets myInvestments to []
  5. User sees empty "My Investments" section
  6. No error message, user confused
  7. User doesn't know to re-login

ROOT CAUSE:
  Missing !res.ok check before parsing response

FIX REQUIRED:
  if (!res.ok) {
    console.warn("Failed to load investments:", res.status);
    setMyInvestments([]);
    return;
  }


═══════════════════════════════════════════════════════════════════════════════
🟡 HIGH PRIORITY BUGS
═══════════════════════════════════════════════════════════════════════════════

BUG #3: Backend - Case-Sensitive Authorization Header
──────────────────────────────────────────────────────
FILE: backend/middleware/auth.js (Line 5)
SEVERITY: HIGH

PROBLEM:
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  
  This only matches "Bearer" with capital B. RFC 7235 says header names are
  case-insensitive, but many implementations accept both "Bearer" and "bearer".
  
  Postman might send "bearer" (lowercase) → auth fails

IMPACT:
  - 401 Unauthorized errors from valid tokens in different client implementations
  - Works in browser (fetch defaults to "Bearer"), fails in some HTTP clients
  - Inconsistent behavior across Postman, curl, other tools

FIX REQUIRED:
  const token = header.toLowerCase().startsWith("bearer ") 
    ? header.split(" ")[1] 
    : null;


BUG #4: Frontend - handleInvest Missing Token Expiration Check
──────────────────────────────────────────────────────────────
FILE: frontend/src/App.jsx (Line 163-183)
SEVERITY: HIGH

PROBLEM:
  const handleInvest = async (video) => {
    const res = await fetch(...);
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Investment failed");  // Generic error
      return;
    }
    // Success
  };

IMPACT:
  - If token expired (401), shows generic "Investment failed" error
  - No indication that user needs to re-login
  - User retries multiple times, frustrated

ROOT CAUSE:
  No distinction between validation errors and auth errors

FIX REQUIRED:
  if (!res.ok) {
    if (res.status === 401) {
      setAuth(null);
      localStorage.removeItem("socioraAuth");
      setMessage("Session expired. Please login again.");
    } else {
      setMessage(data.message || "Investment failed");
    }
    return;
  }


═══════════════════════════════════════════════════════════════════════════════
🟢 MEDIUM PRIORITY BUGS
═══════════════════════════════════════════════════════════════════════════════

BUG #5: Frontend - Duplicate Code in getAuthHeaders
────────────────────────────────────────────────────
FILE: frontend/src/App.jsx
SEVERITY: MEDIUM

PROBLEM:
  Function getAuthHeaders() (line 30) duplicates localStorage logic
  from fetchMyInvestments() (line 47)
  
  Both read "socioraAuth" from localStorage manually
  
IMPACT:
  - DRY violation (Don't Repeat Yourself)
  - If auth storage key changes, must update in 2 places
  - Maintenance burden

FIX REQUIRED:
  Refactor fetchMyInvestments to use getAuthHeaders():
  
  const fetchMyInvestments = async () => {
    const headers = getAuthHeaders();
    if (!Object.keys(headers).length) return;  // No auth
    const res = await fetch(..., { headers });
    ...
  };


BUG #6: Frontend - No Loading States During Investment
──────────────────────────────────────────────────────
FILE: frontend/src/App.jsx
SEVERITY: MEDIUM

PROBLEM:
  const handleInvest = async (video) => {
    // ← No loading state set here
    const res = await fetch(...);  // Can take 1-3 seconds
    // ← No loading state cleared here
  };

IMPACT:
  - User can click "Invest" button multiple times
  - Multiple investments created simultaneously
  - Race condition: "Investment recorded!" shown, but only 1 succeeds
  - User confusion: paid $50 but only $10 invested?

ROOT CAUSE:
  No isLoading state to disable button during request

FIX REQUIRED:
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInvest = async (video) => {
    setIsLoading(true);
    try {
      // ... investment logic
    } finally {
      setIsLoading(false);
    }
  };


═══════════════════════════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Total Bugs Found: 6
- Critical: 2 (Must fix immediately)
- High: 2 (Fix before production)
- Medium: 2 (Should fix for robustness)

Timeline to fix: 
- Critical bugs: ~5 minutes
- All bugs: ~15 minutes

Risk Level: HIGH - Critical bugs can cause data loss and poor UX
