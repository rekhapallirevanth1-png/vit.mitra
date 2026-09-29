const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PROMPT_FILE = path.join(__dirname, 'MASTER_PROMPT.md');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateSeedData() {
  const members = [
    { id: 'm1', regNo: '24PA1A4297', name: 'Club Admin (24PA1A4297)', wing: 'Technical', role: 'Club Admin & President', batch: '2024-28', email: '24pa1a4297@vishnu.edu.in', phone: '+91 98450 11201', avatar: 'CA' },
    { id: 'm2', regNo: '24PA1A4201', name: 'Diya Nair', wing: 'Management & Events', role: 'Vice President', batch: '2024-28', email: '24pa1a4201@vishnu.edu.in', phone: '+91 98450 11202', avatar: 'DN' },
    { id: 'm3', regNo: '24PA1A4218', name: 'Rohan Verma', wing: 'Technical', role: 'Technical Lead', batch: '2024-28', email: '24pa1a4218@vishnu.edu.in', phone: '+91 98450 11203', avatar: 'RV' },
    { id: 'm4', regNo: '24PA1A4234', name: 'Ananya Krishnan', wing: 'PR & Outreach', role: 'Outreach Secretary', batch: '2024-28', email: '24pa1a4234@vishnu.edu.in', phone: '+91 98450 11204', avatar: 'AK' },
    { id: 'm5', regNo: '24PA1A4255', name: 'Karthik Reddy', wing: 'Design & Media', role: 'Creative Head', batch: '2024-28', email: '24pa1a4255@vishnu.edu.in', phone: '+91 98450 11205', avatar: 'KR' },
    { id: 'm6', regNo: '24PA1A4262', name: 'Sneha Iyer', wing: 'Social Impact', role: 'Mitra Drive Coordinator', batch: '2024-28', email: '24pa1a4262@vishnu.edu.in', phone: '+91 98450 11206', avatar: 'SI' },
    { id: 'm7', regNo: '23PA1A0590', name: 'Vikramaditya Rao', wing: 'Management & Events', role: 'Logistics Lead', batch: '2023-27', email: '23pa1a0590@vishnu.edu.in', phone: '+91 98450 11207', avatar: 'VR' },
    { id: 'm8', regNo: '23PA1A4276', name: 'Meera Deshmukh', wing: 'Technical', role: 'Full-Stack Core', batch: '2023-27', email: '23pa1a4276@vishnu.edu.in', phone: '+91 98450 11208', avatar: 'MD' },
    { id: 'm9', regNo: '24PA1A4223', name: 'Aditya Kulkarni', wing: 'Technical', role: 'Executive Member', batch: '2024-28', email: '24pa1a4223@vishnu.edu.in', phone: '+91 98450 11209', avatar: 'AK' },
    { id: 'm10', regNo: '24PA1A4277', name: 'Priya Menon', wing: 'Design & Media', role: 'UI/UX Designer', batch: '2024-28', email: '24pa1a4277@vishnu.edu.in', phone: '+91 98450 11210', avatar: 'PM' },
    { id: 'm11', regNo: '24PA1A4240', name: 'Siddharth Joshi', wing: 'PR & Outreach', role: 'Sponsorship Core', batch: '2024-28', email: '24pa1a4240@vishnu.edu.in', phone: '+91 98450 11211', avatar: 'SJ' },
    { id: 'm12', regNo: '24PA1A4232', name: 'Nandini Gupta', wing: 'Social Impact', role: 'Community Volunteer', batch: '2024-28', email: '24pa1a4232@vishnu.edu.in', phone: '+91 98450 11212', avatar: 'NG' },
    { id: 'm13', regNo: '24PA1A0498', name: 'Harshvardhan Singh', wing: 'Management & Events', role: 'Event Coordinator', batch: '2024-28', email: '24pa1a0498@vishnu.edu.in', phone: '+91 98450 11213', avatar: 'HS' },
    { id: 'm14', regNo: '24PA1A1221', name: 'Tanvi Chatterjee', wing: 'PR & Outreach', role: 'Editorial & Content', batch: '2024-28', email: '24pa1a1221@vishnu.edu.in', phone: '+91 98450 11214', avatar: 'TC' },
    { id: 'm15', regNo: '24PA1A4289', name: 'Pranav Subramanian', wing: 'Technical', role: 'AI/ML Member', batch: '2024-28', email: '24pa1a4289@vishnu.edu.in', phone: '+91 98450 11215', avatar: 'PS' },
    { id: 'm16', regNo: '24PA1A4294', name: 'Ishaan Malhotra', wing: 'Social Impact', role: 'Field Outreach Member', batch: '2024-28', email: '24pa1a4294@vishnu.edu.in', phone: '+91 98450 11216', avatar: 'IM' }
  ];

  const sessionTemplates = [
    { title: 'Weekly General Body Meet (GBM)', type: 'General Body Meet' },
    { title: 'VIT Mitra Social Outreach Drive Planning', type: 'Outreach Drive' },
    { title: 'Rivera / Gravitas Club Stall Coordination', type: 'Event Prep' },
    { title: 'Technical & Web Portal Sprint Sync', type: 'Tech Workshop' },
    { title: 'Core Committee Review & Budget Meet', type: 'Core Sync' },
    { title: 'Campus Mentorship & Freshers Orientation', type: 'Outreach Drive' },
    { title: 'Design & Social Media Campaign Review', type: 'Creative Sync' }
  ];

  const today = new Date();
  const sessions = {};
  const attendance = {};

  // Seed last 40 days up through today so Daily, Weekly, and Monthly views are rich
  for (let offset = 38; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const dateStr = formatDateISO(d);
    const dayOfWeek = d.getDay(); // 0 Sun .. 6 Sat

    // Conduct club sessions on most days (skip some Sundays except special drives)
    if (dayOfWeek === 0 && offset % 3 !== 0) {
      continue;
    }

    const tpl = sessionTemplates[(38 - offset) % sessionTemplates.length];
    sessions[dateStr] = {
      date: dateStr,
      title: offset === 0 ? 'Today — VIT MITRA General Body & Attendance Review' : tpl.title,
      type: tpl.type,
      updatedBy: 'Admin (Prof. Coordinator / President)',
      updatedAt: new Date(d.getTime() + 17 * 3600 * 1000).toISOString()
    };

    attendance[dateStr] = {};
    members.forEach((m, idx) => {
      // Deterministic pseudo-random attendance pattern per member & date
      const hash = (offset * 13 + idx * 7 + d.getDate() * 3) % 100;
      let status = 'present';
      let note = '';

      // Make m11 and m13 have slightly lower attendance (<75%) so Admin can spot warning/shortage
      if (m.id === 'm11') {
        if (hash < 32) status = 'absent';
        else if (hash < 40) status = 'late';
      } else if (m.id === 'm13') {
        if (hash < 28) status = 'absent';
        else if (hash < 35) status = 'od';
      } else {
        if (hash < 10) status = 'absent';
        else if (hash < 16) status = 'late';
        else if (hash < 22) {
          status = 'od';
          note = 'On-Duty: Club stall / Poster duty';
        }
      }

      attendance[dateStr][m.id] = {
        status,
        note,
        updatedBy: 'Admin (Aarav Sharma)',
        updatedAt: sessions[dateStr].updatedAt
      };
    });
  }

  // Apply the exact dataset provided by the user for 2026-09-23 (and today)
  const exactDataset2026_09_23 = [
    { regNo: '24PA1A4297', status: 'present', note: '' },
    { regNo: '24PA1A4201', status: 'od', note: '' },
    { regNo: '24PA1A4218', status: 'present', note: '' },
    { regNo: '24PA1A4234', status: 'present', note: '' },
    { regNo: '24PA1A4255', status: 'od', note: '' },
    { regNo: '24PA1A4262', status: 'late', note: '' },
    { regNo: '23PA1A0590', status: 'present', note: '' },
    { regNo: '23PA1A4276', status: 'od', note: 'On-Duty: Club stall / Poster duty' },
    { regNo: '24PA1A4223', status: 'od', note: '' },
    { regNo: '24PA1A4277', status: 'present', note: '' },
    { regNo: '24PA1A4240', status: 'absent', note: '' },
    { regNo: '24PA1A4232', status: 'absent', note: '' },
    { regNo: '24PA1A0498', status: 'present', note: '' },
    { regNo: '24PA1A1221', status: 'late', note: '' },
    { regNo: '24PA1A4289', status: 'late', note: '' },
    { regNo: '24PA1A4294', status: 'present', note: '' }
  ];

  const todayISO = formatDateISO(today);
  const targetDatesForExactDataset = Array.from(new Set(['2026-09-23', todayISO]));
  targetDatesForExactDataset.forEach((tDate) => {
    sessions[tDate] = {
      date: tDate,
      title: 'VIT MITRA Official Roll Call & Attendance Dataset (2026-09-23)',
      type: 'General Body Meet',
      updatedBy: 'Admin (24PA1A4297)',
      updatedAt: new Date().toISOString()
    };
    attendance[tDate] = {};
    exactDataset2026_09_23.forEach((item) => {
      const member = members.find((m) => m.regNo.toUpperCase() === item.regNo.toUpperCase());
      if (member) {
        attendance[tDate][member.id] = {
          status: item.status.toLowerCase(),
          note: item.note || '',
          updatedBy: 'Admin (24PA1A4297)',
          updatedAt: new Date().toISOString()
        };
      }
    });
  });

  // Specific yesterday & 3-days-ago dates for realistic correction audit logs and discrepancy requests
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateISO(yesterday);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const threeDaysAgoStr = formatDateISO(threeDaysAgo);

  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);
  const fiveDaysAgoStr = formatDateISO(fiveDaysAgo);

  // Ensure yesterday & threeDaysAgo exist in sessions/attendance
  [yesterdayStr, threeDaysAgoStr, fiveDaysAgoStr].forEach((dStr, i) => {
    if (!sessions[dStr]) {
      sessions[dStr] = {
        date: dStr,
        title: sessionTemplates[i % sessionTemplates.length].title,
        type: sessionTemplates[i % sessionTemplates.length].type,
        updatedBy: 'Admin (Aarav Sharma)',
        updatedAt: new Date().toISOString()
      };
      attendance[dStr] = {};
      members.forEach((m) => {
        attendance[dStr][m.id] = { status: 'present', note: '', updatedBy: 'Admin', updatedAt: new Date().toISOString() };
      });
    }
  });

  // Set a wrong attendance entry on yesterdayStr for Rohan Verma (m3) and Ananya Krishnan (m4)
  // so the user/admin can see pending correction requests and test 1-click date correction!
  attendance[yesterdayStr]['m3'] = {
    status: 'absent',
    note: 'Marked during initial roll call',
    updatedBy: 'Admin',
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  };
  attendance[threeDaysAgoStr]['m4'] = {
    status: 'absent',
    note: 'Roll call sheet mismatch',
    updatedBy: 'Admin',
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  };

  const discrepancies = [
    {
      id: 'disc-101',
      date: yesterdayStr,
      memberId: 'm3',
      memberName: 'Rohan Verma',
      regNo: '22BCE1318',
      wing: 'Technical',
      currentStatus: 'absent',
      requestedStatus: 'present',
      reason: 'I was setting up the projector and demo laptop in AB1-304 during initial roll call.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
    },
    {
      id: 'disc-102',
      date: threeDaysAgoStr,
      memberId: 'm4',
      memberName: 'Ananya Krishnan',
      regNo: '23BDS1089',
      wing: 'PR & Outreach',
      currentStatus: 'absent',
      requestedStatus: 'od',
      reason: 'Was at the DSW (Directorate of Student Welfare) office getting VIT MITRA event permission letter signed.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
    }
  ];

  const auditLogs = [
    {
      id: 'log-201',
      date: fiveDaysAgoStr,
      memberId: 'm8',
      memberName: 'Meera Deshmukh',
      regNo: '23BCE1876',
      oldStatus: 'absent',
      newStatus: 'present',
      reason: 'Verified via attendance sheet signature — corrected wrong entry on date ' + fiveDaysAgoStr,
      correctedBy: 'Admin (Aarav Sharma)',
      timestamp: new Date(Date.now() - 3600 * 1000 * 28).toISOString()
    },
    {
      id: 'log-202',
      date: threeDaysAgoStr,
      memberId: 'm5',
      memberName: 'Karthik Reddy',
      regNo: '23BCE1412',
      oldStatus: 'absent',
      newStatus: 'od',
      reason: 'Approved On-Duty for poster printing at Main Gate reprography.',
      correctedBy: 'Admin (Diya Nair)',
      timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
    }
  ];

  return {
    members,
    sessions,
    attendance,
    discrepancies,
    auditLogs
  };
}

function escapeCSV(val) {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function syncAllDatasetFiles(db) {
  try {
    // Also copy vit.xlsx into DATA_DIR if present at root
    const xlsxSrc = path.join(__dirname, 'vit.xlsx');
    const xlsxDest = path.join(DATA_DIR, 'vit.xlsx');
    if (fs.existsSync(xlsxSrc)) {
      try { fs.copyFileSync(xlsxSrc, xlsxDest); } catch (e) {}
    }

    // 1. vit_mitra_members_roster.csv (All members including 68 from vit.xlsx)
    const rosterHeader = 'Member ID,VIT Reg No,Member Name,Branch,Team,Wing,Role,Batch,Email,Phone,Default Password,Source';
    const rosterRows = db.members.map((m) => {
      const pass = m.email === '24pa1a4297@vishnu.edu.in' ? 'admin123' : 'member123';
      return [m.id, m.regNo, m.name, m.branch || 'N/A', m.team || 'N/A', m.wing, m.role, m.batch, m.email, m.phone, pass, m.source || 'vit.xlsx'].map(escapeCSV).join(',');
    });
    fs.writeFileSync(path.join(DATA_DIR, 'vit_mitra_members_roster.csv'), [rosterHeader, ...rosterRows].join('\n'), 'utf8');

    // 2. vit_mitra_2026-09-23.csv (Today / 2026-09-23 Daily Attendance Sheet)
    const targetDay = db.attendance['2026-09-23'] ? '2026-09-23' : Object.keys(db.attendance).sort().slice(-1)[0];
    const dayHeader = 'VIT Reg No,Member Name,Branch,Wing,Role,Date,Status,Note';
    const dayRows = db.members.map((m) => {
      const rec = db.attendance[targetDay]?.[m.id] || { status: 'present', note: '' };
      return [m.regNo, m.name, m.branch || 'N/A', m.wing, m.role, targetDay, (rec.status || 'present').toUpperCase(), escapeCSV(rec.note || '')].join(',');
    });
    fs.writeFileSync(path.join(DATA_DIR, 'vit_mitra_2026-09-23.csv'), [dayHeader, ...dayRows].join('\n'), 'utf8');

    // 3. vit_mitra_full_attendance_history.csv
    const allDates = Object.keys(db.attendance).sort();
    const historyRows = [];
    allDates.forEach((d) => {
      db.members.forEach((m) => {
        const rec = db.attendance[d]?.[m.id];
        if (rec) {
          historyRows.push([m.regNo, m.name, m.branch || 'N/A', m.wing, m.role, d, (rec.status || 'present').toUpperCase(), escapeCSV(rec.note || '')].join(','));
        }
      });
    });
    fs.writeFileSync(path.join(DATA_DIR, 'vit_mitra_full_attendance_history.csv'), [dayHeader, ...historyRows].join('\n'), 'utf8');

    // 4. vit_mitra_weekly_report.csv
    const weekDates = allDates.slice(-7);
    const weekHeader = ['VIT Reg No', 'Member Name', 'Branch', 'Wing', ...weekDates, 'Weekly Attended', 'Weekly Conducted', 'Weekly %'].join(',');
    const weekRows = db.members.map((m) => {
      let att = 0, cond = 0;
      const dayCols = weekDates.map((d) => {
        const st = (db.attendance[d]?.[m.id]?.status || 'NONE').toUpperCase();
        if (st !== 'NONE') {
          cond++;
          if (st === 'PRESENT' || st === 'OD' || st === 'LATE') att++;
        }
        return st;
      });
      const pct = cond > 0 ? Math.round((att / cond) * 1000) / 10 : 100;
      return [m.regNo, m.name, m.branch || 'N/A', m.wing, ...dayCols, att, cond, `${pct}%`].join(',');
    });
    fs.writeFileSync(path.join(DATA_DIR, 'vit_mitra_weekly_report.csv'), [weekHeader, ...weekRows].join('\n'), 'utf8');

    // 5. vit_mitra_monthly_summary.csv
    const currentMonth = (targetDay || '2026-09-23').slice(0, 7);
    const monthDates = allDates.filter((d) => d.startsWith(currentMonth));
    const monthHeader = 'VIT Reg No,Member Name,Branch,Wing,Role,Month,Sessions Conducted,Present,OD,Late,Absent,Attendance %,Standing';
    const monthRows = db.members.map((m) => {
      let s = 0, p = 0, od = 0, l = 0, a = 0;
      monthDates.forEach((d) => {
        const st = db.attendance[d]?.[m.id]?.status;
        if (st) {
          s++;
          if (st === 'present') p++;
          else if (st === 'od') od++;
          else if (st === 'late') l++;
          else if (st === 'absent') a++;
        }
      });
      const pct = s > 0 ? Math.round(((p + od + l) / s) * 1000) / 10 : 100;
      const standing = pct >= 85 ? 'Good Standing (>=85%)' : pct >= 75 ? 'Borderline (75-84%)' : 'Shortage (<75%)';
      return [m.regNo, m.name, m.branch || 'N/A', m.wing, m.role, currentMonth, s, p, od, l, a, `${pct}%`, standing].join(',');
    });
    fs.writeFileSync(path.join(DATA_DIR, 'vit_mitra_monthly_summary.csv'), [monthHeader, ...monthRows].join('\n'), 'utf8');
  } catch (err) {
    console.error('Error syncing dataset CSV files:', err);
  }
}

function ensureTodaySession(db) {
  const todayISO = formatDateISO(new Date());
  if (!db.sessions) db.sessions = {};
  if (!db.attendance) db.attendance = {};
  if (!db.sessions[todayISO]) {
    db.sessions[todayISO] = {
      date: todayISO,
      title: `Today — Vishnu Institute of Technology Daily Session & Roll Call (${todayISO})`,
      type: 'General Body Meet',
      updatedBy: 'Auto Date System',
      updatedAt: new Date().toISOString()
    };
    if (!db.attendance[todayISO]) {
      db.attendance[todayISO] = {};
      db.members.forEach((m) => {
        db.attendance[todayISO][m.id] = {
          status: 'present',
          note: '',
          updatedBy: 'Auto Date System',
          updatedAt: new Date().toISOString()
        };
      });
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
      syncAllDatasetFiles(db);
    } catch (e) {}
  }
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = generateSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    syncAllDatasetFiles(seed);
    return seed;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.passwords) db.passwords = {};
    ensureTodaySession(db);
    syncAllDatasetFiles(db);
    return db;
  } catch (e) {
    const seed = generateSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    syncAllDatasetFiles(seed);
    return seed;
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  syncAllDatasetFiles(db);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, 200, { ok: true });
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API Routes
  if (pathname === '/api/bootstrap' && req.method === 'GET') {
    const db = loadDB();
    let promptText = '';
    if (fs.existsSync(PROMPT_FILE)) {
      promptText = fs.readFileSync(PROMPT_FILE, 'utf8');
    }
    return sendJSON(res, 200, { ...db, promptText });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { role, email, identifier, password } = await parseBody(req);
      const loginQuery = (email || identifier || '').trim().toLowerCase();
      const db = loadDB();

      // Admin and Users can use ANY password as requested!
      if (!loginQuery) {
        return sendJSON(res, 400, { error: 'Please enter your VIT Email, Reg. No., or Name to log in.' });
      }

      // Look up account in the VIT MITRA dataset by Email, VIT Reg No, or Member Name
      const matchedMember = db.members.find(
        (m) =>
          m.email.toLowerCase() === loginQuery ||
          m.regNo.toLowerCase() === loginQuery ||
          m.name.toLowerCase() === loginQuery ||
          `${m.regNo.toLowerCase()}@vishnu.edu.in` === loginQuery
      );

      if (!matchedMember) {
        return sendJSON(res, 401, {
          error: `Account "${email || identifier}" not found. Please enter a valid VIT Email (e.g. 24pa1a4297@vishnu.edu.in or 24pa1a4507@vishnu.edu.in), Reg No, or Name.`
        });
      }

      const cleanReg = matchedMember.regNo.toUpperCase();
      // Admin and Users can use ANY password as explicitly requested!

      const isDatasetAdmin = cleanReg === '24PA1A4297';
      const todayISO = formatDateISO(new Date());

      // Strict role separation: Only 24PA1A4297 (24pa1a4297@vishnu.edu.in) gets Admin rights;
      // All other members automatically receive 'user' (1-Person View-Only) mode.
      if (isDatasetAdmin && role !== 'user') {
        const todayStatus = (db.attendance[todayISO]?.[matchedMember.id]?.status || 'present').toUpperCase();
        return sendJSON(res, 200, {
          user: {
            role: 'admin',
            memberId: matchedMember.id,
            name: matchedMember.name,
            email: matchedMember.email,
            regNo: matchedMember.regNo,
            wing: matchedMember.wing,
            designation: matchedMember.role,
            statusToday: todayStatus,
            canEdit: true,
            isAuthorizedAdmin: true
          }
        });
      } else {
        const todayRec = db.attendance[todayISO]?.[matchedMember.id] || { status: 'present', note: '' };
        return sendJSON(res, 200, {
          user: {
            role: 'user',
            memberId: matchedMember.id,
            name: matchedMember.name,
            regNo: matchedMember.regNo,
            wing: matchedMember.wing,
            designation: matchedMember.role,
            email: matchedMember.email,
            statusToday: (todayRec.status || 'present').toUpperCase(),
            noteToday: todayRec.note || '',
            canEdit: false
          }
        });
      }
    } catch (err) {
      return sendJSON(res, 400, { error: 'Invalid login payload' });
    }
  }

  // Change / Update Password for Admin or Members
  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    try {
      const { identifier, newPassword, confirmPassword } = await parseBody(req);
      const query = (identifier || '').trim().toLowerCase();
      if (!query) {
        return sendJSON(res, 400, { error: 'Please enter your VIT Email or Reg. No.' });
      }
      if (!newPassword || newPassword.length < 2) {
        return sendJSON(res, 400, { error: 'New password must be at least 2 characters long.' });
      }
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return sendJSON(res, 400, { error: 'Passwords do not match. Please verify.' });
      }

      const db = loadDB();
      const matchedMember = db.members.find(
        (m) =>
          m.email.toLowerCase() === query ||
          m.regNo.toLowerCase() === query ||
          m.name.toLowerCase() === query ||
          `${m.regNo.toLowerCase()}@vishnu.edu.in` === query
      );

      if (!matchedMember) {
        return sendJSON(res, 404, { error: `Account "${identifier}" not found in Vishnu Institute of Technology roster.` });
      }

      const cleanReg = matchedMember.regNo.toUpperCase();
      if (!db.passwords) db.passwords = {};
      db.passwords[cleanReg] = newPassword;

      db.auditLogs.unshift({
        id: 'log-' + Date.now(),
        date: formatDateISO(new Date()),
        memberId: matchedMember.id,
        memberName: matchedMember.name,
        regNo: cleanReg,
        oldStatus: 'password_updated',
        newStatus: 'active',
        reason: `Password updated for ${matchedMember.name} (${cleanReg})`,
        correctedBy: matchedMember.name,
        timestamp: new Date().toISOString()
      });

      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        message: `Password updated successfully for ${matchedMember.name} (${cleanReg})!`,
        regNo: cleanReg,
        name: matchedMember.name
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Mark or Correct Single Attendance Entry (Admin Only)
  if (pathname === '/api/attendance/mark' && req.method === 'POST') {
    try {
      const { date, memberId, status, note, isCorrection, reason, adminName, sessionTitle, sessionType } = await parseBody(req);
      if (!date || !memberId || !status) {
        return sendJSON(res, 400, { error: 'date, memberId, and status are required' });
      }

      const db = loadDB();
      if (!db.sessions[date]) {
        db.sessions[date] = {
          date,
          title: sessionTitle || `Vishnu Institute of Technology Club Session (${date})`,
          type: sessionType || 'General Body Meet',
          updatedBy: adminName || 'Admin',
          updatedAt: new Date().toISOString()
        };
      } else if (sessionTitle) {
        db.sessions[date].title = sessionTitle;
        if (sessionType) db.sessions[date].type = sessionType;
      }

      if (!db.attendance[date]) {
        db.attendance[date] = {};
      }

      const existing = db.attendance[date][memberId];
      const oldStatus = existing ? existing.status : 'unmarked';
      const member = db.members.find((m) => m.id === memberId);

      db.attendance[date][memberId] = {
        status,
        note: note !== undefined ? note : (existing ? existing.note : ''),
        updatedBy: adminName || 'Admin',
        updatedAt: new Date().toISOString()
      };

      // Record in audit log if status changed or explicit date correction
      const todayStr = formatDateISO(new Date());
      if ((oldStatus !== 'unmarked' && oldStatus !== status) || isCorrection || date !== todayStr) {
        if (oldStatus !== status) {
          db.auditLogs.unshift({
            id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            date,
            memberId,
            memberName: member ? member.name : memberId,
            regNo: member ? member.regNo : '',
            oldStatus,
            newStatus: status,
            reason: reason || note || (date !== todayStr ? `Retroactive date attendance correction for ${date}` : 'Admin status update'),
            correctedBy: adminName || 'Admin (Aarav Sharma)',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Also auto-resolve any pending discrepancy for this member & date if matched
      db.discrepancies.forEach((d) => {
        if (d.date === date && d.memberId === memberId && d.status === 'pending') {
          d.status = 'resolved';
          d.resolvedAt = new Date().toISOString();
          d.resolvedWithStatus = status;
        }
      });

      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        date,
        memberId,
        record: db.attendance[date][memberId],
        session: db.sessions[date],
        auditLogs: db.auditLogs,
        discrepancies: db.discrepancies
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Bulk Mark Attendance for a Date (Admin Only)
  if (pathname === '/api/attendance/bulk' && req.method === 'POST') {
    try {
      const { date, status, memberIds, sessionTitle, sessionType, adminName, reason } = await parseBody(req);
      if (!date || !status) {
        return sendJSON(res, 400, { error: 'date and status are required' });
      }
      const db = loadDB();
      if (!db.sessions[date]) {
        db.sessions[date] = {
          date,
          title: sessionTitle || `Vishnu Institute of Technology Club Session (${date})`,
          type: sessionType || 'General Body Meet',
          updatedBy: adminName || 'Admin',
          updatedAt: new Date().toISOString()
        };
      } else {
        if (sessionTitle) db.sessions[date].title = sessionTitle;
        if (sessionType) db.sessions[date].type = sessionType;
        db.sessions[date].updatedAt = new Date().toISOString();
      }

      if (!db.attendance[date]) {
        db.attendance[date] = {};
      }

      const targets = Array.isArray(memberIds) && memberIds.length > 0
        ? db.members.filter((m) => memberIds.includes(m.id))
        : db.members;

      let changedCount = 0;
      targets.forEach((m) => {
        const prev = db.attendance[date][m.id]?.status || 'unmarked';
        if (prev !== status) changedCount++;
        db.attendance[date][m.id] = {
          status,
          note: db.attendance[date][m.id]?.note || '',
          updatedBy: adminName || 'Admin',
          updatedAt: new Date().toISOString()
        };
      });

      if (changedCount > 0) {
        db.auditLogs.unshift({
          id: 'log-' + Date.now(),
          date,
          memberId: 'BULK',
          memberName: `Bulk Update (${changedCount} members)`,
          regNo: 'ALL',
          oldStatus: 'mixed',
          newStatus: status,
          reason: reason || `Bulk marked ${changedCount} members as ${status.toUpperCase()} for ${date}`,
          correctedBy: adminName || 'Admin (Aarav Sharma)',
          timestamp: new Date().toISOString()
        });
      }

      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        date,
        attendanceForDate: db.attendance[date],
        session: db.sessions[date],
        auditLogs: db.auditLogs
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Member submits a Discrepancy / Wrong Attendance Flag
  if (pathname === '/api/discrepancies' && req.method === 'POST') {
    try {
      const { date, memberId, requestedStatus, reason } = await parseBody(req);
      if (!date || !memberId || !requestedStatus || !reason) {
        return sendJSON(res, 400, { error: 'All fields are required to flag wrong attendance.' });
      }
      const db = loadDB();
      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return sendJSON(res, 404, { error: 'Member not found' });
      }
      const currentStatus = db.attendance[date]?.[memberId]?.status || 'unmarked';
      const newFlag = {
        id: 'disc-' + Date.now(),
        date,
        memberId,
        memberName: member.name,
        regNo: member.regNo,
        wing: member.wing,
        currentStatus,
        requestedStatus,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.discrepancies.unshift(newFlag);
      saveDB(db);
      return sendJSON(res, 201, { ok: true, discrepancy: newFlag, discrepancies: db.discrepancies });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Admin resolves a Discrepancy Request (Approve & Correct or Dismiss)
  if (pathname === '/api/discrepancies/resolve' && req.method === 'POST') {
    try {
      const { id, action, adminNote, adminName } = await parseBody(req);
      const db = loadDB();
      const disc = db.discrepancies.find((d) => d.id === id);
      if (!disc) {
        return sendJSON(res, 404, { error: 'Discrepancy request not found' });
      }

      if (action === 'approve') {
        disc.status = 'resolved';
        disc.resolvedAt = new Date().toISOString();
        disc.adminNote = adminNote || 'Verified & corrected by Admin';

        if (!db.attendance[disc.date]) db.attendance[disc.date] = {};
        const oldStatus = db.attendance[disc.date][disc.memberId]?.status || disc.currentStatus;
        db.attendance[disc.date][disc.memberId] = {
          status: disc.requestedStatus,
          note: `Corrected via Member Flag: ${disc.reason}`,
          updatedBy: adminName || 'Admin',
          updatedAt: new Date().toISOString()
        };

        db.auditLogs.unshift({
          id: 'log-' + Date.now(),
          date: disc.date,
          memberId: disc.memberId,
          memberName: disc.memberName,
          regNo: disc.regNo,
          oldStatus,
          newStatus: disc.requestedStatus,
          reason: `Approved Discrepancy Request: "${disc.reason}"`,
          correctedBy: adminName || 'Admin (Aarav Sharma)',
          timestamp: new Date().toISOString()
        });
      } else {
        disc.status = 'rejected';
        disc.resolvedAt = new Date().toISOString();
        disc.adminNote = adminNote || 'Reviewed and declined by Admin';
      }

      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        discrepancies: db.discrepancies,
        attendance: db.attendance,
        auditLogs: db.auditLogs
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Add new Club Member (Admin Only)
  if (pathname === '/api/members' && req.method === 'POST') {
    try {
      const { name, regNo, branch, wing, role, batch, email, phone } = await parseBody(req);
      if (!name || !regNo) {
        return sendJSON(res, 400, { error: 'Name and VIT Reg. No. are required.' });
      }
      const db = loadDB();
      const cleanReg = regNo.trim().toUpperCase();
      const cleanName = name.trim();

      const existing = db.members.find((m) => m.regNo.toUpperCase() === cleanReg);
      if (existing) {
        return sendJSON(res, 400, { error: `Member with Reg. No. "${cleanReg}" already exists in the roster (${existing.name}).` });
      }

      const initials = cleanName
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'VM';

      const newMember = {
        id: 'm' + (Date.now() % 100000),
        regNo: cleanReg,
        name: cleanName,
        branch: (branch || 'AI&DS').trim(),
        team: wing && wing.toLowerCase().includes('technical') ? 'ai' : wing && wing.toLowerCase().includes('creativity') ? 'vc' : wing && wing.toLowerCase().includes('marketing') ? 'mk' : wing && wing.toLowerCase().includes('impact') ? 'ic' : 'core',
        wing: wing || 'General Body & Core Wing',
        role: role || 'Executive Member',
        batch: batch || '2024-28',
        email: email || `${cleanReg.toLowerCase()}@vishnu.edu.in`,
        phone: phone || '+91 98450 00000',
        avatar: initials,
        source: 'manual'
      };

      db.members.push(newMember);

      // Populate attendance for this new member across ALL session dates
      Object.keys(db.attendance).forEach((d) => {
        if (!db.attendance[d]) db.attendance[d] = {};
        db.attendance[d][newMember.id] = {
          status: 'present',
          note: 'Newly inducted member',
          updatedBy: 'Admin',
          updatedAt: new Date().toISOString()
        };
      });

      saveDB(db);
      return sendJSON(res, 201, { ok: true, member: newMember, members: db.members, attendance: db.attendance });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Reset Demo Database
  if (pathname === '/api/reset' && req.method === 'POST') {
    const seed = generateSeedData();
    saveDB(seed);
    return sendJSON(res, 200, { ok: true, ...seed });
  }

  // List & Preview All Dataset Files in the App
  if (pathname === '/api/datasets' && req.method === 'GET') {
    const db = loadDB();
    const datasetCatalog = [
      {
        filename: 'vit.xlsx',
        title: 'Master VIT MITRA Club Excel Roster (vit.xlsx)',
        category: 'Excel Roster',
        description: 'Official 68-member roster directly from vit.xlsx with Branch, Team, Regd No, and Name'
      },
      {
        filename: 'vit_mitra_members_roster.csv',
        title: 'Club Members Master Roster & Credentials (CSV)',
        category: 'Roster Dataset',
        description: 'All 68 club members with VIT Reg No, Branch, Team, Wing, Role, Email, Phone & Login Passwords'
      },
      {
        filename: 'vit_mitra_2026-09-23.csv',
        title: 'Daily Attendance Dataset (2026-09-23)',
        category: 'Daily Dataset',
        description: 'Official roll call & attendance status dataset for 2026-09-23'
      },
      {
        filename: 'vit_mitra_weekly_report.csv',
        title: 'Weekly 7-Day Attendance Matrix Dataset',
        category: 'Weekly Trackage',
        description: '7-day attendance grid and weekly percentage per club member'
      },
      {
        filename: 'vit_mitra_monthly_summary.csv',
        title: 'Monthly Attendance Summary & 75% Standing Dataset',
        category: 'Monthly Trackage',
        description: 'Member-wise monthly conducted sessions, Present, OD, Late, Absent, % and Standing'
      },
      {
        filename: 'vit_mitra_full_attendance_history.csv',
        title: 'Full Multi-Date Attendance History Dataset (All Sessions)',
        category: 'Complete History',
        description: 'Every single attendance entry across all conducted club sessions'
      },
      {
        filename: 'db.json',
        title: 'Complete Application JSON Database (db.json)',
        category: 'JSON Store',
        description: 'Raw persistent JSON database including members, sessions, attendance, flags & audit logs'
      }
    ].map((item) => {
      const fPath = path.join(DATA_DIR, item.filename);
      let content = '';
      let sizeBytes = 0;
      let rowCount = 0;
      if (fs.existsSync(fPath)) {
        sizeBytes = fs.statSync(fPath).size;
        if (item.filename.endsWith('.csv') || item.filename.endsWith('.json')) {
          content = fs.readFileSync(fPath, 'utf8');
          rowCount = item.filename.endsWith('.csv') ? Math.max(0, content.trim().split('\n').length - 1) : db.members.length;
        } else if (item.filename.endsWith('.xlsx')) {
          rowCount = 68;
          content = 'Binary Excel Spreadsheet: 68 club members across AI&DS, AI&ML, CSE, IT, ECE, CSBS, MECH with Teams (AI, VC, MK, IC).';
        }
      }
      return {
        ...item,
        path: fPath,
        sizeBytes,
        rowCount,
        preview: content.split('\n').slice(0, 20).join('\n')
      };
    });

    return sendJSON(res, 200, { ok: true, datasets: datasetCatalog });
  }

  // Download a Specific Dataset File
  if (pathname === '/api/datasets/download' && req.method === 'GET') {
    const fileParam = path.basename(parsedUrl.query.file || 'vit_mitra_2026-09-23.csv');
    let fPath = path.join(DATA_DIR, fileParam);
    if (!fs.existsSync(fPath) && fileParam === 'vit.xlsx') {
      fPath = path.join(__dirname, 'vit.xlsx');
    }
    if (!fs.existsSync(fPath)) {
      return sendJSON(res, 404, { error: 'Dataset file not found' });
    }
    let contentType = 'text/csv; charset=utf-8';
    if (fileParam.endsWith('.json')) contentType = 'application/json; charset=utf-8';
    else if (fileParam.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileParam}"`
    });
    return fs.createReadStream(fPath).pipe(res);
  }

  // Import CSV Attendance Dataset into App
  if (pathname === '/api/datasets/import' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const rawCsv = body.csvText;
      const csvText = Array.isArray(rawCsv) ? rawCsv.join('\n') : String(rawCsv?.value || rawCsv || '');
      const adminName = body.adminName;
      if (!csvText || !csvText.trim()) {
        return sendJSON(res, 400, { error: 'CSV content is empty' });
      }
      const db = loadDB();
      const lines = csvText.trim().split(/\r?\n/);
      let importedRows = 0;
      let updatedDates = new Set();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith('vit reg no')) continue;
        // Parse CSV line: VIT Reg No,Member Name,Wing,Role,Date,Status,Note
        const cleanParts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
        if (cleanParts.length < 6) continue;

        const [regNo, memberName, wing, role, dateStr, statusRaw, ...noteRest] = cleanParts;
        const note = noteRest.join(',').replace(/^"|"$/g, '');
        const status = (statusRaw || 'PRESENT').toLowerCase();
        if (!['present', 'absent', 'late', 'od'].includes(status)) continue;

        let member = db.members.find((m) => m.regNo.toUpperCase() === regNo.toUpperCase());
        if (!member && regNo && memberName) {
          member = {
            id: 'm' + (Date.now() % 100000) + i,
            regNo: regNo.toUpperCase(),
            name: memberName,
            wing: wing || 'Technical',
            role: role || 'Executive Member',
            batch: '2024-28',
            email: `${regNo.toLowerCase()}@vishnu.edu.in`,
            phone: '+91 98450 00000',
            avatar: memberName.slice(0, 2).toUpperCase()
          };
          db.members.push(member);
        }

        if (member && dateStr) {
          if (!db.sessions[dateStr]) {
            db.sessions[dateStr] = {
              date: dateStr,
              title: `Imported Dataset Session (${dateStr})`,
              type: 'General Body Meet',
              updatedBy: adminName || 'Admin (24PA1A4297)',
              updatedAt: new Date().toISOString()
            };
          }
          if (!db.attendance[dateStr]) db.attendance[dateStr] = {};
          db.attendance[dateStr][member.id] = {
            status,
            note: note || '',
            updatedBy: adminName || 'Admin (24PA1A4297)',
            updatedAt: new Date().toISOString()
          };
          importedRows++;
          updatedDates.add(dateStr);
        }
      }

      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        importedRows,
        updatedDates: Array.from(updatedDates),
        members: db.members,
        sessions: db.sessions,
        attendance: db.attendance
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // Static File Serving
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to index.html for SPA
    const indexFile = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexFile).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  Vishnu Institute of Technology Attendance System running on port ${PORT}`);
  console.log(`  Open: http://localhost:${PORT}`);
  console.log(`========================================================`);
});
