// Vishnu Institute of Technology — Club Attendance Management System Frontend Logic

const state = {
  currentUser: {
    role: 'admin', // 'admin' | 'user'
    memberId: 'm3', // Used when role === 'user' (defaults to Rohan Verma 22BCE1318)
    name: 'Aarav Sharma (Club Admin)',
    regNo: '22BCE1045',
    canEdit: true
  },
  activeTab: 'daily',
  selectedDate: '', // YYYY-MM-DD
  todayDate: '',
  weekOffset: 0, // 0 = current 7-day window ending today
  selectedMonth: '', // YYYY-MM
  members: [],
  sessions: {},
  attendance: {},
  discrepancies: [],
  auditLogs: [],
  promptText: '',
  loginModalSelectedRole: 'admin'
};

// Chart.js instances
let weeklyBarChartInstance = null;
let weeklyWingChartInstance = null;
let monthlyLineChartInstance = null;
let monthlyDoughnutChartInstance = null;

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  const bgMap = {
    success: 'bg-slate-900 text-white border-emerald-500',
    warning: 'bg-amber-950 text-amber-100 border-amber-400',
    error: 'bg-rose-950 text-rose-100 border-rose-400',
    info: 'bg-indigo-950 text-indigo-100 border-indigo-400'
  };
  el.className = `toast-item px-4 py-3 rounded-xl shadow-xl border-l-4 text-xs font-bold flex items-center gap-2.5 max-w-sm ${bgMap[type] || bgMap.success}`;
  el.innerHTML = `<span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

// Compute member's overall attendance stats across all recorded sessions
function getMemberOverallStats(memberId) {
  const sessionDates = Object.keys(state.attendance).sort();
  let total = 0;
  let present = 0;
  let od = 0;
  let late = 0;
  let absent = 0;

  sessionDates.forEach((d) => {
    const rec = state.attendance[d]?.[memberId];
    if (rec && rec.status) {
      total++;
      if (rec.status === 'present') present++;
      else if (rec.status === 'od') od++;
      else if (rec.status === 'late') late++;
      else if (rec.status === 'absent') absent++;
    }
  });

  const attended = present + od + late;
  const pct = total > 0 ? Math.round((attended / total) * 1000) / 10 : 100;
  return { total, present, od, late, absent, attended, pct };
}

// Initialize Application
async function initApp() {
  try {
    let data = null;
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        data = await res.json();
      }
    } catch (fetchErr) {
      data = window.__VIT_MITRA_EMBEDDED_BOOTSTRAP__ || null;
    }
    if (!data && window.__VIT_MITRA_EMBEDDED_BOOTSTRAP__) {
      data = window.__VIT_MITRA_EMBEDDED_BOOTSTRAP__;
    }
    if (!data) throw new Error('No bootstrap data');

    state.members = data.members || [];
    state.sessions = data.sessions || {};
    state.attendance = data.attendance || {};
    state.discrepancies = data.discrepancies || [];
    state.auditLogs = data.auditLogs || [];
    state.promptText = data.promptText || '';
    try {
      state.passwords = data.passwords || JSON.parse(localStorage.getItem('vit_mitra_custom_passwords') || '{}');
    } catch (e) {
      state.passwords = {};
    }
    if (data.embeddedDatasets) {
      cachedDatasets = data.embeddedDatasets;
    }

    const allDates = Object.keys(state.attendance).sort();
    // Automatically set to today's live system date
    const liveToday = formatDateISO(new Date());
    state.todayDate = liveToday;
    state.selectedDate = liveToday;
    state.autoDateEnabled = true;

    // Automatically ensure today's session and attendance exist in state
    if (!state.sessions[liveToday]) {
      state.sessions[liveToday] = {
        date: liveToday,
        title: `Today — Vishnu Institute of Technology Daily Session (${liveToday})`,
        type: 'General Body Meet',
        updatedBy: 'Auto Date System'
      };
    }
    if (!state.attendance[liveToday]) {
      state.attendance[liveToday] = {};
      state.members.forEach((m) => {
        state.attendance[liveToday][m.id] = {
          status: 'present',
          note: '',
          updatedBy: 'Auto Date System'
        };
      });
    }

    // Populate month dropdown
    populateMonthSelector();
    // Populate member selectors in header, login modal, correction form, and flag modal
    populateMemberDropdowns();

    // Set default correction date to yesterday so Admin immediately sees how date correction works
    const yesterdayDate = allDates.length >= 2 ? allDates[allDates.length - 2] : state.todayDate;
    const corrDateInput = document.getElementById('corr-date-input');
    if (corrDateInput) corrDateInput.value = yesterdayDate;

    const flagDateInput = document.getElementById('flag-date-input');
    if (flagDateInput) flagDateInput.value = yesterdayDate;

    const promptBox = document.getElementById('master-prompt-box');
    if (promptBox) promptBox.textContent = state.promptText;

    syncRoleUI();
    renderAllActiveViews();
    updateAutoDateUI();
  } catch (err) {
    console.error('Failed to bootstrap app:', err);
    showToast('Error loading attendance database', 'error');
  }
}

function populateMonthSelector() {
  const select = document.getElementById('monthly-selector');
  if (!select) return;

  const monthsSet = new Set();
  Object.keys(state.attendance).forEach((d) => {
    monthsSet.add(d.slice(0, 7));
  });
  const months = Array.from(monthsSet).sort().reverse();
  if (months.length === 0) {
    months.push(formatDateISO(new Date()).slice(0, 7));
  }
  state.selectedMonth = state.selectedMonth || months[0];

  select.innerHTML = months
    .map((m) => {
      const [yr, mo] = m.split('-').map(Number);
      const label = new Date(yr, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      return `<option value="${m}" ${m === state.selectedMonth ? 'selected' : ''}>${label} (${m})</option>`;
    })
    .join('');
}

function populateMemberDropdowns() {
  const optionsHtml = state.members
    .map((m) => `<option value="${m.id}">${m.regNo} — ${m.name} (${m.wing} • ${m.email})</option>`)
    .join('');

  const ids = ['member-persona-select', 'login-member-select', 'corr-member-select', 'flag-member-select', 'gate-member-select'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = optionsHtml;
      if (state.currentUser.memberId) {
        el.value = state.currentUser.memberId;
      }
    }
  });

  renderGateDatasetLoginList();
}

function renderGateDatasetLoginList() {
  const container = document.getElementById('gate-dataset-login-list');
  if (!container || !state.members || !state.members.length) return;

  const searchQuery = (document.getElementById('gate-roster-search')?.value || '').trim().toLowerCase();
  const snapDay = state.attendance['2026-09-23'] || state.attendance[state.selectedDate] || {};

  const filtered = state.members.filter((m) => {
    if (!searchQuery) return true;
    const hay = `${m.name} ${m.regNo} ${m.branch || ''} ${m.wing || ''}`.toLowerCase();
    return hay.includes(searchQuery);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-3 text-center text-slate-400">No member matches "${escapeHtml(searchQuery)}"</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((m) => {
      const isAdminAccount = m.regNo.toUpperCase() === '24PA1A4297';
      const snap = snapDay[m.id] || { status: 'present', note: '' };
      const st = (snap.status || 'present').toUpperCase();
      const statusBadge =
        st === 'PRESENT' || st === 'P'
          ? '<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-extrabold">P</span>'
          : st === 'LATE' || st === 'L'
          ? '<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-extrabold">L</span>'
          : st === 'OD' || st === 'E'
          ? '<span class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[9px] font-extrabold">OD</span>'
          : '<span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold">A</span>';

      return `
        <button
          type="button"
          onclick="fillDatasetMemberLogin('${m.id}')"
          class="w-full text-left px-2.5 py-1.5 rounded-lg border ${
            isAdminAccount
              ? 'border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100 ring-1 ring-indigo-200'
              : 'border-slate-200/80 bg-white hover:bg-amber-50/60 hover:border-amber-300'
          } transition flex items-center justify-between gap-2 group"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-[10px] font-extrabold ${isAdminAccount ? 'text-indigo-700' : 'text-slate-800'}">${escapeHtml(m.regNo)}</span>
              <span class="text-[11px] font-bold text-slate-900 truncate">${escapeHtml(m.name)}</span>
              ${m.branch ? `<span class="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">${escapeHtml(m.branch)}</span>` : ''}
              ${
                isAdminAccount
                  ? '<span class="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold">ADMIN</span>'
                  : '<span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">1-PERSON VIEW</span>'
              }
            </div>
            <div class="text-[10px] text-slate-500 font-mono truncate">${escapeHtml(m.email)} • Pw: ${isAdminAccount ? 'admin123' : 'member123'}</div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${statusBadge}
            <span class="text-[10px] font-extrabold ${isAdminAccount ? 'text-indigo-600' : 'text-amber-600'} group-hover:underline">Use →</span>
          </div>
        </button>
      `;
    })
    .join('');
}

function fillDatasetMemberLogin(memberId) {
  const m = state.members.find((x) => x.id === memberId || x.regNo === memberId);
  if (!m) return;
  const isAdminAccount = m.regNo.toUpperCase() === '24PA1A4297';
  if (isAdminAccount) {
    selectGateRole('admin');
  } else {
    selectGateRole('user');
    const gateMemberSelect = document.getElementById('gate-member-select');
    if (gateMemberSelect) gateMemberSelect.value = m.id;
    const emailInput = document.getElementById('gate-email-input');
    const passInput = document.getElementById('gate-password-input');
    if (emailInput) emailInput.value = m.email;
    if (passInput) passInput.value = 'member123';
  }
  showToast(
    isAdminAccount
      ? `Selected Admin (${m.regNo} • ${m.name}) — Full Mark & Correct Access`
      : `Selected Member: ${m.name} (${m.regNo}) — Strict 1-Person Attendance View`,
    'info'
  );
}

// ============================================================================
// FULL-SCREEN EMAIL & PASSWORD LOGIN GATE HANDLERS
// ============================================================================
let gateSelectedRole = 'admin';

function selectGateRole(role) {
  gateSelectedRole = role;
  const adminBtn = document.getElementById('gate-tab-admin');
  const userBtn = document.getElementById('gate-tab-user');
  const emailLabel = document.getElementById('gate-email-label');
  const emailInput = document.getElementById('gate-email-input');
  const passInput = document.getElementById('gate-password-input');
  const memberPickerWrap = document.getElementById('gate-member-picker-wrap');
  const errBox = document.getElementById('gate-error-box');
  if (errBox) errBox.classList.add('hidden');

  if (role === 'admin') {
    adminBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow-sm';
    userBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
    if (emailLabel) emailLabel.textContent = 'Admin VIT Email or Reg. No. *';
    if (emailInput) emailInput.value = '24pa1a4297@vishnu.edu.in';
    if (passInput) passInput.value = 'admin123';
    if (memberPickerWrap) memberPickerWrap.classList.add('hidden');
  } else {
    userBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 bg-amber-600 text-white shadow-sm';
    adminBtn.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
    if (emailLabel) emailLabel.textContent = 'Club Member VIT Email or Reg. No. *';
    const defaultMember = state.members.find((x) => x.regNo === '24PA1A4201') || state.members[1] || state.members[0];
    if (emailInput && defaultMember) emailInput.value = defaultMember.email;
    if (passInput) passInput.value = 'member123';
    if (memberPickerWrap) memberPickerWrap.classList.remove('hidden');
    const gateMemberSelect = document.getElementById('gate-member-select');
    if (gateMemberSelect && defaultMember) gateMemberSelect.value = defaultMember.id;
  }
}

function fillGateCredentials(role) {
  selectGateRole(role);
  showToast(
    role === 'admin'
      ? 'Filled Admin Dataset Login (24pa1a4297@vishnu.edu.in / admin123)'
      : 'Filled Dataset Member Login (24pa1a4201@vishnu.edu.in / member123)',
    'info'
  );
}

function onGateMemberPick(memberId) {
  const m = state.members.find((x) => x.id === memberId);
  if (m) {
    const emailInput = document.getElementById('gate-email-input');
    const passInput = document.getElementById('gate-password-input');
    if (emailInput) emailInput.value = m.email;
    if (passInput) passInput.value = m.regNo.toUpperCase() === '24PA1A4297' ? 'admin123' : 'member123';
  }
}

function toggleGatePasswordVisibility() {
  const passInput = document.getElementById('gate-password-input');
  if (!passInput) return;
  passInput.type = passInput.type === 'password' ? 'text' : 'password';
}

function authenticateLocallyFromDataset(identifier, password, requestedRole) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const matchedMember = state.members.find(
    (m) =>
      m.email.toLowerCase() === cleanId ||
      m.regNo.toLowerCase() === cleanId ||
      m.id.toLowerCase() === cleanId ||
      m.name.toLowerCase() === cleanId ||
      `${m.regNo.toLowerCase()}@vishnu.edu.in` === cleanId
  );

  if (!matchedMember) {
    return { error: 'Account not found. Please enter a valid VIT Email, Reg No, or Name from the roster.' };
  }

  const cleanReg = matchedMember.regNo.toUpperCase();
  // Admin and Members can use ANY password!
  const isAdminMember = cleanReg === '24PA1A4297';
  if (isAdminMember && requestedRole === 'admin') {
    return {
      user: {
        role: 'admin',
        name: `${matchedMember.name} (${matchedMember.role})`,
        email: matchedMember.email,
        regNo: matchedMember.regNo,
        wing: matchedMember.wing,
        clubRole: matchedMember.role,
        memberId: matchedMember.id
      }
    };
  }

  return {
    user: {
      role: 'user',
      name: matchedMember.name,
      email: matchedMember.email,
      regNo: matchedMember.regNo,
      wing: matchedMember.wing,
      clubRole: matchedMember.role,
      memberId: matchedMember.id
    }
  };
}

async function submitGateLogin(e) {
  e.preventDefault();
  const email = document.getElementById('gate-email-input')?.value?.trim().toLowerCase() || '';
  const password = document.getElementById('gate-password-input')?.value?.trim() || '';
  const errBox = document.getElementById('gate-error-box');
  if (errBox) errBox.classList.add('hidden');

  // Strict enforcement: ONLY 24PA1A4297 (24pa1a4297@vishnu.edu.in) can enter as Admin; all other 15 dataset members are strictly View-Only ('user')
  const isAuthorizedAdmin = email === '24pa1a4297@vishnu.edu.in' || email === '24pa1a4297';
  const effectiveRole = isAuthorizedAdmin && gateSelectedRole === 'admin' ? 'admin' : 'user';

  let loggedInUser = null;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: effectiveRole,
        email,
        password
      })
    });
    const data = await res.json();
    if (!res.ok) {
      if (errBox) {
        errBox.textContent = data.error || 'Invalid Email/Reg No or Password.';
        errBox.classList.remove('hidden');
      }
      showToast(data.error || 'Invalid Email/Reg No or Password', 'error');
      return;
    }
    loggedInUser = data.user;
  } catch (err) {
    // Offline / standalone dist/index.html fallback using the embedded 16-member dataset
    const localAuth = authenticateLocallyFromDataset(email, password, effectiveRole);
    if (localAuth.error) {
      if (errBox) {
        errBox.textContent = localAuth.error;
        errBox.classList.remove('hidden');
      }
      showToast(localAuth.error, 'error');
      return;
    }
    loggedInUser = localAuth.user;
  }

  state.currentUser = loggedInUser;
  // If User ID is logged in, ensure active tab is 'daily' (never Admin correction tab)
  if (state.currentUser.role !== 'admin') {
    state.activeTab = 'daily';
  }

  // Unlock application dashboard and hide login gate
  document.getElementById('auth-gate-screen')?.classList.add('hidden');
  document.getElementById('app-dashboard-shell')?.classList.remove('hidden');

  syncRoleUI();
  switchTab(state.activeTab);
  showToast(
    state.currentUser.role === 'admin'
      ? `🛡️ Signed in as Admin (${state.currentUser.regNo} • ${state.currentUser.email}) — Full 16-Member Mark & Correct`
      : `👁️ Signed in as ${state.currentUser.name} (${state.currentUser.regNo}) — Strict 1-Person Attendance View`,
    'success'
  );
}

function logoutToAuthGate() {
  document.getElementById('app-dashboard-shell')?.classList.add('hidden');
  document.getElementById('auth-gate-screen')?.classList.remove('hidden');
  showToast('Signed out of Vishnu Institute of Technology Attendance Portal', 'info');
}

// ============================================================================
// ROLE SWITCHING & AUTHENTICATION (STRICT SEPARATION: ADMIN vs VIEW-ONLY USER)
// ============================================================================
function switchRoleQuick(targetRole) {
  // Strictly block any User ID from switching to Admin (Mark & Correct)
  if (targetRole === 'admin' && state.currentUser.email !== '24pa1a4297@vishnu.edu.in') {
    showToast('🔒 Access Denied: User ID cannot open Admin (Mark & Correct). Please Logout and sign in as 24pa1a4297@vishnu.edu.in.', 'error');
    return;
  }
  syncRoleUI();
  renderAllActiveViews();
}

function changeMemberPersona(memberId) {
  if (state.currentUser.role !== 'admin') {
    return; // Regular user cannot change persona
  }
}

// Helper: Returns ALL members for Admin (24pa1a4297@vishnu.edu.in), or STRICTLY ONLY the 1 logged-in user for Member logins
function getVisibleMembers() {
  const isAdmin = state.currentUser.role === 'admin' && state.currentUser.email === '24pa1a4297@vishnu.edu.in';
  if (isAdmin) {
    return state.members;
  }
  return state.members.filter((m) => m.id === state.currentUser.memberId);
}

function syncRoleUI() {
  const isAdmin = state.currentUser.role === 'admin' && state.currentUser.email === '24pa1a4297@vishnu.edu.in';

  // Header Mode Badges (User ID never sees Admin Mark & Correct button)
  const adminBadge = document.getElementById('admin-mode-badge');
  const userBadge = document.getElementById('user-mode-badge');
  if (adminBadge) {
    adminBadge.classList.toggle('hidden', !isAdmin);
    adminBadge.classList.toggle('inline-flex', isAdmin);
  }
  if (userBadge) {
    userBadge.classList.toggle('hidden', isAdmin);
    userBadge.classList.toggle('inline-flex', !isAdmin);
  }

  // Hide Admin Date Corrections, Datasets & Prompt tabs when a User ID is open (so User only sees their own 1-person attendance)
  const corrTabBtn = document.getElementById('tab-btn-corrections');
  const datasetsTabBtn = document.getElementById('tab-btn-datasets');
  const promptTabBtn = document.getElementById('tab-btn-prompt');
  if (corrTabBtn) corrTabBtn.classList.toggle('hidden', !isAdmin);
  if (datasetsTabBtn) datasetsTabBtn.classList.toggle('hidden', !isAdmin);
  if (promptTabBtn) promptTabBtn.classList.toggle('hidden', !isAdmin);

  // Toggle Admin roster search bar vs Single-User private sheet header
  const adminFilterBar = document.getElementById('admin-roster-filter-bar');
  const userSingleHeader = document.getElementById('user-single-sheet-header');
  if (adminFilterBar) adminFilterBar.classList.toggle('hidden', !isAdmin);
  if (userSingleHeader) {
    userSingleHeader.classList.toggle('hidden', isAdmin);
    userSingleHeader.classList.toggle('flex', !isAdmin);
  }

  // Lock Flag Wrong Attendance modal dropdown to ONLY the logged-in user when not Admin
  const flagMemberSelect = document.getElementById('flag-member-select');
  if (flagMemberSelect) {
    const visible = getVisibleMembers();
    flagMemberSelect.innerHTML = visible
      .map((m) => `<option value="${m.id}">${m.name} (${m.regNo} • ${m.email})</option>`)
      .join('');
    flagMemberSelect.disabled = !isAdmin;
  }

  // Header user details
  const nameEl = document.getElementById('header-user-name');
  const roleEl = document.getElementById('header-user-role');
  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (roleEl) {
    roleEl.textContent = isAdmin
      ? 'Admin • Read, Mark & Correct Access'
      : `${state.currentUser.regNo} • Private View-Only Access`;
    roleEl.className = isAdmin
      ? 'text-[11px] font-semibold text-emerald-600'
      : 'text-[11px] font-semibold text-amber-600';
  }

  // Top Role Banner
  const banner = document.getElementById('role-access-banner');
  const bannerText = document.getElementById('role-banner-text');
  const bannerBtn = document.getElementById('banner-action-btn');
  if (banner && bannerText && bannerBtn) {
    if (isAdmin) {
      banner.className = 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white';
      bannerText.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span><strong>ADMIN PORTAL (FULL EDIT & DATE CORRECTION):</strong> Viewing all ${state.members.length} club members. Mark daily attendance, inspect any past date, or manage all dataset CSV files.</span>`;
      bannerBtn.textContent = '📂 Open All Dataset Files →';
      bannerBtn.onclick = () => switchTab('datasets');
    } else {
      banner.className = 'bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800 text-white';
      bannerText.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-amber-300"></span>
        <span><strong>PRIVATE MEMBER PORTAL (${state.currentUser.name} • ${state.currentUser.regNo}):</strong> Showing ONLY your personal attendance record. Other members' attendance sheets are hidden.</span>`;
      bannerBtn.textContent = '🚩 Flag Wrong Attendance →';
      bannerBtn.onclick = () => openFlagDiscrepancyModal();
    }
  }

  // Member Personal Card
  const memberCard = document.getElementById('member-personal-card');
  if (memberCard) {
    if (!isAdmin) {
      memberCard.classList.remove('hidden');
      const m = state.members.find((x) => x.id === state.currentUser.memberId) || state.members[0];
      if (m) {
        const stats = getMemberOverallStats(m.id);
        document.getElementById('member-card-avatar').textContent = m.avatar || 'VM';
        document.getElementById('member-card-reg').textContent = m.regNo;
        document.getElementById('member-card-name').textContent = m.name;
        document.getElementById('member-card-meta').textContent = `${m.wing} Wing • ${m.role} (${m.batch})`;
        const pctEl = document.getElementById('member-card-pct');
        pctEl.textContent = `${stats.pct}%`;
        pctEl.className = `text-xl font-extrabold ${stats.pct >= 85 ? 'text-emerald-600' : stats.pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`;
        document.getElementById('member-card-ratio').textContent = `${stats.attended} / ${stats.total}`;
      }
    } else {
      memberCard.classList.add('hidden');
    }
  }

  // Admin-only buttons in Daily View
  const bulkControls = document.getElementById('admin-bulk-controls');
  const readonlyPill = document.getElementById('user-readonly-pill');
  const addMemberBtn = document.getElementById('add-member-btn');
  const sessionTitleInput = document.getElementById('session-title-input');
  const sessionTypeSelect = document.getElementById('session-type-select');

  if (bulkControls) bulkControls.classList.toggle('hidden', !isAdmin);
  if (readonlyPill) {
    readonlyPill.classList.toggle('hidden', isAdmin);
    readonlyPill.classList.toggle('inline-flex', !isAdmin);
  }
  // Keep Add Member buttons always visible and accessible
  if (addMemberBtn) addMemberBtn.classList.remove('hidden');
  if (sessionTitleInput) sessionTitleInput.disabled = !isAdmin;
  if (sessionTypeSelect) sessionTypeSelect.disabled = !isAdmin;

  // Direct Correction Form lock notice for non-admins
  const corrLock = document.getElementById('correction-form-lock-notice');
  const corrSubmitBtn = document.getElementById('corr-submit-btn');
  if (corrLock) corrLock.classList.toggle('hidden', isAdmin);
  if (corrSubmitBtn) corrSubmitBtn.disabled = !isAdmin;
}

// ============================================================================
// NAVIGATION TABS
// ============================================================================
function switchTab(tabName) {
  const isAdmin = state.currentUser.role === 'admin' && state.currentUser.email === '24pa1a4297@vishnu.edu.in';
  if (!isAdmin && (tabName === 'corrections' || tabName === 'datasets' || tabName === 'prompt')) {
    tabName = 'daily';
  }
  state.activeTab = tabName;
  const tabs = ['daily', 'weekly', 'monthly', 'corrections', 'datasets', 'prompt'];
  tabs.forEach((t) => {
    const sec = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (sec) sec.classList.toggle('hidden', t !== tabName);
    if (btn) {
      if (t === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  renderAllActiveViews();
}

function renderAllActiveViews() {
  updatePendingDiscrepancyBadge();
  renderDailyRoster();
  if (state.activeTab === 'weekly') {
    renderWeeklyView();
  } else if (state.activeTab === 'monthly') {
    renderMonthlyView();
  } else if (state.activeTab === 'corrections') {
    renderCorrectionsCenter();
  } else if (state.activeTab === 'datasets') {
    loadAndRenderDatasets();
  }
}

let cachedDatasets = [];

async function loadAndRenderDatasets() {
  try {
    const res = await fetch('/api/datasets');
    const data = await res.json();
    if (!data.ok) return;
    cachedDatasets = data.datasets || [];
    const grid = document.getElementById('datasets-grid');
    if (grid) {
      grid.innerHTML = cachedDatasets
        .map(
          (ds, idx) => `
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-md transition flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">${ds.category}</span>
                <span class="text-[11px] font-mono font-bold text-slate-500">${ds.rowCount} rows • ${(ds.sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
              <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 mt-2">${ds.title}</h4>
              <p class="text-[11px] text-slate-500 mt-1">${ds.description}</p>
              <div class="mt-2 text-[10px] font-mono text-indigo-600 truncate" title="${ds.path}">data/${ds.filename}</div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-slate-200/80">
              <button onclick="previewDatasetFile(${idx})" class="flex-1 py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition">
                👁️ Preview
              </button>
              <a href="/api/datasets/download?file=${encodeURIComponent(ds.filename)}" class="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center transition">
                ⬇ Download
              </a>
            </div>
          </div>
        `
        )
        .join('');
    }
    if (cachedDatasets.length > 0) {
      previewDatasetFile(0);
    }
  } catch (err) {
    showToast('Failed to load dataset files list', 'error');
  }
}

function previewDatasetFile(index) {
  const ds = cachedDatasets[index];
  if (!ds) return;
  const titleEl = document.getElementById('dataset-preview-title');
  const contentEl = document.getElementById('dataset-preview-content');
  const dlLink = document.getElementById('dataset-preview-download-link');
  if (titleEl) titleEl.textContent = `Preview: data/${ds.filename} (${ds.rowCount} rows)`;
  if (contentEl) contentEl.textContent = ds.preview || '';
  if (dlLink) dlLink.href = `/api/datasets/download?file=${encodeURIComponent(ds.filename)}`;
}

async function submitCSVImport() {
  const csvText = document.getElementById('csv-import-textarea')?.value || '';
  if (!csvText.trim()) {
    showToast('Please paste CSV dataset rows before importing', 'warning');
    return;
  }
  try {
    const res = await fetch('/api/datasets/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText, adminName: state.currentUser.name })
    });
    const data = await res.json();
    if (data.ok) {
      state.members = data.members;
      state.sessions = data.sessions;
      state.attendance = data.attendance;
      loadAndRenderDatasets();
      renderAllActiveViews();
      showToast(`✓ Imported ${data.importedRows} dataset rows across ${data.updatedDates.join(', ')}!`, 'success');
    } else {
      showToast(data.error || 'CSV Import failed', 'error');
    }
  } catch (err) {
    showToast('Failed to import CSV dataset', 'error');
  }
}

function updatePendingDiscrepancyBadge() {
  const pendingCount = state.discrepancies.filter((d) => d.status === 'pending').length;
  const badge = document.getElementById('pending-disc-badge');
  if (badge) {
    badge.textContent = pendingCount;
    badge.classList.toggle('hidden', pendingCount === 0);
  }
}

// ============================================================================
// TAB 1: DAILY TRACKER & AUTO DATE ATTENDANCE MARKING / CORRECTION
// ============================================================================
function toggleAutoDateMode(forceVal) {
  if (typeof forceVal === 'boolean') {
    state.autoDateEnabled = forceVal;
  } else {
    state.autoDateEnabled = !state.autoDateEnabled;
  }
  if (state.autoDateEnabled) {
    const liveToday = formatDateISO(new Date());
    state.todayDate = liveToday;
    state.selectedDate = liveToday;
    showToast(`🔄 Auto Date ON: Live date synced to Today (${formatReadableDate(liveToday)})`, 'success');
  } else {
    showToast(`Manual Date Mode: Pick any date to inspect or correct`, 'info');
  }
  updateAutoDateUI();
  renderDailyRoster();
}

function updateAutoDateUI() {
  const btn = document.getElementById('auto-date-toggle-btn');
  const badge = document.getElementById('auto-date-status-badge');
  const clock = document.getElementById('live-clock-badge');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (clock) clock.textContent = `🕒 ${timeStr}`;

  if (btn) {
    if (state.autoDateEnabled) {
      btn.className = 'px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5';
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span><span>Auto Date: ON</span>`;
    } else {
      btn.className = 'px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition flex items-center gap-1.5';
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>Auto Date: OFF</span>`;
    }
  }

  if (badge) {
    const isToday = state.selectedDate === state.todayDate;
    if (state.autoDateEnabled && isToday) {
      badge.className = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold';
      badge.innerHTML = '🟢 Auto-Synced (Today)';
    } else {
      badge.className = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold';
      badge.innerHTML = `📅 Viewing ${isToday ? 'Today' : 'Past Date'} (${state.selectedDate})`;
    }
  }
}

function onDailyDateChange(newDate) {
  if (!newDate) return;
  state.selectedDate = newDate;
  if (state.selectedDate !== state.todayDate) {
    state.autoDateEnabled = false;
  } else {
    state.autoDateEnabled = true;
  }
  updateAutoDateUI();
  renderDailyRoster();
}

function stepSelectedDate(deltaDays) {
  const [y, m, d] = state.selectedDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  state.selectedDate = formatDateISO(dt);
  if (state.selectedDate !== state.todayDate) {
    state.autoDateEnabled = false;
  } else {
    state.autoDateEnabled = true;
  }
  updateAutoDateUI();
  renderDailyRoster();
}

function jumpToToday() {
  const liveToday = formatDateISO(new Date());
  state.todayDate = liveToday;
  state.selectedDate = liveToday;
  state.autoDateEnabled = true;
  updateAutoDateUI();
  renderDailyRoster();
  showToast(`🔄 Auto Date ON: Jumped to Today (${formatReadableDate(state.todayDate)})`, 'success');
}

// Auto-advance date at midnight and update clock every second
setInterval(() => {
  const currentIso = formatDateISO(new Date());
  if (currentIso !== state.todayDate) {
    state.todayDate = currentIso;
    if (state.autoDateEnabled) {
      state.selectedDate = currentIso;
      renderDailyRoster();
      showToast(`📅 Midnight Passed: Date automatically changed to ${currentIso}!`, 'info');
    }
  }
  updateAutoDateUI();
}, 1000);

function renderDailyRoster() {
  const isAdmin = state.currentUser.role === 'admin' && state.currentUser.email === '24pa1a4297@vishnu.edu.in';
  const visibleMembers = getVisibleMembers();

  const datePicker = document.getElementById('daily-date-picker');
  if (datePicker) datePicker.value = state.selectedDate;

  const humanDate = formatReadableDate(state.selectedDate);
  const dateHumanEl = document.getElementById('daily-date-human');
  if (dateHumanEl) {
    const isToday = state.selectedDate === state.todayDate;
    dateHumanEl.innerHTML = isToday
      ? `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Today • ${humanDate}</span>`
      : `<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">Selected Date • ${humanDate}</span>`;
  }

  const tableDateLabel = document.getElementById('table-date-label');
  if (tableDateLabel) tableDateLabel.textContent = state.selectedDate;

  // Session metadata
  const session = state.sessions[state.selectedDate] || {
    title: `Vishnu Institute of Technology Club Session (${state.selectedDate})`,
    type: 'General Body Meet'
  };
  const titleInput = document.getElementById('session-title-input');
  const typeSelect = document.getElementById('session-type-select');
  if (titleInput) titleInput.value = session.title || '';
  if (typeSelect && session.type) typeSelect.value = session.type;

  // Show Past-Date Retroactive Correction Banner when selectedDate !== todayDate
  const pastAlert = document.getElementById('past-date-correction-alert');
  const pastAlertMsg = document.getElementById('past-date-alert-msg');
  if (pastAlert) {
    const isPastOrOther = state.selectedDate !== state.todayDate;
    pastAlert.classList.toggle('hidden', !isPastOrOther);
    if (isPastOrOther && pastAlertMsg) {
      pastAlertMsg.textContent = isAdmin
        ? `Inspecting attendance for ${humanDate} (${state.selectedDate}). Click any member's status button below to correct wrong attendance—changes will be automatically recorded in the Date Correction Audit Log.`
        : `Viewing your personal attendance for ${humanDate} (${state.selectedDate}) in Read-Only mode. If your attendance was marked wrong on this date, click "Flag Error".`;
    }
  }

  const dayRecords = state.attendance[state.selectedDate] || {};

  if (isAdmin) {
    // Admin sees Club-Wide Daily KPIs across all 16 members
    let presentCount = 0, absentCount = 0, odCount = 0, lateCount = 0;
    state.members.forEach((m) => {
      const st = dayRecords[m.id]?.status;
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'od') odCount++;
      else if (st === 'late') lateCount++;
    });

    const totalMembers = state.members.length;
    const effectivePresent = presentCount + odCount + lateCount;
    const dailyRate = totalMembers > 0 ? Math.round((effectivePresent / totalMembers) * 1000) / 10 : 0;

    document.getElementById('kpi-label-1').textContent = 'Total Club Roster';
    document.getElementById('kpi-total').textContent = totalMembers;
    document.getElementById('kpi-sub-1').textContent = 'Active Vishnu Institute of Technology members';

    document.getElementById('kpi-label-2').textContent = 'Present on Date';
    document.getElementById('kpi-present').textContent = presentCount;
    document.getElementById('kpi-present-sub').textContent = 'On time roll call';

    document.getElementById('kpi-label-3').textContent = 'Absent on Date';
    document.getElementById('kpi-absent').textContent = absentCount;
    document.getElementById('kpi-sub-3').textContent = 'Unexcused absence';

    document.getElementById('kpi-label-4').textContent = 'On-Duty (OD) / Late';
    document.getElementById('kpi-od-late').textContent = `${odCount} OD / ${lateCount} Late`;
    document.getElementById('kpi-sub-4').textContent = 'Excused club duty or late';

    document.getElementById('kpi-label-5').textContent = 'Daily Club Rate %';
    document.getElementById('kpi-rate').textContent = `${dailyRate}%`;
    document.getElementById('kpi-sub-5').textContent = 'Present + OD + Late';
  } else {
    // User ID logged in: Show ONLY that 1 single user's personal stats!
    const myMember = visibleMembers[0];
    const myOverall = myMember ? getMemberOverallStats(myMember.id) : { total: 0, present: 0, absent: 0, od: 0, late: 0, pct: 100 };
    const myTodayStatus = (dayRecords[myMember?.id]?.status || 'unmarked').toUpperCase();

    document.getElementById('kpi-label-1').textContent = `My Status (${state.selectedDate})`;
    document.getElementById('kpi-total').textContent = myTodayStatus;
    document.getElementById('kpi-sub-1').textContent = myMember ? `${myMember.name} (${myMember.regNo})` : '';

    document.getElementById('kpi-label-2').textContent = 'My Present Sessions';
    document.getElementById('kpi-present').textContent = myOverall.present;
    document.getElementById('kpi-present-sub').textContent = `Out of ${myOverall.total} sessions`;

    document.getElementById('kpi-label-3').textContent = 'My Absent Sessions';
    document.getElementById('kpi-absent').textContent = myOverall.absent;
    document.getElementById('kpi-sub-3').textContent = 'Total unexcused absences';

    document.getElementById('kpi-label-4').textContent = 'My OD / Late Sessions';
    document.getElementById('kpi-od-late').textContent = `${myOverall.od} OD / ${myOverall.late} Late`;
    document.getElementById('kpi-sub-4').textContent = 'Approved On-Duty & Late';

    document.getElementById('kpi-label-5').textContent = 'My Overall Attendance %';
    document.getElementById('kpi-rate').textContent = `${myOverall.pct}%`;
    document.getElementById('kpi-sub-5').textContent = 'Personal club standing';
  }

  // Filter members for table (Strictly ONLY 1 member when User is logged in!)
  let filteredMembers = visibleMembers;
  if (isAdmin) {
    const searchQuery = (document.getElementById('member-search-input')?.value || '').trim().toLowerCase();
    const branchFilter = document.getElementById('branch-filter-select')?.value || 'ALL';
    const wingFilter = document.getElementById('wing-filter-select')?.value || 'ALL';
    const statusFilter = document.getElementById('status-filter-select')?.value || 'ALL';

    filteredMembers = visibleMembers.filter((m) => {
      if (branchFilter !== 'ALL' && m.branch !== branchFilter) return false;
      if (wingFilter !== 'ALL') {
        const wingLower = (m.wing || '').toLowerCase();
        const filterLower = wingFilter.toLowerCase();
        if (!wingLower.includes(filterLower)) return false;
      }
      const st = dayRecords[m.id]?.status || 'unmarked';
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (searchQuery) {
        const hay = `${m.name} ${m.regNo} ${m.branch || ''} ${m.team || ''} ${m.wing} ${m.role}`.toLowerCase();
        if (!hay.includes(searchQuery)) return false;
      }
      return true;
    });
  }

  const tbody = document.getElementById('daily-roster-tbody');
  if (!tbody) return;

  if (filteredMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400 font-medium">No club members match the current filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredMembers
    .map((m) => {
      const rec = dayRecords[m.id] || { status: 'unmarked', note: '' };
      const st = rec.status;
      const overall = getMemberOverallStats(m.id);
      const isCurrentUserRow = !isAdmin && state.currentUser.memberId === m.id;

      // Check if there is a pending discrepancy flag for this member & date
      const pendingDisc = state.discrepancies.find(
        (d) => d.date === state.selectedDate && d.memberId === m.id && d.status === 'pending'
      );

      const pctColor =
        overall.pct >= 85
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : overall.pct >= 75
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-rose-700 bg-rose-50 border-rose-200';

      return `
        <tr class="hover:bg-slate-50/90 transition ${isCurrentUserRow ? 'bg-amber-50/50' : ''} ${pendingDisc ? 'bg-rose-50/40' : ''}">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl ${isCurrentUserRow ? 'bg-amber-600 text-white' : 'bg-indigo-100 text-indigo-700'} font-bold text-xs flex items-center justify-center shrink-0">
                ${m.avatar || 'VM'}
              </div>
              <div>
                <div class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>${m.name}</span>
                  ${isCurrentUserRow ? '<span class="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-amber-200 text-amber-900">YOU</span>' : ''}
                  ${pendingDisc ? `<span class="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-rose-600 text-white" title="${pendingDisc.reason}">🚩 Flagged Wrong</span>` : ''}
                </div>
                <div class="text-[11px] text-slate-400">${m.email}</div>
              </div>
            </div>
          </td>

          <td class="py-3 px-3 font-mono font-bold text-xs text-slate-700">
            ${m.regNo}
          </td>

          <td class="py-3 px-3">
            <div class="text-xs font-bold text-slate-800">${m.wing}</div>
            <div class="text-[11px] text-slate-500">${m.role}</div>
          </td>

          <td class="py-3 px-3 text-center">
            <span class="px-2.5 py-1 rounded-lg border text-xs font-extrabold ${pctColor}">
              ${overall.pct}%
            </span>
          </td>

          <td class="py-3 px-4 text-center">
            <div class="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                ${!isAdmin ? 'disabled' : ''}
                onclick="markSingleAttendance('${m.id}', 'present')"
                class="status-btn px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent text-slate-600 hover:bg-white ${st === 'present' ? 'active-present' : ''}"
              >
                Present
              </button>
              <button
                type="button"
                ${!isAdmin ? 'disabled' : ''}
                onclick="markSingleAttendance('${m.id}', 'od')"
                class="status-btn px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent text-slate-600 hover:bg-white ${st === 'od' ? 'active-od' : ''}"
              >
                OD
              </button>
              <button
                type="button"
                ${!isAdmin ? 'disabled' : ''}
                onclick="markSingleAttendance('${m.id}', 'late')"
                class="status-btn px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent text-slate-600 hover:bg-white ${st === 'late' ? 'active-late' : ''}"
              >
                Late
              </button>
              <button
                type="button"
                ${!isAdmin ? 'disabled' : ''}
                onclick="markSingleAttendance('${m.id}', 'absent')"
                class="status-btn px-2.5 py-1 rounded-lg text-xs font-bold border border-transparent text-slate-600 hover:bg-white ${st === 'absent' ? 'active-absent' : ''}"
              >
                Absent
              </button>
            </div>
          </td>

          <td class="py-3 px-4">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-slate-600 truncate max-w-[190px]" title="${rec.note || ''}">
                ${rec.note ? `📝 ${rec.note}` : '<span class="text-slate-400 italic">No note</span>'}
              </span>
              ${
                isAdmin
                  ? `<button onclick="openQuickCorrectionForMember('${state.selectedDate}', '${m.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold shrink-0 transition">
                      ✎ Correct / Note
                    </button>`
                  : `<button onclick="openFlagDiscrepancyModal('${state.selectedDate}', '${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold shrink-0 transition">
                      🚩 Flag Error
                    </button>`
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

// Mark or Correct Single Member Status on Selected Date (Admin)
async function markSingleAttendance(memberId, newStatus) {
  if (state.currentUser.role !== 'admin') {
    showToast('🔒 View-Only Mode: Only Admins can mark or change attendance.', 'warning');
    return;
  }

  const sessionTitle = document.getElementById('session-title-input')?.value;
  const sessionType = document.getElementById('session-type-select')?.value;
  const isPastDate = state.selectedDate !== state.todayDate;
  const member = state.members.find((m) => m.id === memberId);

  try {
    const res = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.selectedDate,
        memberId,
        status: newStatus,
        isCorrection: isPastDate,
        reason: isPastDate
          ? `Admin corrected attendance on date ${state.selectedDate} to ${newStatus.toUpperCase()}`
          : `Marked ${newStatus.toUpperCase()} during daily roll call`,
        adminName: state.currentUser.name,
        sessionTitle,
        sessionType
      })
    });
    const data = await res.json();
    if (data.ok) {
      if (!state.attendance[state.selectedDate]) state.attendance[state.selectedDate] = {};
      state.attendance[state.selectedDate][memberId] = data.record;
      state.sessions[state.selectedDate] = data.session;
      state.auditLogs = data.auditLogs || state.auditLogs;
      state.discrepancies = data.discrepancies || state.discrepancies;

      renderAllActiveViews();
      if (isPastDate) {
        showToast(
          `🛠️ Corrected ${member?.name}'s attendance on ${state.selectedDate} → ${newStatus.toUpperCase()} (Logged in Audit Trail)`,
          'info'
        );
      } else {
        showToast(`✓ Marked ${member?.name} as ${newStatus.toUpperCase()}`, 'success');
      }
    }
  } catch (err) {
    showToast('Failed to update attendance', 'error');
  }
}

// Bulk Mark Attendance for Selected Date (Admin)
async function bulkMarkDate(status) {
  if (state.currentUser.role !== 'admin') {
    showToast('🔒 View-Only Mode: Only Admins can bulk mark attendance.', 'warning');
    return;
  }

  const sessionTitle = document.getElementById('session-title-input')?.value;
  const sessionType = document.getElementById('session-type-select')?.value;

  try {
    const res = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.selectedDate,
        status,
        sessionTitle,
        sessionType,
        adminName: state.currentUser.name
      })
    });
    const data = await res.json();
    if (data.ok) {
      state.attendance[state.selectedDate] = data.attendanceForDate;
      state.sessions[state.selectedDate] = data.session;
      state.auditLogs = data.auditLogs || state.auditLogs;
      renderAllActiveViews();
      showToast(`✓ Bulk marked all club members as ${status.toUpperCase()} for ${state.selectedDate}`, 'success');
    }
  } catch (err) {
    showToast('Failed to perform bulk update', 'error');
  }
}

function openQuickCorrectionForMember(dateStr, memberId) {
  switchTab('corrections');
  const dateInput = document.getElementById('corr-date-input');
  const memberSelect = document.getElementById('corr-member-select');
  if (dateInput) dateInput.value = dateStr;
  if (memberSelect) memberSelect.value = memberId;
  updateCorrectionFormPreview();
  const reasonInput = document.getElementById('corr-reason-input');
  if (reasonInput) reasonInput.focus();
}

// ============================================================================
// TAB 2: WEEKLY TRACKAGE (7-DAY MATRIX & CHARTS)
// ============================================================================
function shiftWeek(deltaWeeks) {
  state.weekOffset += deltaWeeks;
  renderWeeklyView();
}

function resetWeekToCurrent() {
  state.weekOffset = 0;
  renderWeeklyView();
}

function getSelectedWeekDates() {
  const [y, m, d] = state.todayDate.split('-').map(Number);
  const endDt = new Date(y, m - 1, d);
  endDt.setDate(endDt.getDate() + state.weekOffset * 7);

  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const cur = new Date(endDt);
    cur.setDate(endDt.getDate() - i);
    dates.push(formatDateISO(cur));
  }
  return dates;
}

function renderWeeklyView() {
  const weekDates = getSelectedWeekDates();
  const rangeLabel = document.getElementById('weekly-range-label');
  if (rangeLabel) {
    rangeLabel.textContent = `${formatReadableDate(weekDates[0])} — ${formatReadableDate(weekDates[6])}`;
  }

  // Build Matrix Table Header
  const thead = document.getElementById('weekly-matrix-thead');
  if (thead) {
    const dayCols = weekDates
      .map((d) => {
        const dt = new Date(d + 'T00:00:00');
        const wkDay = dt.toLocaleDateString('en-IN', { weekday: 'short' });
        const dayNum = d.slice(8, 10) + '/' + d.slice(5, 7);
        return `<th class="py-3 px-2 text-center">
          <div class="text-[10px] text-slate-400">${wkDay}</div>
          <div class="text-xs font-extrabold text-slate-700">${dayNum}</div>
        </th>`;
      })
      .join('');

    thead.innerHTML = `
      <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <th class="py-3 px-4">Club Member</th>
        <th class="py-3 px-3">Wing</th>
        ${dayCols}
        <th class="py-3 px-4 text-center">Weekly %</th>
      </tr>
    `;
  }

  // Build Matrix Table Rows (Strictly ONLY 1 row for User login, ALL rows for Admin)
  const visibleMembers = getVisibleMembers();
  const tbody = document.getElementById('weekly-matrix-tbody');
  if (tbody) {
    tbody.innerHTML = visibleMembers
      .map((m) => {
        let conducted = 0;
        let attended = 0;

        const cells = weekDates
          .map((d) => {
            const rec = state.attendance[d]?.[m.id];
            const st = rec?.status || 'none';
            if (st !== 'none') {
              conducted++;
              if (st === 'present' || st === 'od' || st === 'late') attended++;
            }

            const labelMap = { present: 'P', od: 'OD', late: 'L', absent: 'A', none: '—' };
            const classMap = {
              present: 'badge-present',
              od: 'badge-od',
              late: 'badge-late',
              absent: 'badge-absent',
              none: 'badge-none'
            };

            return `<td class="py-2.5 px-2 text-center">
              <button
                type="button"
                onclick="inspectDateFromMatrix('${d}', '${m.id}')"
                title="${m.name} on ${d}: ${st.toUpperCase()}"
                class="day-badge ${classMap[st] || 'badge-none'}"
              >
                ${labelMap[st] || '—'}
              </button>
            </td>`;
          })
          .join('');

        const wkPct = conducted > 0 ? Math.round((attended / conducted) * 100) : 100;
        const badgeClass =
          wkPct >= 85
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : wkPct >= 75
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200';

        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-4">
              <div class="font-bold text-slate-900">${m.name}</div>
              <div class="text-[11px] font-mono text-slate-400">${m.regNo}</div>
            </td>
            <td class="py-2.5 px-3 text-slate-600 font-medium">${m.wing}</td>
            ${cells}
            <td class="py-2.5 px-4 text-center">
              <span class="px-2.5 py-1 rounded-lg border font-extrabold text-xs ${badgeClass}">
                ${wkPct}% (${attended}/${conducted})
              </span>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Render Weekly Charts
  renderWeeklyCharts(weekDates);
}

function inspectDateFromMatrix(dateStr, memberId) {
  state.selectedDate = dateStr;
  switchTab('daily');
  showToast(`Opened attendance sheet for ${formatReadableDate(dateStr)}`, 'info');
}

function renderWeeklyCharts(weekDates) {
  const visibleMembers = getVisibleMembers();
  const labels = weekDates.map((d) => d.slice(5)); // MM-DD
  const presentArr = [];
  const odLateArr = [];
  const absentArr = [];

  weekDates.forEach((d) => {
    const recs = state.attendance[d] || {};
    let p = 0, ol = 0, a = 0;
    visibleMembers.forEach((m) => {
      const st = recs[m.id]?.status;
      if (st === 'present') p++;
      else if (st === 'od' || st === 'late') ol++;
      else if (st === 'absent') a++;
    });
    presentArr.push(p);
    odLateArr.push(ol);
    absentArr.push(a);
  });

  const barCtx = document.getElementById('weeklyBarChart')?.getContext('2d');
  if (barCtx) {
    if (weeklyBarChartInstance) weeklyBarChartInstance.destroy();
    weeklyBarChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Present', data: presentArr, backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'On-Duty / Late', data: odLateArr, backgroundColor: '#0ea5e9', borderRadius: 6 },
          { label: 'Absent', data: absentArr, backgroundColor: '#f43f5e', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, max: visibleMembers.length || 1 }
        }
      }
    });
  }

  // Wing-wise attendance % across the week (Only user's wing when User is logged in)
  const isAdmin = state.currentUser.role === 'admin' && state.currentUser.email === '24pa1a4297@vishnu.edu.in';
  const wings = isAdmin
    ? ['Technical', 'Management & Events', 'PR & Outreach', 'Design & Media', 'Social Impact']
    : [visibleMembers[0]?.wing || 'My Wing'];

  const wingRates = wings.map((w) => {
    const wingMembers = visibleMembers.filter((m) => m.wing === w);
    let total = 0, att = 0;
    weekDates.forEach((d) => {
      wingMembers.forEach((m) => {
        const st = state.attendance[d]?.[m.id]?.status;
        if (st) {
          total++;
          if (st === 'present' || st === 'od' || st === 'late') att++;
        }
      });
    });
    return total > 0 ? Math.round((att / total) * 1000) / 10 : 100;
  });

  const wingCtx = document.getElementById('weeklyWingChart')?.getContext('2d');
  if (wingCtx) {
    if (weeklyWingChartInstance) weeklyWingChartInstance.destroy();
    weeklyWingChartInstance = new Chart(wingCtx, {
      type: 'bar',
      data: {
        labels: wings,
        datasets: [
          {
            label: 'Weekly Attendance %',
            data: wingRates,
            backgroundColor: ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b'],
            borderRadius: 8
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, max: 100 } }
      }
    });
  }
}

// ============================================================================
// TAB 3: MONTHLY TRACKAGE & ELIGIBILITY ANALYTICS
// ============================================================================
function renderMonthlyView() {
  const visibleMembers = getVisibleMembers();
  const select = document.getElementById('monthly-selector');
  if (select && select.value) {
    state.selectedMonth = select.value;
  }

  const monthDates = Object.keys(state.attendance)
    .filter((d) => d.startsWith(state.selectedMonth))
    .sort();

  let clubTotalEntries = 0;
  let clubPresent = 0;
  let clubOD = 0;
  let clubLate = 0;
  let clubAbsent = 0;

  let optimalMembersCount = 0;
  let shortageMembersCount = 0;

  const memberRowsHtml = visibleMembers
    .map((m) => {
      let sessions = 0, p = 0, od = 0, l = 0, a = 0;
      monthDates.forEach((d) => {
        const st = state.attendance[d]?.[m.id]?.status;
        if (st) {
          sessions++;
          clubTotalEntries++;
          if (st === 'present') { p++; clubPresent++; }
          else if (st === 'od') { od++; clubOD++; }
          else if (st === 'late') { l++; clubLate++; }
          else if (st === 'absent') { a++; clubAbsent++; }
        }
      });

      const attended = p + od + l;
      const pct = sessions > 0 ? Math.round((attended / sessions) * 1000) / 10 : 100;
      if (pct >= 85) optimalMembersCount++;
      if (pct < 75) shortageMembersCount++;

      let standingBadge = '';
      if (pct >= 85) {
        standingBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Good Standing</span>`;
      } else if (pct >= 75) {
        standingBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">⚠ Borderline (75-84%)</span>`;
      } else {
        standingBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">🚨 Shortage (&lt;75%)</span>`;
      }

      return `
        <tr class="hover:bg-slate-50/90 transition">
          <td class="py-3 px-4 font-bold text-slate-900">${m.name}</td>
          <td class="py-3 px-3 font-mono text-xs font-bold text-slate-600">${m.regNo}</td>
          <td class="py-3 px-3 text-xs text-slate-600">${m.wing}</td>
          <td class="py-3 px-3 text-center font-bold text-slate-700">${sessions}</td>
          <td class="py-3 px-3 text-center font-bold text-emerald-700">${p}</td>
          <td class="py-3 px-3 text-center font-bold text-sky-700">${od}</td>
          <td class="py-3 px-3 text-center font-bold text-amber-700">${l}</td>
          <td class="py-3 px-3 text-center font-bold text-rose-700">${a}</td>
          <td class="py-3 px-4 text-center font-extrabold text-slate-900">${pct}%</td>
          <td class="py-3 px-4 text-center">${standingBadge}</td>
        </tr>
      `;
    })
    .join('');

  const tbody = document.getElementById('monthly-summary-tbody');
  if (tbody) tbody.innerHTML = memberRowsHtml;

  const monthlyAvg =
    clubTotalEntries > 0
      ? Math.round(((clubPresent + clubOD + clubLate) / clubTotalEntries) * 1000) / 10
      : 100;

  document.getElementById('monthly-kpi-sessions').textContent = monthDates.length;
  document.getElementById('monthly-kpi-avg').textContent = `${monthlyAvg}%`;
  document.getElementById('monthly-kpi-optimal').textContent = `${optimalMembersCount} / ${visibleMembers.length}`;
  document.getElementById('monthly-kpi-shortage').textContent = shortageMembersCount;

  // Render Monthly Line & Doughnut Charts
  const dailyRates = monthDates.map((d) => {
    const recs = state.attendance[d] || {};
    let tot = 0, att = 0;
    visibleMembers.forEach((m) => {
      const st = recs[m.id]?.status;
      if (st) {
        tot++;
        if (st === 'present' || st === 'od' || st === 'late') att++;
      }
    });
    return tot > 0 ? Math.round((att / tot) * 1000) / 10 : 0;
  });

  const lineCtx = document.getElementById('monthlyLineChart')?.getContext('2d');
  if (lineCtx) {
    if (monthlyLineChartInstance) monthlyLineChartInstance.destroy();
    monthlyLineChartInstance = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: monthDates.map((d) => d.slice(5)),
        datasets: [
          {
            label: 'Club Daily Attendance %',
            data: dailyRates,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.12)',
            fill: true,
            tension: 0.32,
            pointRadius: 4,
            pointBackgroundColor: '#4f46e5'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 50, max: 100 } }
      }
    });
  }

  const doughnutCtx = document.getElementById('monthlyDoughnutChart')?.getContext('2d');
  if (doughnutCtx) {
    if (monthlyDoughnutChartInstance) monthlyDoughnutChartInstance.destroy();
    monthlyDoughnutChartInstance = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'On-Duty (OD)', 'Late', 'Absent'],
        datasets: [
          {
            data: [clubPresent, clubOD, clubLate, clubAbsent],
            backgroundColor: ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e'],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

// ============================================================================
// TAB 4: DATE CORRECTIONS & AUDIT CENTER
// ============================================================================
function updateCorrectionFormPreview() {
  const dateVal = document.getElementById('corr-date-input')?.value;
  const memberId = document.getElementById('corr-member-select')?.value;
  const badge = document.getElementById('corr-recorded-status-badge');
  if (!badge || !dateVal || !memberId) return;

  const currentSt = state.attendance[dateVal]?.[memberId]?.status || 'unmarked';
  const badgeMap = {
    present: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    od: 'bg-sky-100 text-sky-800 border border-sky-300',
    late: 'bg-amber-100 text-amber-800 border border-amber-300',
    absent: 'bg-rose-100 text-rose-800 border border-rose-300',
    unmarked: 'bg-slate-200 text-slate-700'
  };
  badge.className = `px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[11px] ${badgeMap[currentSt] || badgeMap.unmarked}`;
  badge.textContent = currentSt.toUpperCase();
}

async function submitDirectDateCorrection(e) {
  e.preventDefault();
  if (state.currentUser.role !== 'admin') {
    showToast('🔒 View-Only Mode: Only Admins can apply date corrections.', 'warning');
    return;
  }

  const date = document.getElementById('corr-date-input')?.value;
  const memberId = document.getElementById('corr-member-select')?.value;
  const status = document.getElementById('corr-new-status-select')?.value;
  const reason = document.getElementById('corr-reason-input')?.value;

  const member = state.members.find((m) => m.id === memberId);

  try {
    const res = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        memberId,
        status,
        note: reason,
        isCorrection: true,
        reason,
        adminName: state.currentUser.name
      })
    });
    const data = await res.json();
    if (data.ok) {
      if (!state.attendance[date]) state.attendance[date] = {};
      state.attendance[date][memberId] = data.record;
      state.auditLogs = data.auditLogs || state.auditLogs;
      state.discrepancies = data.discrepancies || state.discrepancies;

      document.getElementById('corr-reason-input').value = '';
      updateCorrectionFormPreview();
      renderAllActiveViews();
      showToast(`🛠️ Successfully corrected ${member?.name}'s attendance on ${date} to ${status.toUpperCase()}`, 'success');
    }
  } catch (err) {
    showToast('Failed to apply date correction', 'error');
  }
}

function jumpToCorrectionDateInDaily() {
  const date = document.getElementById('corr-date-input')?.value;
  if (date) {
    state.selectedDate = date;
    switchTab('daily');
    showToast(`Switched to full attendance sheet for ${formatReadableDate(date)}`, 'info');
  }
}

function renderCorrectionsCenter() {
  updateCorrectionFormPreview();
  const isAdmin = state.currentUser.role === 'admin';

  // Render Discrepancies Queue
  const container = document.getElementById('discrepancy-list-container');
  if (container) {
    if (state.discrepancies.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No attendance discrepancy requests found.</div>`;
    } else {
      container.innerHTML = state.discrepancies
        .map((d) => {
          const isPending = d.status === 'pending';
          return `
            <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isPending ? 'bg-white' : 'bg-slate-50/70 opacity-80'}">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isPending ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'}">
                    ${isPending ? '⏳ Pending Admin Correction' : '✓ Resolved & Corrected'}
                  </span>
                  <span class="text-xs font-extrabold text-slate-900">${d.memberName} (${d.regNo})</span>
                  <span class="text-xs font-bold text-indigo-700">• Date: ${d.date} (${formatReadableDate(d.date)})</span>
                </div>
                <div class="text-xs text-slate-700">
                  Recorded as <strong class="uppercase text-rose-600">${d.currentStatus}</strong> → Requested change to <strong class="uppercase text-emerald-600">${d.requestedStatus}</strong>
                </div>
                <p class="text-xs text-slate-500 italic">"${d.reason}"</p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                ${
                  isPending && isAdmin
                    ? `
                      <button onclick="resolveDiscrepancy('${d.id}', 'approve')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition">
                        ✓ Verify & Correct Date
                      </button>
                      <button onclick="resolveDiscrepancy('${d.id}', 'reject')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                        Dismiss
                      </button>
                    `
                    : isPending && !isAdmin
                    ? `<span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">Awaiting Admin Action</span>`
                    : `<span class="text-[11px] font-bold text-emerald-700">Updated to ${d.requestedStatus.toUpperCase()}</span>`
                }
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Render Audit Logs Table
  const auditTbody = document.getElementById('audit-log-tbody');
  if (auditTbody) {
    if (state.auditLogs.length === 0) {
      auditTbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">No date corrections recorded yet.</td></tr>`;
    } else {
      auditTbody.innerHTML = state.auditLogs
        .map((log) => {
          const ts = new Date(log.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });
          return `
            <tr class="hover:bg-slate-50/80">
              <td class="py-3 px-4 font-bold text-indigo-900">
                <div>${log.date}</div>
                <div class="text-[10px] text-slate-400 font-normal">${formatReadableDate(log.date)}</div>
              </td>
              <td class="py-3 px-3">
                <div class="font-bold text-slate-800">${log.memberName}</div>
                <div class="text-[10px] font-mono text-slate-400">${log.regNo}</div>
              </td>
              <td class="py-3 px-3 text-center">
                <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold uppercase text-[10px]">${log.oldStatus}</span>
                <span class="mx-1 text-slate-400">→</span>
                <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px]">${log.newStatus}</span>
              </td>
              <td class="py-3 px-4 text-slate-600">${log.reason}</td>
              <td class="py-3 px-3">
                <div class="font-semibold text-slate-800">${log.correctedBy}</div>
                <div class="text-[10px] text-slate-400">${ts}</div>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }
}

async function resolveDiscrepancy(id, action) {
  if (state.currentUser.role !== 'admin') {
    showToast('Only Admins can resolve attendance correction requests', 'warning');
    return;
  }
  try {
    const res = await fetch('/api/discrepancies/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        action,
        adminName: state.currentUser.name
      })
    });
    const data = await res.json();
    if (data.ok) {
      state.discrepancies = data.discrepancies;
      state.attendance = data.attendance;
      state.auditLogs = data.auditLogs;
      renderAllActiveViews();
      showToast(
        action === 'approve'
          ? '✓ Approved request & automatically corrected attendance on that date!'
          : 'Request dismissed',
        'success'
      );
    }
  } catch (err) {
    showToast('Failed to resolve discrepancy request', 'error');
  }
}

// ============================================================================
// MODALS: LOGIN, FLAG DISCREPANCY, ADD MEMBER
// ============================================================================
function openLoginModal() {
  document.getElementById('login-modal')?.classList.remove('hidden');
  selectLoginModalRole(state.currentUser.role);
}

function closeLoginModal() {
  document.getElementById('login-modal')?.classList.add('hidden');
}

function selectLoginModalRole(role) {
  state.loginModalSelectedRole = role;
  const adminCard = document.getElementById('modal-role-admin');
  const userCard = document.getElementById('modal-role-user');
  const adminFields = document.getElementById('login-admin-fields');
  const userFields = document.getElementById('login-user-fields');

  if (role === 'admin') {
    adminCard.className = 'p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/70 text-left transition';
    userCard.className = 'p-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-left transition';
    adminFields.classList.remove('hidden');
    userFields.classList.add('hidden');
  } else {
    userCard.className = 'p-3.5 rounded-xl border-2 border-amber-600 bg-amber-50/70 text-left transition';
    adminCard.className = 'p-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-left transition';
    userFields.classList.remove('hidden');
    adminFields.classList.add('hidden');
  }
}

async function submitLoginModal(e) {
  e.preventDefault();
  if (state.loginModalSelectedRole === 'admin') {
    const id = document.getElementById('login-admin-id')?.value;
    const pass = document.getElementById('login-admin-pass')?.value;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', identifier: id, password: pass })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Login failed', 'error');
      return;
    }
    state.currentUser = data.user;
    closeLoginModal();
    syncRoleUI();
    renderAllActiveViews();
    showToast('Signed in as VIT MITRA Admin', 'success');
  } else {
    const memberId = document.getElementById('login-member-select')?.value;
    changeMemberPersona(memberId);
    closeLoginModal();
  }
}

function openFlagDiscrepancyModal(datePrefill, memberPrefill) {
  const modal = document.getElementById('flag-modal');
  if (modal) modal.classList.remove('hidden');
  if (datePrefill) {
    document.getElementById('flag-date-input').value = datePrefill;
  }
  if (memberPrefill) {
    document.getElementById('flag-member-select').value = memberPrefill;
  } else if (state.currentUser.role === 'user' && state.currentUser.memberId) {
    document.getElementById('flag-member-select').value = state.currentUser.memberId;
  }
}

function closeFlagDiscrepancyModal() {
  document.getElementById('flag-modal')?.classList.add('hidden');
}

async function submitDiscrepancyFlag(e) {
  e.preventDefault();
  const memberId = document.getElementById('flag-member-select')?.value;
  const date = document.getElementById('flag-date-input')?.value;
  const requestedStatus = document.getElementById('flag-status-select')?.value;
  const reason = document.getElementById('flag-reason-input')?.value;

  try {
    const res = await fetch('/api/discrepancies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, memberId, requestedStatus, reason })
    });
    const data = await res.json();
    if (data.ok) {
      state.discrepancies = data.discrepancies;
      document.getElementById('flag-reason-input').value = '';
      closeFlagDiscrepancyModal();
      renderAllActiveViews();
      showToast('🚩 Wrong attendance flagged! Sent to Admin Date Correction queue.', 'info');
    }
  } catch (err) {
    showToast('Failed to submit flag', 'error');
  }
}

function openAddMemberModal() {
  document.getElementById('add-member-modal')?.classList.remove('hidden');
}

function closeAddMemberModal() {
  document.getElementById('add-member-modal')?.classList.add('hidden');
}

async function submitAddMember(e) {
  e.preventDefault();
  const name = document.getElementById('new-member-name')?.value?.trim();
  const regNo = document.getElementById('new-member-reg')?.value?.trim().toUpperCase();
  const branch = document.getElementById('new-member-branch')?.value || 'AI&DS';
  const batch = document.getElementById('new-member-batch')?.value?.trim() || '2024-28';
  const wing = document.getElementById('new-member-wing')?.value || 'General Body & Core Wing';
  const role = document.getElementById('new-member-role')?.value?.trim() || 'Executive Member';
  const email = document.getElementById('new-member-email')?.value?.trim() || `${regNo.toLowerCase()}@vishnu.edu.in`;

  if (!name || !regNo) {
    showToast('Name and VIT Reg. No. are required', 'error');
    return;
  }

  const existing = state.members.find((m) => m.regNo.toUpperCase() === regNo);
  if (existing) {
    showToast(`Member with Reg No "${regNo}" already exists (${existing.name})!`, 'error');
    return;
  }

  let data = null;
  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, regNo, branch, batch, wing, role, email })
    });
    data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to add member', 'error');
      return;
    }
  } catch (err) {
    // Offline / standalone fallback
    const initials = name.split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'VM';
    const localMember = {
      id: 'm' + (Date.now() % 100000),
      regNo,
      name,
      branch,
      wing,
      role,
      batch,
      email,
      phone: '+91 98450 00000',
      avatar: initials,
      source: 'manual'
    };
    data = { ok: true, member: localMember, members: [...state.members, localMember] };
  }

  if (data && data.ok) {
    state.members = data.members || [...state.members, data.member];
    if (data.attendance) {
      state.attendance = data.attendance;
    } else {
      Object.keys(state.attendance).forEach((d) => {
        if (!state.attendance[d]) state.attendance[d] = {};
        state.attendance[d][data.member.id] = {
          status: 'present',
          note: 'Newly inducted member',
          updatedBy: 'Admin'
        };
      });
    }

    populateMemberDropdowns();
    closeAddMemberModal();
    document.getElementById('new-member-name').value = '';
    document.getElementById('new-member-reg').value = '';
    renderAllActiveViews();
    showToast(`✓ Added ${data.member.name} (${data.member.regNo}) to Vishnu Institute of Technology roster!`, 'success');
  }
}

// ============================================================================
// CSV EXPORTS & PROMPT COPY
// ============================================================================
function exportCurrentDateCSV() {
  const recs = state.attendance[state.selectedDate] || {};
  const rows = [['VIT Reg No', 'Member Name', 'Wing', 'Role', 'Date', 'Status', 'Note']];
  getVisibleMembers().forEach((m) => {
    const r = recs[m.id] || { status: 'unmarked', note: '' };
    rows.push([m.regNo, m.name, m.wing, m.role, state.selectedDate, r.status.toUpperCase(), `"${(r.note || '').replace(/"/g, '""')}"`]);
  });
  downloadCSV(rows, `VIT_MITRA_Daily_Attendance_${state.selectedDate}.csv`);
}

function exportMonthlyCSV() {
  const monthDates = Object.keys(state.attendance)
    .filter((d) => d.startsWith(state.selectedMonth))
    .sort();

  const rows = [['VIT Reg No', 'Member Name', 'Wing', 'Role', 'Month', 'Sessions Conducted', 'Present', 'OD', 'Late', 'Absent', 'Attendance %']];
  getVisibleMembers().forEach((m) => {
    let s = 0, p = 0, od = 0, l = 0, a = 0;
    monthDates.forEach((d) => {
      const st = state.attendance[d]?.[m.id]?.status;
      if (st) {
        s++;
        if (st === 'present') p++;
        else if (st === 'od') od++;
        else if (st === 'late') l++;
        else if (st === 'absent') a++;
      }
    });
    const pct = s > 0 ? Math.round(((p + od + l) / s) * 1000) / 10 : 100;
    rows.push([m.regNo, m.name, m.wing, m.role, state.selectedMonth, s, p, od, l, a, `${pct}%`]);
  });
  downloadCSV(rows, `VIT_MITRA_Monthly_Report_${state.selectedMonth}.csv`);
}

function downloadCSV(rows, filename) {
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`⬇ Downloaded ${filename}`, 'success');
}

function copyMasterPrompt() {
  navigator.clipboard.writeText(state.promptText || '').then(() => {
    showToast('📋 Copied Vishnu Institute of Technology AI Builder Prompt to clipboard!', 'success');
  });
}

// ============================================================================
// CHANGE / UPDATE PASSWORD
// ============================================================================
function openChangePasswordModal(prefillId) {
  const modal = document.getElementById('change-password-modal');
  const input = document.getElementById('cp-identifier');
  if (modal) {
    modal.classList.remove('hidden');
    if (input) {
      if (prefillId) {
        input.value = prefillId;
      } else if (state.currentUser && state.currentUser.regNo) {
        input.value = state.currentUser.regNo;
      } else {
        const gateVal = document.getElementById('gate-email-input')?.value?.trim();
        if (gateVal) input.value = gateVal;
      }
    }
  }
}

function closeChangePasswordModal() {
  const modal = document.getElementById('change-password-modal');
  if (modal) modal.classList.add('hidden');
  const p1 = document.getElementById('cp-new-password');
  const p2 = document.getElementById('cp-confirm-password');
  if (p1) p1.value = '';
  if (p2) p2.value = '';
}

function toggleCPPasswordVisibility() {
  const p1 = document.getElementById('cp-new-password');
  const p2 = document.getElementById('cp-confirm-password');
  if (p1) p1.type = p1.type === 'password' ? 'text' : 'password';
  if (p2) p2.type = p2.type === 'password' ? 'text' : 'password';
}

async function submitChangePassword(e) {
  e.preventDefault();
  const identifier = document.getElementById('cp-identifier')?.value?.trim();
  const newPassword = document.getElementById('cp-new-password')?.value;
  const confirmPassword = document.getElementById('cp-confirm-password')?.value;

  if (!identifier) {
    showToast('Please enter your VIT Reg. No. or Email', 'error');
    return;
  }
  if (!newPassword || newPassword.length < 2) {
    showToast('Password must be at least 2 characters long', 'error');
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match. Please verify.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, newPassword, confirmPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to update password', 'error');
      return;
    }

    if (!state.passwords) state.passwords = {};
    if (data.regNo) state.passwords[data.regNo] = newPassword;
    try {
      localStorage.setItem('vit_mitra_custom_passwords', JSON.stringify(state.passwords));
    } catch (e) {}

    closeChangePasswordModal();
    // Also auto-fill the login gate password field if visible
    const gatePass = document.getElementById('gate-password-input');
    const gateEmail = document.getElementById('gate-email-input');
    if (gatePass) gatePass.value = newPassword;
    if (gateEmail && identifier) gateEmail.value = identifier;

    showToast(`✓ Password changed successfully for ${data.name || identifier}!`, 'success');
  } catch (err) {
    // Offline / Standalone dist/index.html fallback
    if (!state.passwords) state.passwords = {};
    const cleanId = identifier.toUpperCase();
    state.passwords[cleanId] = newPassword;
    try {
      localStorage.setItem('vit_mitra_custom_passwords', JSON.stringify(state.passwords));
    } catch (e) {}
    closeChangePasswordModal();
    const gatePass = document.getElementById('gate-password-input');
    if (gatePass) gatePass.value = newPassword;
    showToast(`✓ Password updated locally for ${cleanId}!`, 'success');
  }
}

window.addEventListener('DOMContentLoaded', initApp);
