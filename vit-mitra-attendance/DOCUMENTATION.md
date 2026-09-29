# Vishnu Institute of Technology — MITRA Club Attendance Management System
## Complete Technical, Functional & Operational Documentation

---

## 1. Executive Summary & Overview

- **Application Name**: Vishnu Institute of Technology — MITRA Attendance Management System
- **Institution**: Vishnu Institute of Technology, Bhimavaram, Andhra Pradesh (`@vishnu.edu.in`)
- **Student Roll Scheme**: JNTUK Roll Scheme (e.g., `24PA1A4297`, `24PA1A4507`, `24PA1A4201`, etc.)
- **Club / Body**: MITRA Club (Student Welfare, Technical & Social Outreach Club)
- **Primary Purpose**: Comprehensive, role-based attendance management, tracking, retroactive verification, discrepancy resolution, multi-horizon analytics (Daily, Weekly, Monthly), and member roster management.
- **Technology Stack**:
  - **Backend**: Native Node.js HTTP Server (`server.js`) with zero heavy framework overhead, custom JSON/REST API router, automatic dataset synchronization, and atomic JSON persistence.
  - **Frontend**: Vanilla ES6+ JavaScript (`public/app.js`), HTML5 (`public/index.html`), Tailwind CSS, and Chart.js 4.4.
  - **Standalone Portable Bundle**: Compiled via `build.js` into a zero-dependency, single-file distribution (`dist/index.html`) containing inlined styles, scripts, and embedded offline datasets.
  - **Official Master Dataset**: Microsoft Excel spreadsheet (`vit.xlsx`) containing 68 officially enrolled students across 7 academic branches and 5 club wings.

---

## 2. System Architecture & Directory Structure

```
vit-mitra-attendance/
├── server.js                          # Full-stack backend server & REST API (port 3000)
├── build.js                           # Standalone production bundler
├── parse_xlsx.py                      # Python utility for Excel ingestion & validation
├── MASTER_PROMPT.md                   # Full AI Builder System Specification
├── DOCUMENTATION.md                   # Complete application documentation (this file)
├── package.json                       # Node.js project manifest
├── vit.xlsx                           # Official master 68-member Excel roster
├── data/
│   ├── db.json                        # Primary JSON database (members, attendance, logs, passwords)
│   ├── vit.xlsx                       # Synchronized master Excel file
│   ├── vit_mitra_members_roster.csv   # Club members directory export
│   ├── vit_mitra_2026-09-23.csv       # Daily session attendance export
│   ├── vit_mitra_weekly_report.csv    # 7-day matrix attendance export
│   ├── vit_mitra_monthly_summary.csv  # Monthly aggregated attendance stats export
│   └── vit_mitra_full_attendance_history.csv # Comprehensive historical records
├── dist/                              # Standalone production output
│   ├── index.html                     # Self-contained bundle (works offline in any browser)
│   └── data/                          # Bundled datasets for distribution
└── public/
    ├── index.html                     # Frontend dashboard markup with Tailwind CSS
    ├── app.js                         # Frontend controller, state engine & Chart.js logic
    └── styles.css                     # Custom styles, transitions, and status colors
```

---

## 3. User Roles & Permission Matrix

The application strictly implements **Role-Based Access Control (RBAC)** to protect member privacy and ensure academic record integrity:

| Feature / Capability | Admin (`24PA1A4297` / R Revanth) | Club Member (All other student accounts) |
| :--- | :---: | :---: |
| **Authentication Screen** | Admin Mode Tab (`24PA1A4297`) | Member Login Tab (Select ID or enter Email) |
| **Password Requirement** | Any password / Custom password | Any password / Custom password |
| **Roster Visibility** | **Full Roster**: All 68+ members | **Private View**: Strictly only their own record |
| **Daily Attendance Marking** | **Yes** (Present, Absent, Late, OD) | **No** (Controls hidden/locked, View-Only badge) |
| **Bulk Attendance Actions** | **Yes** (Mark All Present, Wing Filter) | **No** (Disabled) |
| **Past Date Attendance Inspection** | **Yes** (Full club history) | **Yes** (Own attendance history only) |
| **Retroactive Date Correction** | **Yes** (Logged in Audit Log) | **No** (Locked) |
| **Flag Wrong Attendance Date** | **Yes** (Can flag or direct edit) | **Yes** (Submits request to Admin queue) |
| **Review Discrepancy Queue** | **Yes** (Approve & Correct or Dismiss) | **No** (Hidden) |
| **Audit Log Viewing** | **Yes** (Full change history) | **No** (Hidden) |
| **+ Add Member** | **Yes** (Full induction form) | **Yes** (Roster expansion allowed) |
| **🔑 Change Password** | **Yes** (Self or member reset) | **Yes** (Personal password update) |
| **Export Reports (CSV/Excel)** | **Yes** (Club-wide reports) | **Yes** (Personal scorecard export) |
| **Datasets Repository Tab** | **Yes** (View, preview, import) | **No** (Hidden) |

---

## 4. Core Features & Functional Workflows

### 4.1. Auto Date Rollover & Real-Time IST Clock
- The system automatically evaluates `new Date()` upon launch and sets the active session date to **today's live date**.
- A real-time digital clock displays Indian Standard Time (IST) in the dashboard header.
- At midnight (`00:00:00`), the auto-rollover watcher automatically rolls the active session forward to the new calendar day, ensuring zero manual intervention.

### 4.2. Multi-Horizon Attendance Tracking
1. **Daily Tracker & Marker (`#tab-daily`)**:
   - Single-click status toggle between `Present` (Emerald), `Absent` (Rose), `Late` (Amber), and `On-Duty / OD` (Sky Blue).
   - Session metadata: Session Title (e.g., *General Body Meet*, *Technical Workshop*) and Session Type dropdown.
   - Bulk marking toolbar: *Mark All Present*, filter by Wing/Branch, instant name/Reg No search.
   - Retroactive Past-Date Inspection: Navigating to a past date automatically reveals an amber inspection banner. Any edit made by Admin is tagged as a correction.
2. **Weekly Trackage Matrix (`#tab-weekly`)**:
   - 7-day rolling attendance grid with columns for each date and rows for club members.
   - Navigation: *◀ Previous Week*, *Next Week ▶*, and *This Week* quick return.
   - Interactive Visual Analytics:
     - **Weekly Daily Attendance Breakdown Bar Chart**: Visualizes counts of Present, Late/OD, and Absent members per day.
     - **Wing-Wise Attendance Percentage Chart**: Compares attendance efficiency across departments.
3. **Monthly Summary & Eligibility Scorecard (`#tab-monthly`)**:
   - Month selector (`YYYY-MM`) with auto-population of recorded months.
   - Student scorecard table calculating: `Sessions Conducted`, `Present`, `OD`, `Late`, `Absent`, and `Attendance %`.
   - Automatic Eligibility Standing Badges:
     - 🟢 **Good Standing**: $\ge 85\%$
     - 🟡 **Warning**: $75\% - 84\%$
     - 🔴 **Low Attendance / Ineligible**: $< 75\%$
   - Charts: Monthly Attendance Daily Trend (line chart) and Wing-wise Doughnut breakdown.

### 4.3. Date Correction Audit Trail & Discrepancy Queue
- **Correction Audit Log (`#tab-corrections`)**:
  - Every retroactive modification, status overwrite, or bulk update creates an immutable audit record capturing: Date, Student Name, Reg No, Old Status, New Status, Justification/Reason, Admin Name, and Timestamp.
- **Discrepancy Reporting Workflow**:
  - Any club member noticing an erroneous absence can click **`🚩 Flag Wrong Attendance`**, select the session date, specify the expected status (Present/OD/Late), and submit proof/reason.
  - The Admin receives the request in the Discrepancy Queue with instant **`Approve & Correct`** (automatically updates the session attendance and audit log) or **`Dismiss`** actions.

### 4.4. "+ Add Member" Feature
- Available on the Login Gate screen, in the top application header, and in the Daily Tracker.
- Captures: Full Name, Vishnu Reg. No., Academic Branch (`AI&DS`, `AI&ML`, `CSE`, `IT`, `ECE`, `CSBS`, `MECH`), Club Wing (`AI & Technical`, `Visual Creativity`, `Marketing`, `Impact`, `General Body`), Role, Batch, and Vishnu Email.
- **Universal Attendance Propagation**: Automatically populates attendance records for the newly inducted student across **all existing session dates**, preventing null-pointer errors and ensuring immediate visibility in Weekly and Monthly reports.

### 4.5. Password Management & Authentication
- **Default Flexibility**: Any member can sign in using default password `123` or any arbitrary password.
- **In-App Password Customization**:
  - Clicking **`🔑 Change Password`** (on the login screen or in the app header) allows users to set a private password.
  - Once set, the custom password is encrypted/saved in `db.json` and verified on subsequent logins.
  - If a user changes their password on the login gate, the new password is automatically filled into the password field for immediate 1-click access.

---

## 5. Dataset Catalog & File Architecture

All attendance records are synchronized across multiple formats in [`data/`](file:///C:/Users/91995/.gemini/antigravity/scratch/vit-mitra-attendance/data/):

| Dataset File | File Format | Record Count | Description & Usage |
| :--- | :--- | :--- | :--- |
| **`vit.xlsx`** | Microsoft Excel (`.xlsx`) | 68 Members | Official Vishnu Institute of Technology master roster with Branch, Team, Regd No, and Student Name. |
| **`db.json`** | JSON Database | Full System State | Primary operational data store containing `members`, `sessions`, `attendance`, `discrepancies`, `auditLogs`, and `passwords`. |
| **`vit_mitra_members_roster.csv`** | CSV (`UTF-8`) | 68+ rows | Flat file roster export containing ID, Reg No, Name, Branch, Wing, Role, Email, and Phone. |
| **`vit_mitra_2026-09-23.csv`** | CSV (`UTF-8`) | Daily snapshot | Sample attendance roll call sheet for verification and import testing. |
| **`vit_mitra_weekly_report.csv`** | CSV (`UTF-8`) | 7-day matrix | Tabular matrix mapping members against individual session dates. |
| **`vit_mitra_monthly_summary.csv`** | CSV (`UTF-8`) | Monthly summary | Aggregated member performance including total sessions, attendance counts, and percentage. |
| **`vit_mitra_full_attendance_history.csv`** | CSV (`UTF-8`) | All sessions | Comprehensive row-by-row transaction log of all recorded attendance entries. |

---

## 6. REST API Reference

The backend exposes clean HTTP REST endpoints on port 3000:

### 6.1. Bootstrap & System State
- **`GET /api/bootstrap`**:
  - Returns complete database state: `{ members, sessions, attendance, discrepancies, auditLogs, passwords, promptText }`.

### 6.2. Authentication & Credentials
- **`POST /api/auth/login`**:
  - Request: `{ role, identifier, password }`
  - Response: `{ user: { role, memberId, name, email, regNo, wing, designation, canEdit } }`
- **`POST /api/auth/change-password`**:
  - Request: `{ identifier, newPassword, confirmPassword }`
  - Response: `{ ok: true, message: 'Password updated successfully', regNo, name }`

### 6.3. Attendance Tracking & Corrections
- **`POST /api/attendance/mark`**:
  - Marks or corrects a single attendance entry.
  - Request: `{ date, memberId, status, note, isCorrection, reason, adminName, sessionTitle, sessionType }`
  - Response: `{ ok: true, date, memberId, record, auditLogs }`
- **`POST /api/attendance/bulk`**:
  - Bulk marks attendance for all or filtered members on a date.
  - Request: `{ date, status, memberIds, sessionTitle, sessionType, adminName, reason }`
  - Response: `{ ok: true, date, attendanceForDate, session, auditLogs }`

### 6.4. Member Management
- **`POST /api/members`**:
  - Inducts a new student into the official roster.
  - Request: `{ name, regNo, branch, wing, role, batch, email, phone }`
  - Response: `{ ok: true, member: newMember, members: [...], attendance: {...} }` (HTTP 201)

### 6.5. Discrepancy Flagging & Resolution
- **`POST /api/discrepancies`**:
  - Submits an attendance correction request.
  - Request: `{ date, memberId, requestedStatus, reason }`
- **`POST /api/discrepancies/resolve`**:
  - Admin approves or dismisses a correction request.
  - Request: `{ id, action: 'approve' | 'reject', adminNote, adminName }`

### 6.6. Datasets & Exports
- **`GET /api/datasets`**:
  - Returns catalog of all dataset files with size, row count, and live content previews.
- **`GET /api/datasets/download?file=<filename>`**:
  - Direct file download for CSV/Excel datasets.
- **`POST /api/datasets/import`**:
  - Parses and ingests uploaded or pasted CSV attendance tables.

---

## 7. How to Build, Run & Deploy

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 7.1. Running the Full-Stack Server
```powershell
# Navigate to the project root
cd C:\Users\91995\.gemini\antigravity\scratch\vit-mitra-attendance

# Launch the live backend server
node server.js
```
The server will bind to `http://localhost:3000`. Open this URL in any browser to access the live portal.

### 7.2. Compiling the Standalone Offline Bundle
```powershell
# Run the build script
node build.js
```
This generates:
- `dist/index.html` (595 KB, fully self-contained HTML + inlined CSS + bundled scripts + embedded datasets).
- `dist/data/` (7 dataset files copied for portable distribution).

You can double-click `dist/index.html` to run the portal completely offline without any Node.js server or network connection.

---

## 8. Quick Login Credentials Reference

| Role | Username / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `24pa1a4297@vishnu.edu.in` or `24PA1A4297` (R Revanth) | Any password (or custom if changed) | Full Read/Write, Mark & Correct, Roster Admin |
| **Member 1** | `24pa1a4507@vishnu.edu.in` or `24PA1A4507` (A Lokesh) | Any password (or custom if changed) | Strict 1-Person View-Only |
| **Member 2** | `24pa1a4520@vishnu.edu.in` or `24PA1A4520` (B Mythili) | Any password (or custom if changed) | Strict 1-Person View-Only |
| **Member 3** | `24pa1a4542@vishnu.edu.in` or `24PA1A4542` (G Jaswanth Vamsi) | Any password (or custom if changed) | Strict 1-Person View-Only |
| **Any Student**| Any Reg. No. from `vit.xlsx` (68 members) | Any password (or custom if changed) | Strict 1-Person View-Only |
