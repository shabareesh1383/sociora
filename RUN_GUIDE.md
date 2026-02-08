╔════════════════════════════════════════════════════════════════════════════╗
║                    🚀 HOW TO RUN SOCIORA MVP - STEP BY STEP                 ║
╚════════════════════════════════════════════════════════════════════════════╝


📋 PREREQUISITES CHECK
════════════════════════════════════════════════════════════════════════════════

Verify you have:
  [ ] Node.js 14+ installed → node --version
  [ ] npm installed → npm --version  
  [ ] MongoDB installed → mongod --version
  [ ] Git installed → git --version


🎬 START HERE - FIRST TIME SETUP
════════════════════════════════════════════════════════════════════════════════

STEP 1: Install Dependencies
────────────────────────────────────
cd c:\Users\shaba\Desktop\sociora
npm install

cd backend
npm install

cd ..\frontend
npm install

✅ All dependencies installed


STEP 2: Verify Environment Files
────────────────────────────────────
backend/.env should contain:
  MONGO_URI=mongodb://localhost:27017/sociora
  JWT_SECRET=your-super-secret-jwt-key-sociora-2024
  PORT=5000
  LEDGER_TYPE=mock
  NODE_ENV=development

frontend/.env should contain:
  VITE_API_URL=http://localhost:5000

✅ Environment files configured


STEP 3: Start MongoDB
────────────────────────────────────
MongoDB needs to be running before starting the backend.

Option A - MongoDB Running as Service:
  Windows: Already running (check Services)
  Mac/Linux: brew services start mongodb-community

Option B - Start MongoDB manually:
  mongod
  
✅ MongoDB is running


🚀 RUNNING THE APPLICATION
════════════════════════════════════════════════════════════════════════════════

YOU WILL NEED 2 TERMINAL WINDOWS

TERMINAL 1 - Start Backend Server
─────────────────────────────────────────────────────────────────────────────

cd c:\Users\shaba\Desktop\sociora\backend
npm run dev

EXPECTED OUTPUT:
  > npm run dev
  > nodemon server.js
  MongoDB connected
  Server listening on port 5000

✅ Backend is running on http://localhost:5000


TERMINAL 2 - Start Frontend Development Server
─────────────────────────────────────────────────────────────────────────────

cd c:\Users\shaba\Desktop\sociora\frontend
npm run dev

EXPECTED OUTPUT:
  > npm run dev
  > vite
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help

✅ Frontend is running on http://localhost:5173


🌐 OPEN IN BROWSER
════════════════════════════════════════════════════════════════════════════════

Open your browser and go to:
  http://localhost:5173

You should see:
  ✅ Beautiful purple gradient background
  ✅ "Sociora MVP" header
  ✅ Auth section with Signup/Login forms
  ✅ Upload Video section
  ✅ Videos list
  ✅ My Investments section
  ✅ Transparency Dashboard


📝 TEST THE APPLICATION
════════════════════════════════════════════════════════════════════════════════

1️⃣ SIGNUP
   ────────────────────────────────────
   - Click "Signup" tab
   - Enter:
     Name: John Doe
     Email: john@example.com
     Password: test123
     Role: Creator
   - Click "Create account"
   - Expected: "✅ Signup successful! Please login."


2️⃣ LOGIN
   ────────────────────────────────────
   - Enter email: john@example.com
   - Enter password: test123
   - Click "Login"
   - Expected: "✅ Logged in successfully!"
   - Should see "My Investments" section now


3️⃣ UPLOAD VIDEO (as Creator)
   ────────────────────────────────────
   - Fill in:
     Title: "My First Video"
     Description: "This is my amazing video"
     Select a video file
   - Click "Upload"
   - Expected: "✅ Video uploaded successfully!"
   - Video appears in "Videos" section below


4️⃣ LOGOUT & LOGIN AS INVESTOR
   ────────────────────────────────────
   - Click "Logout" button
   - Click "Signup" again
   - Signup with:
     Name: Jane Investor
     Email: jane@example.com
     Password: test123
     Role: User
   - Click "Create account"
   - Login with jane@example.com / test123
   - Expected: Logged in as investor


5️⃣ TEST INVESTING
   ────────────────────────────────────
   - Set "Invest amount (USD)" to 50
   - Click "Invest" on "My First Video"
   - Button shows: "Processing..."
   - Expected: "✅ Investment of $50 recorded!"
   - Investment appears in "My Investments"
   - Investment appears in "Transparency Dashboard"


6️⃣ CHECK REAL-TIME UPDATES
   ────────────────────────────────────
   - Wait 5 seconds
   - "My Investments" and "Transparency Dashboard" auto-refresh
   - Expected: Data updates automatically


7️⃣ TEST TOKEN EXPIRATION (Optional)
   ────────────────────────────────────
   - Logout
   - Go to browser console (F12)
   - Type in console:
     localStorage.getItem("socioraAuth")
   - You'll see your JWT token
   - It expires in 2 hours
   - After 2 hours, logging in again required


✨ EVERYTHING WORKING! 
════════════════════════════════════════════════════════════════════════════════

If all tests pass:

✅ Signup/Login working
✅ Video upload working
✅ Investing working
✅ Real-time updates working
✅ Transparency dashboard working
✅ My Investments working
✅ Error handling working
✅ Session management working

🎉 Sociora MVP is FULLY FUNCTIONAL! 🎉


🆘 TROUBLESHOOTING
════════════════════════════════════════════════════════════════════════════════

PROBLEM: "ERR_CONNECTION_REFUSED" or Backend not responding
─────────────────────────────────────────────────────────
✓ Terminal 1: Check if backend is running
✓ Terminal 1: See "Server listening on port 5000"?
✓ MongoDB: Is mongod running?
✓ Terminal 1: Any errors after "npm run dev"?
ACTION: Stop (Ctrl+C) and restart Terminal 1 backend


PROBLEM: "Cannot find module" or "npm WARN"
─────────────────────────────────────────────────────────
✓ Backend: Run "npm install" in backend directory
✓ Frontend: Run "npm install" in frontend directory
ACTION: Re-run npm install, then restart the server


PROBLEM: MongoDB connection error
─────────────────────────────────────────────────────────
✓ Check if mongod is running
✓ Check MONGO_URI in backend/.env
✓ Ensure database folder exists
ACTION: Start MongoDB with: mongod


PROBLEM: Port 5000 or 5173 already in use
─────────────────────────────────────────────────────────
Windows:
  netstat -ano | findstr :5000    (find what's using port 5000)
  taskkill /PID <PID> /F          (kill the process)

Mac/Linux:
  lsof -i :5000                   (find what's using port 5000)
  kill -9 <PID>                   (kill the process)


PROBLEM: Investments not showing up
─────────────────────────────────────────────────────────
✓ Are you logged in?
✓ Did you see success message?
✓ Wait 5 seconds for auto-refresh
✓ Manually refresh page (F5)
✓ Check browser console for errors (F12)
ACTION: Check backend logs in Terminal 1


PROBLEM: "Session expired" message
─────────────────────────────────────────────────────────
✓ Your JWT token expired (lasts 2 hours)
✓ You need to login again
ACTION: Click logout and login again


⚡ QUICK RESTART COMMANDS
════════════════════════════════════════════════════════════════════════════════

If something breaks, restart everything:

TERMINAL 1:
  Ctrl+C (stop backend)
  cd c:\Users\shaba\Desktop\sociora\backend
  npm run dev

TERMINAL 2:
  Ctrl+C (stop frontend)
  cd c:\Users\shaba\Desktop\sociora\frontend
  npm run dev

Then refresh browser: F5


💡 HELPFUL TIPS
════════════════════════════════════════════════════════════════════════════════

• Messages auto-disappear after 5 seconds
• Browser Dev Tools (F12) shows network requests
• Backend logs show API call details (Terminal 1)
• Data auto-refreshes every 5 seconds
• No need to manually refresh for investments
• All endpoints are logged in Terminal 1


📊 MONITORING
════════════════════════════════════════════════════════════════════════════════

TERMINAL 1 (Backend) shows:
  ✓ POST /api/auth/login
  ✓ GET /api/videos
  ✓ POST /api/transactions/invest
  ✓ GET /api/transactions
  ✓ GET /api/transactions/me
  ✓ MongoDB queries

TERMINAL 2 (Frontend) shows:
  ✓ Module compilation status
  ✓ Hot reload updates
  ✓ Build warnings (if any)

BROWSER (F12 Console) shows:
  ✓ Network requests (Network tab)
  ✓ JavaScript errors
  ✓ Console logs


✅ YOU'RE READY TO GO!
════════════════════════════════════════════════════════════════════════════════

1. Terminal 1: npm run dev (backend)
2. Terminal 2: npm run dev (frontend)
3. Browser: http://localhost:5173
4. Start using the app!

Enjoy Sociora MVP! 🚀
