const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROOT_DIR = path.join(__dirname, '..');
const xlsxMembers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'xlsx_members.json'), 'utf8'));

// Copy vit.xlsx into data/ and dist/data/
const xlsxSrc = path.join(ROOT_DIR, 'vit.xlsx');
if (fs.existsSync(xlsxSrc)) {
  fs.copyFileSync(xlsxSrc, path.join(DATA_DIR, 'vit.xlsx'));
  const distData = path.join(ROOT_DIR, 'dist', 'data');
  if (fs.existsSync(distData)) {
    fs.copyFileSync(xlsxSrc, path.join(distData, 'vit.xlsx'));
  }
}

function getWingAndRole(team, regNo) {
  if (regNo.toUpperCase() === '24PA1A4297') {
    return {
      wing: 'Technical & Visual Media (Admin)',
      role: 'Club Admin & President'
    };
  }
  switch ((team || '').toLowerCase()) {
    case 'ai':
      return { wing: 'AI & Technical Wing', role: 'AI & Technical Core' };
    case 'vc':
      return { wing: 'Visual Creativity & Media Wing', role: 'Visual Media Core' };
    case 'mk':
      return { wing: 'Marketing & Outreach Wing', role: 'Marketing & PR Lead' };
    case 'ic':
      return { wing: 'Impact & Community Wing', role: 'Social Impact Coordinator' };
    default:
      return { wing: 'General Body & Core Wing', role: 'Executive Club Member' };
  }
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// 1. Build members list from vit.xlsx (68 members)
const members = [];
let mIndex = 1;

xlsxMembers.forEach((raw) => {
  const { wing, role } = getWingAndRole(raw.team, raw.regNo);
  const isLateral = raw.regNo.startsWith('25PA5');
  const batch = isLateral ? '2024-28 (LE)' : raw.regNo.startsWith('24') ? '2024-28' : '2023-27';
  const email = `${raw.regNo.toLowerCase()}@vishnu.edu.in`;
  const phone = `+91 98450 ${String(11000 + mIndex).padStart(5, '0')}`;

  members.push({
    id: `m${mIndex}`,
    regNo: raw.regNo.trim().toUpperCase(),
    name: raw.name.trim(),
    branch: raw.branch.trim(),
    team: (raw.team || '').trim().toLowerCase(),
    wing,
    role,
    batch,
    email,
    phone,
    avatar: getInitials(raw.name),
    source: 'vit.xlsx'
  });
  mIndex++;
});

// 2. Also append the 15 mock members from the earlier test table so no previous login ever breaks
const legacyMockMembers = [
  { regNo: '24PA1A4201', name: 'Diya Nair', wing: 'Management & Events', role: 'Vice President', branch: 'AI&ML' },
  { regNo: '24PA1A4218', name: 'Rohan Verma', wing: 'Technical', role: 'Technical Lead', branch: 'AI&ML' },
  { regNo: '24PA1A4234', name: 'Ananya Krishnan', wing: 'PR & Outreach', role: 'Outreach Secretary', branch: 'AI&ML' },
  { regNo: '24PA1A4255', name: 'Karthik Reddy', wing: 'Design & Media', role: 'Creative Head', branch: 'AI&ML' },
  { regNo: '24PA1A4262', name: 'Sneha Iyer', wing: 'Social Impact', role: 'Mitra Drive Coordinator', branch: 'AI&ML' },
  { regNo: '23PA1A0590', name: 'Vikramaditya Rao', wing: 'Management & Events', role: 'Logistics Lead', branch: 'CSE' },
  { regNo: '23PA1A4276', name: 'Meera Deshmukh', wing: 'Technical', role: 'Full-Stack Core', branch: 'AI&ML' },
  { regNo: '24PA1A4223', name: 'Aditya Kulkarni', wing: 'Technical', role: 'Executive Member', branch: 'AI&ML' },
  { regNo: '24PA1A4277', name: 'Priya Menon', wing: 'Design & Media', role: 'UI/UX Designer', branch: 'AI&ML' },
  { regNo: '24PA1A4240', name: 'Siddharth Joshi', wing: 'PR & Outreach', role: 'Sponsorship Core', branch: 'AI&ML' },
  { regNo: '24PA1A4232', name: 'Nandini Gupta', wing: 'Social Impact', role: 'Community Volunteer', branch: 'AI&ML' },
  { regNo: '24PA1A0498', name: 'Harshvardhan Singh', wing: 'Management & Events', role: 'Event Coordinator', branch: 'ECE' },
  { regNo: '24PA1A1221', name: 'Tanvi Chatterjee', wing: 'PR & Outreach', role: 'Editorial & Content', branch: 'IT' },
  { regNo: '24PA1A4289', name: 'Pranav Subramanian', wing: 'Technical', role: 'AI/ML Member', branch: 'AI&ML' },
  { regNo: '24PA1A4294', name: 'Ishaan Malhotra', wing: 'Social Impact', role: 'Field Outreach Member', branch: 'AI&ML' }
];

legacyMockMembers.forEach((lm) => {
  if (!members.some((m) => m.regNo === lm.regNo)) {
    members.push({
      id: `m${mIndex}`,
      regNo: lm.regNo,
      name: lm.name,
      branch: lm.branch,
      team: 'core',
      wing: lm.wing,
      role: lm.role,
      batch: '2024-28',
      email: `${lm.regNo.toLowerCase()}@vishnu.edu.in`,
      phone: `+91 98450 ${String(11000 + mIndex).padStart(5, '0')}`,
      avatar: getInitials(lm.name),
      source: 'sample'
    });
    mIndex++;
  }
});

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const sessionTemplates = [
  { title: 'Weekly General Body Meet (GBM)', type: 'General Body Meet' },
  { title: 'VIT Mitra Social Outreach Drive Planning', type: 'Outreach Drive' },
  { title: 'Rivera / Gravitas Club Stall Coordination', type: 'Event Prep' },
  { title: 'Technical & Web Portal Sprint Sync', type: 'Tech Workshop' },
  { title: 'Core Committee Review & Budget Meet', type: 'Core Sync' },
  { title: 'Campus Mentorship & Freshers Orientation', type: 'Outreach Drive' },
  { title: 'Design & Social Media Campaign Review', type: 'Creative Sync' }
];

const today = new Date('2026-09-26T10:00:00Z');
const sessions = {};
const attendance = {};

// Seed 38 past sessions
for (let offset = 38; offset >= 0; offset--) {
  const d = new Date(today);
  d.setDate(today.getDate() - offset);
  const dateStr = formatDateISO(d);
  const dayOfWeek = d.getDay();

  if (dayOfWeek === 0 && offset % 3 !== 0) continue;

  const tpl = sessionTemplates[(38 - offset) % sessionTemplates.length];
  sessions[dateStr] = {
    date: dateStr,
    title: offset === 0 ? 'Today — VIT MITRA General Body & Attendance Review' : tpl.title,
    type: tpl.type,
    updatedBy: 'Admin (24PA1A4297 / R Revanth)',
    updatedAt: new Date(d.getTime() + 17 * 3600 * 1000).toISOString()
  };

  attendance[dateStr] = {};
  members.forEach((m, idx) => {
    const hash = (offset * 17 + idx * 11 + d.getDate() * 5) % 100;
    let status = 'present';
    let note = '';

    if (m.regNo === '24PA1A4297') {
      status = 'present';
    } else if (hash < 8) {
      status = 'absent';
    } else if (hash < 14) {
      status = 'late';
    } else if (hash < 20) {
      status = 'od';
      note = 'On-Duty: Club stall / Campus event coordination';
    } else {
      status = 'present';
    }

    attendance[dateStr][m.id] = {
      status,
      note,
      updatedBy: 'Admin (24PA1A4297 / R Revanth)',
      updatedAt: sessions[dateStr].updatedAt
    };
  });
}

// Ensure 2026-09-23 has exact statuses for the 16 members from previous table
const exactMap = {
  '24PA1A4297': { status: 'present', note: '' },
  '24PA1A4201': { status: 'od', note: '' },
  '24PA1A4218': { status: 'present', note: '' },
  '24PA1A4234': { status: 'present', note: '' },
  '24PA1A4255': { status: 'od', note: '' },
  '24PA1A4262': { status: 'late', note: '' },
  '23PA1A0590': { status: 'present', note: '' },
  '23PA1A4276': { status: 'od', note: 'On-Duty: Club stall / Poster duty' },
  '24PA1A4223': { status: 'od', note: '' },
  '24PA1A4277': { status: 'present', note: '' },
  '24PA1A4240': { status: 'absent', note: '' },
  '24PA1A4232': { status: 'absent', note: '' },
  '24PA1A0498': { status: 'present', note: '' },
  '24PA1A1221': { status: 'late', note: '' },
  '24PA1A4289': { status: 'late', note: '' },
  '24PA1A4294': { status: 'present', note: '' }
};

if (!sessions['2026-09-23']) {
  sessions['2026-09-23'] = {
    date: '2026-09-23',
    title: 'VIT MITRA Official Roll Call & Attendance Dataset (2026-09-23)',
    type: 'General Body Meet',
    updatedBy: 'Admin (24PA1A4297 / R Revanth)',
    updatedAt: '2026-09-23T17:00:00Z'
  };
  attendance['2026-09-23'] = {};
}

members.forEach((m) => {
  if (exactMap[m.regNo]) {
    attendance['2026-09-23'][m.id] = {
      status: exactMap[m.regNo].status,
      note: exactMap[m.regNo].note,
      updatedBy: 'Admin (24PA1A4297 / R Revanth)',
      updatedAt: '2026-09-23T17:00:00Z'
    };
  } else if (!attendance['2026-09-23'][m.id]) {
    attendance['2026-09-23'][m.id] = {
      status: 'present',
      note: '',
      updatedBy: 'Admin (24PA1A4297 / R Revanth)',
      updatedAt: '2026-09-23T17:00:00Z'
    };
  }
});

const discrepancies = [
  {
    id: 'disc-101',
    date: '2026-09-22',
    memberId: members.find((m) => m.regNo === '24PA1A4511')?.id || 'm2',
    memberName: 'A Sai Kiran',
    regNo: '24PA1A4511',
    wing: 'AI & Technical Wing',
    currentStatus: 'absent',
    requestedStatus: 'present',
    reason: 'I was setting up the AI lab projector in AB1-304 during initial roll call.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  },
  {
    id: 'disc-102',
    date: '2026-09-20',
    memberId: members.find((m) => m.regNo === '24PA1A4520')?.id || 'm3',
    memberName: 'B Mythili',
    regNo: '24PA1A4520',
    wing: 'Marketing & Outreach Wing',
    currentStatus: 'absent',
    requestedStatus: 'od',
    reason: 'Was at DSW getting VIT MITRA event sponsorship approval letter signed.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
  }
];

const auditLogs = [
  {
    id: 'log-201',
    date: '2026-09-21',
    memberId: members.find((m) => m.regNo === '24PA1A4542')?.id || 'm5',
    memberName: 'G Jaswanth Vamsi',
    regNo: '24PA1A4542',
    oldStatus: 'absent',
    newStatus: 'present',
    reason: 'Verified via attendance register signature — corrected wrong entry on 2026-09-21',
    correctedBy: 'Admin (24PA1A4297 / R Revanth)',
    timestamp: new Date(Date.now() - 3600 * 1000 * 28).toISOString()
  }
];

const finalDB = {
  members,
  sessions,
  attendance,
  discrepancies,
  auditLogs
};

fs.writeFileSync(path.join(DATA_DIR, 'db.json'), JSON.stringify(finalDB, null, 2), 'utf8');
console.log(`Generated db.json with ${members.length} members (${xlsxMembers.length} from vit.xlsx)!`);
