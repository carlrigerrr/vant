# 🚀 Complete Setup Guide - shift-scheduler
## With All Fixes Applied (Tested & Working!)

**Time:** 30-45 minutes  
**Difficulty:** Beginner  
**What you'll get:** Fully working shift scheduler running locally

---

## ✅ Prerequisites (Install These First)

1. **Node.js** - https://nodejs.org (v16 or v18)
2. **MongoDB Compass** - https://www.mongodb.com/try/download/compass
3. **Git** - https://git-scm.com
4. **Code Editor** - Cursor AI (https://cursor.sh) or VS Code

---

## 📁 STEP 1: Clone Repository

```bash
cd Desktop
mkdir Projects
cd Projects
git clone https://github.com/oasido/shift-scheduler.git
cd shift-scheduler
```

---

## 💾 STEP 2: MongoDB Setup

### Connect MongoDB Compass:
1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27017`
3. Click "Connect"

### Create Admin User:
1. Create database: `shift-scheduler`
2. Create collection: `users`
3. Insert this document:

```json
{
  "_id": {"$oid": "6276688e8ac0526064fb3ade"},
  "username": "admin",
  "hash": "864bcf999790114b894299fbc5899cd5c998b3166e1deacc69096fb10b8eda84d2ff1c36637ad4679621b1c17ab3ee2260f6ef4f40c722a0528d645afaeeecce",
  "salt": "1322927e381826e0f7a6fa6ccf4ea81660301f4956ef889eef60e43a2c32065b",
  "admin": true,
  "blockedDates": []
}
```

**Login credentials:** admin / admin

---

## 🔧 STEP 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Create .env File

```bash
notepad .env
```

**Paste this:**
```
MONGODB_URI=mongodb://localhost:27017/shift-scheduler
PORT=4080
```

**Save and close.**

---

### 3.3 Fix server.js (CRITICAL!)

The original code has hardcoded Docker hostnames. Let's fix them:

```bash
notepad server.js
```

**Find line ~21:**
```javascript
mongoose.connect('mongodb://database:27017/shift-scheduler')
```

**Change to:**
```javascript
mongoose.connect('mongodb://localhost:27017/shift-scheduler')
```

**Find line ~63 (inside session config):**
```javascript
mongoUrl: 'mongodb://database:27017/shift-scheduler'
```

**Change to:**
```javascript
mongoUrl: 'mongodb://localhost:27017/shift-scheduler'
```

**Save and close.**

---

## 🎨 STEP 4: Frontend Setup

### 4.1 Install Dependencies

```bash
cd ../frontend
npm install --legacy-peer-deps
```

*(Note: `--legacy-peer-deps` fixes React version conflicts)*

---

### 4.2 Fix package.json Proxy (CRITICAL!)

```bash
notepad package.json
```

**Find near bottom:**
```json
"proxy": "http://backend:4080"
```

**Change to:**
```json
"proxy": "http://localhost:4080"
```

**Save and close.**

---

## 🌐 STEP 5: Change Language to English

### 5.1 Find Language Files

```bash
cd src
notepad components\Login.jsx
```

**Find Hebrew text and replace with English:**
- `שם משתמש` → `Username`
- `סיסמא` → `Password`
- `התחבר` → `Login`

**Do the same for other components in `src\components\` folder.**

### 5.2 Quick English Translation (Main Files)

**File: `src\components\Header.jsx`**
- `סידור עבודה` → `Work Schedule`
- `אישור תאריך` → `Approve Dates`
- `הבקשות שלי` → `My Requests`
- `ניהול` → `Admin`

**File: `src\components\Main.jsx`**
- Replace Hebrew labels with English equivalents

**OR: Ask Cursor AI to translate all Hebrew to English!**

---

## ▶️ STEP 6: Start Everything

### Terminal 1 - Backend:
```bash
cd C:\Users\[YourName]\Desktop\Projects\shift-scheduler\backend
npm start
```

**Should see:** `Server is running on http://localhost:4080`

---

### Terminal 2 - Frontend:
```bash
cd C:\Users\[YourName]\Desktop\Projects\shift-scheduler\frontend
npm start
```

**Browser opens:** http://localhost:3000

---

## ✅ STEP 7: Test Login

1. Go to http://localhost:3000
2. **Username:** admin
3. **Password:** admin
4. Click Login

**Success!** You should see the dashboard! 🎉

---

## 🤖 STEP 8: Open in Cursor AI

1. Install Cursor AI: https://cursor.sh
2. File → Open Folder
3. Select: `C:\Users\[YourName]\Desktop\Projects\shift-scheduler`
4. Upload `AI_AGENT_INSTRUCTIONS.md` to Cursor chat
5. Tell Cursor: 
   ```
   "Please translate all Hebrew text to English first, 
   then implement Feature #8 from the instructions."
   ```

---

## 🐛 Troubleshooting

### Backend won't connect to MongoDB:
```bash
# Check if MongoDB service is running
# Windows: services.msc → find "MongoDB" → Start
```

### Frontend proxy errors:
- Make sure backend is running on port 4080
- Check `frontend/package.json` has `"proxy": "http://localhost:4080"`

### npm install fails:
```bash
npm install --legacy-peer-deps --force
```

### Port already in use:
```bash
# Windows - Kill process on port 4080
netstat -ano | findstr :4080
taskkill /PID [NUMBER] /F

# Mac/Linux
lsof -ti:4080 | xargs kill -9
```

---

## 📋 Daily Workflow

**Every time you work:**

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend (new terminal):**
   ```bash
   cd frontend
   npm start
   ```

3. **Open:** http://localhost:3000

---

## 🎯 What's Next?

Now that it's working:

1. ✅ System runs locally
2. ✅ Can login as admin
3. ✅ Ready for customization
4. ✅ Give to Cursor AI to build 63 features!

---

## 📊 Project Structure

```
shift-scheduler/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── server.js        # Main server (FIXED)
│   ├── .env            # Config (CREATED)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   └── App.js
│   ├── package.json     # Proxy (FIXED)
│   └── public/
│
└── .env                 # Not needed (backend has its own)
```

---

## 🔑 Key Changes Made

This guide includes ALL the fixes discovered during setup:

1. ✅ Created backend `.env` file
2. ✅ Fixed `server.js` MongoDB URLs (database → localhost)
3. ✅ Fixed frontend proxy in `package.json`
4. ✅ Used `--legacy-peer-deps` for npm install
5. ✅ Correct MongoDB connection string
6. ✅ Admin user setup

---

## ✨ Success!

You now have:
- ✅ Fully working shift scheduler
- ✅ Running on localhost
- ✅ MongoDB connected
- ✅ Admin access
- ✅ Ready for AI customization

**Next:** See `AI_AGENT_INSTRUCTIONS.md` for adding features! 🚀

---

**Last Updated:** December 2024  
**Status:** Tested & Working ✅
