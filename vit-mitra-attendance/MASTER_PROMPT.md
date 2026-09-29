# Vishnu Institute of Technology — MITRA Attendance Management System
## Master Antigravity IDE Rebuild Prompt

You can copy and paste the prompt below directly into Google Antigravity IDE (or any AI coding assistant) to rebuild the complete full-stack application from scratch.

---

```markdown
Build a production-ready, full-stack Role-Based Club Attendance Management & Multi-Horizon Analytics web application for the **Vishnu Institute of Technology (VIT)**, Bhimavaram, Andhra Pradesh (`@vishnu.edu.in`), specifically for the **MITRA Club**.

### 1. Official Dataset & Roster Specification
1. Ingest and maintain an official master roster (`vit.xlsx` / `db.json`) containing **68 club members** with JNTUK registration numbers (`24PA1A...`), full names, academic branches (`AI&DS`, `AI&ML`, `CSE`, `IT`, `ECE`, `CSBS`, `MECH`), and club wings (`AI & Technical Wing`, `Visual Creativity & Media Wing`, `Marketing & Outreach Wing`, `Impact & Community Wing`, `General Body & Core Wing`).
2. **Designated Admin Account**:
   - VIT Reg. No.: `24PA1A4297`
   - Email: `24pa1a4297@vishnu.edu.in`
   - Name: `R Revanth` (Club Admin / President)
3. All other 67 enrolled students in the roster (e.g. `24PA1A4507` / A Lokesh, `24PA1A4520` / B Mythili, `24PA1A4542` / G Jaswanth Vamsi, etc.) are official Club Members.

### 2. Role-Based Access Control (RBAC) & Privacy
- **Strict Role Separation**:
  - **Admin Mode (`24PA1A4297` / R Revanth)**:
    - Has full Read, Write, Mark, Correct, and Audit authority.
    - Views the entire club roster (all 68+ members) with search and domain filtering.
    - Can mark daily attendance (`Present`, `Absent`, `Late`, `On-Duty / OD`).
    - Has bulk marking tools (`Mark All Present`, Wing filter, search).
    - Can inspect any past date via calendar/date picker, retroactively edit wrong attendance entries, and record an immutable audit justification note.
    - Has access to the **Discrepancy Review Queue** to 1-click Approve & Correct or Dismiss member correction flags.
    - Can add new members to the roster (+ Add Member) and export club-wide attendance to CSV.
  - **Club Member / User Mode (All other student roll numbers)**:
    - **Strict 1-Person View-Only Privacy**: Once logged in, the portal displays **ONLY their personal attendance scorecard and record**. Other members' attendance sheets and roster details are hidden and locked.
    - All attendance toggle buttons, bulk action bars, and administrative controls are completely disabled/hidden (`View-Only Badge`).
    - Personal Attendance Scorecard shows: total sessions conducted, sessions attended, attendance percentage, and automated standing badge (`Good >= 85%`, `Warning 75-84%`, `Low < 75%`).
    - **Flag Wrong Attendance**: If a member spots an incorrect status on a past date, they can click "🚩 Flag Wrong Attendance", select the date, choose the expected status (Present/OD/Late), and submit a reason/proof directly to the Admin's queue.

### 3. Authentication & Password Rules
- **Flexible Any-Password Login**:
  - Both Admin and all Club Members can sign in using **any password** or the default password (`123`). No user should ever be locked out or rejected by rigid password validation.
- **In-App "🔑 Change Password" Feature**:
  - Accessible directly on the Login Gate screen (above and below the password input) and in the top application header.
  - Opens a modal where any user or admin can enter their Reg. No. or Email, type a new password, confirm it, and save it.
  - When saved, it updates `db.passwords` in `db.json`, logs the action in the audit trail, and automatically pre-fills the new password on the login gate for seamless 1-click access.

### 4. Auto Date Rollover & Live IST Clock
- The app automatically detects today's live date (`new Date()`) and defaults to today on boot.
- Header displays a real-time digital clock in Indian Standard Time (IST).
- At midnight (`00:00:00`), a background rollover watcher automatically rolls the active session forward to the new date without requiring page reloads or manual intervention.

### 5. Multi-Horizon Attendance Tracking & Analytics
1. **Daily Tracker Tab (`#tab-daily`)**:
   - Session metadata: Session Title and Session Type dropdown (`General Body Meet`, `Technical Workshop`, `Outreach Drive`, `Core Sync`).
   - Quick date navigation: `◀ Previous Day`, `Today`, `Next Day ▶`, and direct date picker.
   - Retroactive Past-Date Notice Banner: Automatically appears when viewing a past date, informing the user that edits are logged in the audit trail.
   - Daily KPI Cards: `Total Club Roster`, `Present Today`, `Absent Today`, `Late / OD Today`, and `Daily Rate %`.
   - Table of members with color-coded status badges: `Present` (Emerald `#10b981`), `Absent` (Rose `#f43f5e`), `Late` (Amber `#f59e0b`), and `On-Duty / OD` (Sky Blue `#0ea5e9`).
2. **Weekly Trackage Tab (`#tab-weekly`)**:
   - 7-day rolling matrix displaying member rows against date columns.
   - Navigation: `◀ Previous Week`, `This Week`, `Next Week ▶`.
   - Two Chart.js visual analytics:
     - **Weekly Daily Attendance Breakdown**: Stacked/grouped bar chart showing Present vs Late/OD vs Absent counts per day.
     - **Wing-Wise Attendance Percentage Chart**: Bar chart comparing attendance rates across club wings.
3. **Monthly Summary Tab (`#tab-monthly`)**:
   - Month selector dropdown (`YYYY-MM`).
   - Member performance table calculating: `Sessions Conducted`, `Present`, `OD`, `Late`, `Absent`, and `Attendance %`.
   - Automated Eligibility Standing Badges:
     - 🟢 **Good Standing**: >= 85%
     - 🟡 **Warning**: 75% - 84%
     - 🔴 **Low Attendance / Ineligible**: < 75%
   - Monthly Attendance Daily Trend line chart and Wing-wise Doughnut breakdown.
4. **Date Corrections & Audit Log Tab (`#tab-corrections`)**:
   - Discrepancy Requests Queue: Cards showing member flags with date, current status, requested status, reason, and `✓ Approve & Correct Date` / `✕ Dismiss` buttons.
   - Immutable Date Correction Audit Log: Table recording Date, Member Name, Reg No, Old Status, New Status, Reason/Note, Corrected By, and Timestamp.
5. **Datasets Repository Tab (`#tab-datasets`)**:
   - Shows live file cards for all CSV/Excel datasets with sizes, row counts, and live previews.
   - Built-in CSV import/paste textarea allowing admins to paste CSV attendance tables and ingest them directly into the database.

### 6. "+ Add Member" Roster Expansion
- Accessible on the Login Gate screen, in the top application header, and in the Daily Tracker toolbar.
- Form fields: Full Name, Vishnu Reg. No., Academic Branch (`AI&DS`, `AI&ML`, `CSE`, `IT`, `ECE`, `CSBS`, `MECH`), Club Wing, Role/Designation, Batch (`2024-28`), and Email.
- **Universal Attendance Propagation**: Automatically populates attendance records for newly added members across **ALL session dates** in `db.attendance` so they immediately appear across Daily, Weekly, and Monthly historical reports without breaking date matrices.

### 7. Full-Stack Architecture & Deliverables
1. **Backend Server (`server.js`)**:
   - Native Node.js HTTP server (zero heavy framework dependencies).
   - Serves REST API endpoints on port 3000:
     - `GET /api/bootstrap`: Returns entire database state.
     - `POST /api/auth/login`: Authenticates with role separation and any-password support.
     - `POST /api/auth/change-password`: Updates member or admin passwords in `db.passwords`.
     - `POST /api/attendance/mark` & `POST /api/attendance/bulk`: Marks attendance and writes audit logs.
     - `POST /api/discrepancies` & `POST /api/discrepancies/resolve`: Handles member correction requests.
     - `POST /api/members`: Inducts new members and updates all date sessions.
     - `GET /api/datasets` & `GET /api/datasets/download`: Dataset catalog and downloads.
   - Synchronizes `data/db.json` with 5 CSV flat files on every write.
2. **Frontend Client (`public/index.html`, `public/app.js`, `public/styles.css`)**:
   - Modern, responsive Tailwind CSS interface with academic indigo/violet/slate theme.
   - Chart.js 4.4 interactive graphs.
   - 4 integrated modals: Login Switcher, Flag Discrepancy, + Add Member, 🔑 Change Password.
3. **Standalone Production Bundle (`build.js` -> `dist/index.html`)**:
   - Single-file distribution (~595 KB) with inlined CSS, embedded roster JSON, and bundled scripts.
   - Can run completely offline without internet or backend server by double-clicking `dist/index.html`.
4. **1-Click Launcher (`start-live-server.bat`)**:
   - Windows batch script that starts `node server.js` and opens `http://localhost:3000` automatically in the browser.
5. **PDF Documentation (`DOCUMENTATION.pdf`)**:
   - Formatted, print-ready technical document (280 KB) served at `/DOCUMENTATION.pdf`.
```
