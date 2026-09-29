const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LOCAL_DB = path.join(DATA_DIR, 'db.json');
const TMP_DIR = path.join('/tmp', 'vit_mitra_data');
const TMP_DB = path.join(TMP_DIR, 'db.json');
const PROMPT_FILE = path.join(ROOT_DIR, 'MASTER_PROMPT.md');

let memoryDb = null;

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeCSV(val) {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
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

  const today = new Date();
  const sessions = {};
  const attendance = {};

  const sessionTemplates = [
    { title: 'Weekly General Body Meet (GBM)', type: 'General Body Meet' },
    { title: 'Vishnu Institute of Technology Mitra Outreach Drive', type: 'Outreach Drive' },
    { title: 'Technical Workshop & Hands-on Lab', type: 'Tech Workshop' },
    { title: 'Design & Social Media Campaign Sync', type: 'Creative Sync' }
  ];

  for (let offset = 35; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const dateStr = formatDateISO(d);
    const tpl = sessionTemplates[(35 - offset) % sessionTemplates.length];

    sessions[dateStr] = {
      date: dateStr,
      title: offset === 0 ? `Today — Vishnu Institute of Technology Daily Session (${dateStr})` : tpl.title,
      type: tpl.type,
      updatedBy: 'Admin (24PA1A4297)',
      updatedAt: new Date(d.getTime() + 17 * 3600 * 1000).toISOString()
    };

    attendance[dateStr] = {};
    members.forEach((m) => {
      attendance[dateStr][m.id] = {
        status: 'present',
        note: '',
        updatedBy: 'Admin (24PA1A4297)',
        updatedAt: sessions[dateStr].updatedAt
      };
    });
  }

  return {
    members,
    sessions,
    attendance,
    discrepancies: [],
    auditLogs: [],
    passwords: {}
  };
}

function syncAllDatasetFiles(db) {
  try {
    const targetDir = fs.existsSync(TMP_DIR) ? TMP_DIR : (fs.existsSync(DATA_DIR) ? DATA_DIR : null);
    if (!targetDir) return;

    const rosterHeader = 'Member ID,VIT Reg No,Member Name,Branch,Team,Wing,Role,Batch,Email,Phone,Default Password,Source';
    const rosterRows = db.members.map((m) => {
      const pass = m.email === '24pa1a4297@vishnu.edu.in' ? 'admin123' : 'member123';
      return [m.id, m.regNo, m.name, m.branch || 'N/A', m.team || 'N/A', m.wing, m.role, m.batch, m.email, m.phone, pass, m.source || 'vit.xlsx'].map(escapeCSV).join(',');
    });
    try { fs.writeFileSync(path.join(targetDir, 'vit_mitra_members_roster.csv'), [rosterHeader, ...rosterRows].join('\n'), 'utf8'); } catch (e) {}
  } catch (err) {}
}

function ensureTodaySession(db) {
  const todayISO = formatDateISO(new Date());
  if (!db.sessions) db.sessions = {};
  if (!db.attendance) db.attendance = {};
  if (!db.sessions[todayISO]) {
    db.sessions[todayISO] = {
      date: todayISO,
      title: `Today — Vishnu Institute of Technology Daily Session (${todayISO})`,
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
  }
}

function loadDB() {
  if (memoryDb) {
    ensureTodaySession(memoryDb);
    return memoryDb;
  }

  // 1. Try reading from /tmp (writable in serverless)
  try {
    if (fs.existsSync(TMP_DB)) {
      memoryDb = JSON.parse(fs.readFileSync(TMP_DB, 'utf8'));
      if (!memoryDb.passwords) memoryDb.passwords = {};
      ensureTodaySession(memoryDb);
      return memoryDb;
    }
  } catch (e) {}

  // 2. Try reading bundled seed data/db.json
  try {
    if (fs.existsSync(LOCAL_DB)) {
      memoryDb = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf8'));
      if (!memoryDb.passwords) memoryDb.passwords = {};
      ensureTodaySession(memoryDb);
      try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
        fs.writeFileSync(TMP_DB, JSON.stringify(memoryDb, null, 2), 'utf8');
      } catch (e) {}
      return memoryDb;
    }
  } catch (e) {}

  // 3. Fallback to code seed generator
  memoryDb = generateSeedData();
  ensureTodaySession(memoryDb);
  try {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(TMP_DB, JSON.stringify(memoryDb, null, 2), 'utf8');
  } catch (e) {}
  return memoryDb;
}

function saveDB(db) {
  memoryDb = db;
  // Write to /tmp
  try {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.writeFileSync(TMP_DB, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {}

  // Write to local repo file if writable (local dev)
  try {
    if (fs.existsSync(DATA_DIR)) {
      fs.writeFileSync(LOCAL_DB, JSON.stringify(db, null, 2), 'utf8');
    }
  } catch (e) {}

  syncAllDatasetFiles(db);
}

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJSON(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = (parsedUrl.pathname || '').replace(/\/+$/, '');

  // Handle URL normalization when invoked through Vercel rewrites
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-url'] || parsedUrl.query.__url;
  if (pathname === '/api' || pathname === '/api/index' || pathname === '/api/index.js' || pathname === '') {
    if (matchedPath && matchedPath.startsWith('/api')) {
      pathname = url.parse(matchedPath, true).pathname.replace(/\/+$/, '');
    }
  }

  // Ensure it starts with /api for consistency
  if (!pathname.startsWith('/api') && pathname.length > 0) {
    pathname = '/api' + pathname;
  }

  // Health check / API catalog
  if (pathname === '/api' || pathname === '') {
    return sendJSON(res, 200, {
      service: 'Vishnu Institute of Technology — MITRA Attendance System API',
      status: 'online',
      environment: process.env.VERCEL ? 'vercel-serverless' : 'node-local',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET  /api/bootstrap',
        'POST /api/auth/login',
        'POST /api/auth/change-password',
        'POST /api/attendance/mark',
        'POST /api/attendance/bulk',
        'POST /api/discrepancies',
        'POST /api/discrepancies/resolve',
        'POST /api/members',
        'POST /api/reset',
        'GET  /api/datasets',
        'GET  /api/datasets/download',
        'POST /api/datasets/import'
      ]
    });
  }

  // 1. Bootstrap State
  if (pathname === '/api/bootstrap' && req.method === 'GET') {
    const db = loadDB();
    let promptText = '';
    if (fs.existsSync(PROMPT_FILE)) {
      try {
        promptText = fs.readFileSync(PROMPT_FILE, 'utf8');
      } catch (e) {}
    }
    return sendJSON(res, 200, { ...db, promptText });
  }

  // 2. Authentication Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { role, email, identifier } = await parseBody(req);
      const loginQuery = (email || identifier || '').trim().toLowerCase();
      const db = loadDB();

      if (!loginQuery) {
        return sendJSON(res, 400, { error: 'Please enter your VIT Email, Reg. No., or Name to log in.' });
      }

      const matchedMember = db.members.find(
        (m) =>
          m.email.toLowerCase() === loginQuery ||
          m.regNo.toLowerCase() === loginQuery ||
          m.name.toLowerCase() === loginQuery ||
          `${m.regNo.toLowerCase()}@vishnu.edu.in` === loginQuery
      );

      if (!matchedMember) {
        return sendJSON(res, 401, {
          error: `Account "${email || identifier}" not found. Please enter a valid VIT Email (e.g. 24pa1a4297@vishnu.edu.in), Reg No, or Name.`
        });
      }

      const cleanReg = matchedMember.regNo.toUpperCase();
      const isDatasetAdmin = cleanReg === '24PA1A4297';
      const todayISO = formatDateISO(new Date());

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
        let totalSessions = 0;
        let attendedSessions = 0;
        let presentCount = 0;
        let odCount = 0;
        let lateCount = 0;
        let absentCount = 0;

        Object.keys(db.attendance).forEach((d) => {
          const rec = db.attendance[d]?.[matchedMember.id];
          if (rec && rec.status) {
            totalSessions++;
            if (rec.status === 'present') {
              presentCount++;
              attendedSessions++;
            } else if (rec.status === 'od') {
              odCount++;
              attendedSessions++;
            } else if (rec.status === 'late') {
              lateCount++;
              attendedSessions++;
            } else if (rec.status === 'absent') {
              absentCount++;
            }
          }
        });

        const attendancePct = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 1000) / 10 : 100;
        const myDiscrepancies = db.discrepancies.filter((disc) => disc.memberId === matchedMember.id);

        return sendJSON(res, 200, {
          user: {
            role: 'user',
            memberId: matchedMember.id,
            name: matchedMember.name,
            email: matchedMember.email,
            regNo: matchedMember.regNo,
            branch: matchedMember.branch || 'AI&DS',
            wing: matchedMember.wing,
            designation: matchedMember.role,
            batch: matchedMember.batch,
            phone: matchedMember.phone,
            avatar: matchedMember.avatar,
            canEdit: false,
            isAuthorizedAdmin: false,
            todayRecord: todayRec,
            statusToday: (todayRec.status || 'present').toUpperCase(),
            noteToday: todayRec.note || '',
            stats: {
              totalSessions,
              attendedSessions,
              presentCount,
              odCount,
              lateCount,
              absentCount,
              attendancePct
            },
            discrepancies: myDiscrepancies
          }
        });
      }
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 3. Change Password
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

  // 4. Mark or Correct Attendance
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
          updatedBy: adminName || 'Admin (24PA1A4297)',
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
        updatedBy: adminName || 'Admin (24PA1A4297)',
        updatedAt: new Date().toISOString()
      };

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
            correctedBy: adminName || 'Admin (24PA1A4297)',
            timestamp: new Date().toISOString()
          });
        }
      }

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

  // 5. Bulk Mark Attendance
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
          updatedBy: adminName || 'Admin (24PA1A4297)',
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
          updatedBy: adminName || 'Admin (24PA1A4297)',
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
          correctedBy: adminName || 'Admin (24PA1A4297)',
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

  // 6. Submit Discrepancy Flag
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

  // 7. Resolve Discrepancy Request
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
          updatedBy: adminName || 'Admin (24PA1A4297)',
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
          correctedBy: adminName || 'Admin (24PA1A4297)',
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

  // 8. Add Member
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

      Object.keys(db.attendance).forEach((d) => {
        if (!db.attendance[d]) db.attendance[d] = {};
        db.attendance[d][newMember.id] = {
          status: 'present',
          note: 'Newly inducted member',
          updatedBy: 'Admin (24PA1A4297)',
          updatedAt: new Date().toISOString()
        };
      });

      saveDB(db);
      return sendJSON(res, 201, { ok: true, member: newMember, members: db.members, attendance: db.attendance });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 9. Reset Demo Database
  if (pathname === '/api/reset' && req.method === 'POST') {
    const seed = generateSeedData();
    saveDB(seed);
    return sendJSON(res, 200, { ok: true, ...seed });
  }

  // 10. List Datasets
  if (pathname === '/api/datasets' && req.method === 'GET') {
    const db = loadDB();
    const datasetCatalog = [
      {
        filename: 'vit.xlsx',
        title: 'Master Vishnu Institute of Technology Excel Roster (vit.xlsx)',
        category: 'Excel Roster',
        description: 'Official 68-member roster directly from vit.xlsx with Branch, Team, Regd No, and Name'
      },
      {
        filename: 'vit_mitra_members_roster.csv',
        title: 'Club Members Master Roster & Credentials (CSV)',
        category: 'Roster Dataset',
        description: 'All club members with VIT Reg No, Branch, Team, Wing, Role, Email, Phone & Login Passwords'
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
      let fPath = path.join(DATA_DIR, item.filename);
      if (!fs.existsSync(fPath) && item.filename === 'vit.xlsx') {
        fPath = path.join(ROOT_DIR, 'vit.xlsx');
      }
      let content = '';
      let sizeBytes = 0;
      let rowCount = 0;
      if (fs.existsSync(fPath)) {
        sizeBytes = fs.statSync(fPath).size;
        if (item.filename.endsWith('.csv') || item.filename.endsWith('.json')) {
          try {
            content = fs.readFileSync(fPath, 'utf8');
            rowCount = item.filename.endsWith('.csv') ? Math.max(0, content.trim().split('\n').length - 1) : db.members.length;
          } catch (e) {}
        } else if (item.filename.endsWith('.xlsx')) {
          rowCount = 68;
          content = 'Binary Excel Spreadsheet: 68 club members across AI&DS, AI&ML, CSE, IT, ECE, CSBS, MECH with Teams (AI, VC, MK, IC).';
        }
      }
      return {
        ...item,
        path: `data/${item.filename}`,
        sizeBytes,
        rowCount,
        preview: content.split('\n').slice(0, 20).join('\n')
      };
    });

    return sendJSON(res, 200, { ok: true, datasets: datasetCatalog });
  }

  // 11. Download Dataset File
  if (pathname === '/api/datasets/download' && req.method === 'GET') {
    const fileParam = path.basename(parsedUrl.query.file || 'vit_mitra_2026-09-23.csv');
    let fPath = path.join(TMP_DIR, fileParam);
    if (!fs.existsSync(fPath)) {
      fPath = path.join(DATA_DIR, fileParam);
    }
    if (!fs.existsSync(fPath) && fileParam === 'vit.xlsx') {
      fPath = path.join(ROOT_DIR, 'vit.xlsx');
    }
    if (!fs.existsSync(fPath)) {
      return sendJSON(res, 404, { error: 'Dataset file not found' });
    }
    let contentType = 'text/csv; charset=utf-8';
    if (fileParam.endsWith('.json')) contentType = 'application/json; charset=utf-8';
    else if (fileParam.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileParam}"`);
    return fs.createReadStream(fPath).pipe(res);
  }

  // 12. Import CSV Dataset
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

  // If no endpoint matched
  return sendJSON(res, 404, { error: `Endpoint not found: ${pathname}` });
};
