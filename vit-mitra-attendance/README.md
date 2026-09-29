# Vishnu Institute of Technology — MITRA Attendance Management System

![Vishnu Institute of Technology](https://img.shields.io/badge/Institute-Vishnu_Institute_of_Technology-blue.svg)
![Club](https://img.shields.io/badge/Club-MITRA_Student_Body-orange.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Deployment](https://img.shields.io/badge/Vercel-Serverless_Ready-black.svg)
![Status](https://img.shields.io/badge/Production-Verified-brightgreen.svg)

A modern, role-based Attendance Management and Analytics System built specifically for the **MITRA Club** at **Vishnu Institute of Technology (VIT)**.

---

## 🌟 Key Features

- **Strict Role-Based Access Control (RBAC)**:
  - **Admin Mode (`24PA1A4297`)**: Full club-wide attendance roll call, retroactive date corrections, member induction (+ Add Member), CSV/Excel dataset import/export, and audit logging.
  - **Member Mode (Individual Club Members)**: Strict 1-person private view showing only their own statistics, attendance percentage, 30-day interactive calendar, and discrepancy dispute flagging.
- **Multi-Horizon Analytics**: Daily roll call, 7-day weekly attendance grid, and monthly 75% standing summaries.
- **Auto Date Rollover**: Automatically schedules and initializes today's attendance session upon login without manual intervention.
- **Discrepancy Resolution Workflow**: Club members can dispute incorrect marks, which admins can review and approve/reject with 1 click.
- **Self-Contained & Resilient**:
  - Zero external runtime npm dependencies (uses native Node.js).
  - Production-ready for **Vercel** serverless environments with `/tmp` filesystem write fallback.
  - Includes a standalone single-file bundle (`dist/index.html`) with embedded datasets for 100% offline usage.

---

## 🔑 Login Credentials

| Role | Roll Number / Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Club Admin** | `24PA1A4297` *(or `24pa1a4297@vishnu.edu.in`)* | **Any password** (or `123`) | Complete attendance control, retroactive date corrections, add member, export/import datasets |
| **Club Member** | Any roll number (e.g. `24PA1A4507`, `24PA1A4201`) | **Any password** | Private 1-person attendance summary, 30-day calendar, flag attendance disputes, change password |

---

## 🚀 Quick Start (Local)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rekhapallirevanth1-png/vit.mitra.git
   cd vit.mitra
   ```

2. **Start the server**:
   ```bash
   npm start
   # or double-click start-live-server.bat
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## ⚡ Deployment to Vercel (1-Click)

The repository includes pre-configured serverless handlers (`api/index.js`) and routing (`vercel.json`):

1. **Via Vercel CLI**:
   ```bash
   npx vercel --prod
   # or double-click deploy-to-vercel.bat
   ```
2. **Via Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import `rekhapallirevanth1-png/vit.mitra`.
   - Click **Deploy**!

---

## 📁 Repository Structure

```
├── api/
│   └── index.js              # Vercel Serverless Function REST API (12 endpoints)
├── data/
│   ├── db.json               # Seed database (92 members, 38 sessions, audit logs)
│   ├── vit.xlsx              # Master 68-member Excel roster
│   └── *.csv                 # Roster, Daily, Weekly, and Monthly CSV datasets
├── public/                   # Production frontend assets served on CDN
│   ├── index.html            # Main Vishnu Institute of Technology UI
│   ├── app.js                # Frontend client logic & offline fallback
│   ├── styles.css            # Responsive themes & styling
│   ├── standalone.html       # Single-file bundled distribution
│   └── DOCUMENTATION.pdf     # Official PDF Documentation
├── dist/                     # Production build artifacts
├── server.js                 # Standalone production Node.js server
├── build.js                  # Production bundler for datasets and standalone builds
├── vercel.json               # Cloud routing and CDN rewrites
├── deploy-to-vercel.bat      # 1-Click Vercel deployment script
└── start-live-server.bat     # 1-Click local desktop launcher
```

---

## 📄 Documentation

- Full system documentation is available in [`DOCUMENTATION.md`](DOCUMENTATION.md) and [`DOCUMENTATION.pdf`](DOCUMENTATION.pdf).
- Master IDE prompt: [`MASTER_PROMPT.md`](MASTER_PROMPT.md).
