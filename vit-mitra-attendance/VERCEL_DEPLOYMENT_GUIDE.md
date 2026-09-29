# Deploying Vishnu Institute of Technology MITRA Attendance to Vercel

This application is fully adapted and production-ready for **Vercel** serverless deployment.

---

## ⚡ Deployment Method 1: Using Vercel CLI (Recommended & Fastest)

You can deploy directly from your local terminal with one command without needing to set up Git first:

1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd C:\Users\91995\.gemini\antigravity\scratch\vit-mitra-attendance
   ```

2. Run Vercel deploy:
   ```bash
   npx vercel
   ```

3. When prompted in the terminal:
   - **Set up and deploy?** Type `y` and press Enter.
   - **Which scope?** Select your Vercel account.
   - **Link to existing project?** Type `n` and press Enter.
   - **What's your project's name?** Enter `vit-mitra-attendance` (or any name you like).
   - **In which directory is your code located?** Press Enter (default `./`).
   - **Want to modify these settings?** Type `n` and press Enter.

4. Vercel will build and give you a live production preview URL (e.g., `https://vit-mitra-attendance.vercel.app`)!

To promote to production at any time:
```bash
npx vercel --prod
```

---

## 🚀 Deployment Method 2: Deploying via GitHub (Continuous Deployment)

1. Initialize Git in this directory (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Deploy Vishnu Institute of Technology MITRA system on Vercel"
   ```

2. Create a repository on GitHub (e.g. `vit-mitra-attendance`).

3. Link your local repo and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vit-mitra-attendance.git
   git push -u origin main
   ```

4. Go to **[vercel.com/new](https://vercel.com/new)**:
   - Click **Import** next to your `vit-mitra-attendance` repository.
   - **Framework Preset**: Leave as **Other**.
   - **Root Directory**: `./` (default).
   - **Build Command**: `node build.js` (automatically detected from `package.json`).
   - **Output Directory**: Leave default.
   - Click **Deploy**!

---

## 📁 Architecture on Vercel

```
vit-mitra-attendance/
├── vercel.json                 # Routing & rewrite rules (/api/* -> api/index.js)
├── api/
│   └── index.js                # Serverless REST API handler (12 endpoints)
├── public/                     # High-performance Static CDN hosting
│   ├── index.html              # Main Vishnu Institute of Technology UI
│   ├── app.js                  # Frontend client logic & offline fallback
│   ├── styles.css              # Custom styling & dark/light mode themes
│   ├── standalone.html         # All-in-one embedded bundle (zero-backend fallback)
│   ├── DOCUMENTATION.pdf       # Downloadable club documentation
│   ├── vit.xlsx                # Master 68-member Excel roster
│   └── data/                   # Bundled CSV datasets & JSON database
├── data/
│   └── db.json                 # Persistent seed database with 92 members & 38 sessions
├── package.json                # Project scripts ("build": "node build.js")
└── build.js                    # Production asset bundler & dataset synchronizer
```

---

## 🔑 Login Credentials

- **Admin Account**:
  - Reg No: `24PA1A4297`
  - Email: `24pa1a4297@vishnu.edu.in`
  - Password: **Any password** (or `admin123`)
  - Rights: Full Attendance Management, Date Rollover, Retroactive Corrections, Add Member, Datasets Import/Export

- **Member Accounts**:
  - Reg No: Enter any valid student Reg No (e.g. `24PA1A4201`, `24PA1A4218`, `24PA1A4507`)
  - Email: Student Vishnu email (e.g. `24pa1a4201@vishnu.edu.in`)
  - Password: **Any password** (or `member123`)
  - Rights: 1-Person Private Attendance Summary, 30-Day Calendar, Discrepancy Flagging, Password Change

---

## 🛡️ Serverless Filesystem Resilience

On Vercel, the default runtime environment has a read-only filesystem. `api/index.js` is engineered to write state changes to `/tmp/vit_mitra_data/db.json` and keep an in-memory cache, completely preventing any `EROFS` errors.
