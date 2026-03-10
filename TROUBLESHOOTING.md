# VegiX - Troubleshooting Guide

## 🔧 Common Issues & Solutions

---

## 🚀 Backend Issues

### 1. Port 5000 Already in Use

**Problem:** Error: `listen EADDRINUSE: address already in use :::5000`

**Solutions:**
```powershell
# Option 1: Kill process using port 5000
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force

# Option 2: Use different port
# Edit backend/.env
PORT=5001

# Option 3: Find and kill specific port on Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

### 2. MongoDB Connection Failed

**Problem:** Error: `MongooseError: Cannot connect to MongoDB`

**Symptoms:**
- Backend starts but shows "MongoDB connection error"
- Cannot create/read data from database

**Solutions:**

```
✓ Verify MongoDB URI in backend/.env is correct format:
  MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vegix?retryWrites=true&w=majority

✓ Check network access in MongoDB Atlas:
  - Go to Security → Network Access
  - Add your IP address or 0.0.0.0/0 for development
  - Whitelist IP that's connecting

✓ Verify username/password are URL encoded:
  - Special chars like @, #, $ need encoding
  - Use MongoDB's "Copy Connection String" feature
  - Don't manually type credentials

✓ Check cluster status:
  - MongoDB Atlas → Clusters → Check green status
  - If red/yellow, Atlas is having issues

✓ Test connection directly:
  - Install MongoDB Compass
  - Paste MONGO_URI and connect
  - If Compass connects, URI is valid

✓ If using local MongoDB:
  MONGO_URI=mongodb://localhost:27017/vegix
  - Ensure MongoDB service is running:
    # Windows
    Start-Service MongoDB

✓ Clear node_modules and reinstall:
  - Delete backend/node_modules
  - Delete backend/package-lock.json
  - Run npm install again
  - Run npm run dev
```

---

### 3. nodemon Not Restarting Server

**Problem:** Changes to code don't reflect when saving

**Solutions:**
```powershell
# Verify nodemon is installed
npm list nodemon

# Reinstall if needed
npm install --save-dev nodemon

# Check package.json dev script
# Should show: "dev": "nodemon server.js"

# Try running directly
npx nodemon server.js

# If still not working, restart VS Code
# and check file watcher limit on Windows
```

---

### 4. JWT Token Errors

**Problem:** `401 Unauthorized` or `JWT malformed`

**Symptoms:**
- Cannot access protected routes
- Login works but dashboard shows errors

**Solutions:**
```javascript
// Verify JWT_SECRET in .env is set:
// backend/.env
JWT_SECRET=your-secret-key-here-at-least-32-chars

// Check Authorization header format:
// Should be: Authorization: Bearer <token>
// NOT: Authorization: <token>
// NOT: Bearer <token>

// Token expired? Login again to get new token

// Clear browser storage and logout:
localStorage.clear()
```

---

### 5. CORS Errors - Frontend Can't Connect to Backend

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
```javascript
// Verify CORS is configured in server.js:
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// For production, update frontend API base URL
// In axios requests, use:
// http://localhost:5000 for development
// https://yourdomain.com for production

// Check frontend proxy in vite.config.js:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}

// Restart both frontend and backend after changes
```

---

### 6. Middleware Not Working

**Problem:** Authentication middleware not checking tokens

**Symptoms:**
- Can access protected routes without logging in
- No error thrown for invalid tokens

**Solutions:**
```javascript
// Check routes use middleware correctly:
// router.get('/protected', authMiddleware, controller);

// Verify authMiddleware is exported properly:
// module.exports = authMiddleware;

// Check import in routes:
// const authMiddleware = require('../middleware/authMiddleware');

// Middleware order matters - authMiddleware must be BEFORE route handler
```

---

## 🎨 Frontend Issues

### 1. Port 3000 Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
```powershell
# Kill Node processes
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force

# Use different port
# Edit vite.config.js
export default {
  server: {
    port: 3001
  }
}

# Or kill specific port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### 2. Blank/White Screen After Login

**Problem:** Dashboard shows blank page or white screen

**Causes & Solutions:**

```javascript
// 1. Router not initialized properly
// Check App.jsx - must have:
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 2. Component not exporting properly
// Check pages/AdminDashboard.jsx last line:
export default AdminDashboard;

// 3. Import path wrong
// Check spelling of imported components
// Should match actual file names (case-sensitive on Linux)

// 4. JSON parsing error
// Check API response format
// Use Browser DevTools → Network tab
// Click failed request → Preview/Response

// 5. State not initialized
// Check useState hooks have initial values
// const [user, setUser] = useState(null);

// 6. useEffect not updating state
// Check useEffect has correct dependencies
// useEffect(() => { fetchUser(); }, []);
```

**Debug Steps:**
```javascript
// 1. Open Browser DevTools (F12)
// 2. Check Console tab for errors
// 3. Go to Network tab
// 4. Try API call - check response
// 5. Check Application tab
// 6. Look for localStorage data

// Add temporary console logs:
useEffect(() => {
  console.log('Component mounted');
  console.log('User:', user);
  console.log('Role:', userRole);
}, [user, userRole]);
```

---

### 3. Styling Not Applied

**Problem:** CSS not loading or styles not applying

**Solutions:**
```css
/* 1. Check CSS import path */
import '../styles/Dashboard.css';

/* 2. Verify file exists in correct location */
frontend/src/styles/Dashboard.css

/* 3. Check Vite automatically loads CSS */
/* Just import the CSS file in component/App.jsx */

/* 4. Force refresh with hard reload */
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

/* 5. Check CSS specificity issues */
/* More specific selectors override general ones */

/* 6. Clear Vite cache */
rm -r frontend/node_modules/.vite
npm run dev
```

---

### 4. Components Not Rendering

**Problem:** Component doesn't show on page

**Solutions:**
```javascript
// 1. Check component is imported in App.jsx
import AdminDashboard from './pages/AdminDashboard';

// 2. Check Route is defined
<Route path="/admin-dashboard" element={<AdminDashboard />} />

// 3. Check sidebar navigation triggers right path
onClick={() => navigate('/admin-dashboard')}

// 4. Check conditional rendering logic
{activeMenu === 'dashboard' && <AdminDashboard />}

// 5. Check useNavigate hook is used
const navigate = useNavigate();

// 6. Add console.log to verify execution
console.log('Rendering AdminDashboard');
return (
  <div>
    {console.log('Inside component')}
    {/* content */}
  </div>
);
```

---

### 5. API Calls Not Working

**Problem:** Data not fetching, requests fail silently

**Symptoms:**
- useState shows initial value
- No data loaded after useEffect
- Network tab shows failed requests

**Solutions:**
```javascript
// 1. Check axios setup
import axios from 'axios';

// 2. Verify API endpoint URL
const API_URL = 'http://localhost:5000/api';
// OR use environment variable
const API_URL = process.env.REACT_APP_API_URL;

// 3. Include authentication token
useEffect(() => {
  const token = localStorage.getItem('token');
  axios.get(`${API_URL}/user`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => setUser(res.data.user))
  .catch(err => console.error('Error:', err.response.data));
}, []);

// 4. Check response data structure
// Backend returns: { message: '...', user: {...} }
// NOT: { data: { user: {...} } }

// 5. Handle errors properly
.catch(err => {
  console.error('Full error:', err);
  console.error('Response:', err.response);
  console.error('Data:', err.response.data);
  setError(err.response.data.message);
});

// 6. Check Network tab in DevTools
// Verify request headers include Authorization
// Verify response status is 200/201
// Verify response body has expected data
```

---

### 6. Navigation Not Working

**Problem:** Clicking menu items doesn't change page

**Solutions:**
```javascript
// 1. Import useNavigate from React Router
import { useNavigate } from 'react-router-dom';

// 2. Initialize it properly
const navigate = useNavigate();

// 3. Use correct path with slash
onClick={() => navigate('/user-management')}
// NOT: navigate('user-management')

// 4. Check Routes are defined in App.jsx
<Routes>
  <Route path="/user-management" element={<UserManagement />} />
</Routes>

// 5. Verify route path matches navigation path
// Navigation says: '/admin/users'
// Route says: '/user-management'
// These don't match!

// 6. Check activeMenu state updates
const [activeMenu, setActiveMenu] = useState('dashboard');

onClick={() => {
  setActiveMenu('users');
  navigate('/user-management');
}}
```

---

## 🔍 Debugging Tools

### 1. Browser DevTools (F12)
```
Console: JavaScript errors
Network: API requests/responses
Application: localStorage, cookies
Elements: DOM and styles
Sources: JavaScript debugging
```

### 2. Vite Debug
```powershell
# Run with debug info
npm run dev -- --debug

# Check Vite log output for errors
# Look for HMR (Hot Module Replacement) issues
```

### 3. MongoDB Compass
```
- Download MongoDB Compass
- Connect with your MONGO_URI
- Browse collections and documents
- Verify data structure matches models
```

### 4. Postman
```
- Create collections for API endpoints
- Test without frontend
- Verify API works independently
- Check authentication flow
```

### 5. VS Code Debugger
```javascript
// In launch.json:
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/backend/server.js",
  "console": "integratedTerminal"
}

// Then press F5 to debug backend
```

---

## 📋 Verification Checklist

Before reporting an issue, verify:

- [ ] `npm install` run successfully in both backend and frontend
- [ ] All dependencies installed (check node_modules folder exists)
- [ ] `.env` file exists in backend with MONGO_URI, JWT_SECRET, PORT
- [ ] MongoDB Atlas account created and cluster available
- [ ] Network access allowed in MongoDB (IP whitelisted)
- [ ] `npm run dev` runs backend without immediate errors
- [ ] `npm run dev` runs frontend without immediate errors
- [ ] Can access http://localhost:5000/api/ping
- [ ] Can access http://localhost:3000
- [ ] Backend and frontend both running in separate terminals
- [ ] Using correct credentials (admin@vegix.com / password123)
- [ ] Browser DevTools show no console errors
- [ ] Network tab shows API calls succeeding (200 status)

---

## 🆘 Still Stuck?

### Gather Information:
1. **Error message** - Copy exact error text
2. **Where it happens** - Which page/action
3. **Browser console** - Any errors shown?
4. **Network tab** - What's the API response?
5. **Verification checklist** - What fails?

### Try These:
```powershell
# Fresh start
# 1. Kill all Node processes
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force

# 2. Delete node_modules and lock files
Remove-Item -Recurse backend/node_modules
Remove-Item backend/package-lock.json
Remove-Item -Recurse frontend/node_modules
Remove-Item frontend/package-lock.json

# 3. Fresh install
cd backend
npm install
cd ../frontend
npm install

# 4. Start fresh
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# 5. Clear browser cache
# Ctrl + Shift + Delete → Clear browsing data
```

### Check Logs:
- Backend console should show: "✓ MongoDB Connected" and "VegiX Backend Server Running"
- Frontend console should show: "VITE v4.x.x ready in xxx ms"
- Browser console (F12) should have no red errors

---

## 📞 Getting Help

When seeking help, provide:
1. Full error message from console
2. Steps to reproduce the issue
3. Screenshot of the problem
4. Which OS you're using (Windows/Mac/Linux)
5. Node.js version (run: `node --version`)
6. What you've already tried

---

**Last Updated:** February 2024
**Version:** 1.0
