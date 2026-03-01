/*SARAMOSING ASHLEY R. FULL-STACK JS */
let currentUser = null;
const KEY = 'ipt_demo_v1';
const $ = id => document.getElementById(id);

window.db = { accounts:[], departments:[], employees:[], requests:[] };

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { window.db = JSON.parse(raw); return; }
  } catch(e) {}

  window.db = {
    accounts:    [{ id:uid(), firstName:'Admin', lastName:'User', email:'admin@example.com', password:'Password123!', role:'admin', verified:true }],
    departments: [{ id:uid(), name:'Engineering', description:'Software team' }, { id:uid(), name:'HR', description:'Human Resources' }],
    employees:   [],
    requests:    []
  };
  save();
}

const save = () => localStorage.setItem(KEY, JSON.stringify(window.db));
const uid  = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const cap  = s => s.charAt(0).toUpperCase() + s.slice(1);

function showToast(msg, type='info') {
  const el = $('toast');
  $('toast-body').textContent = msg;
  el.className = `toast align-items-center border-0 text-white bg-${type === 'warning' ? 'warning text-dark' : type}`;
  new bootstrap.Toast(el, { delay:3000 }).show();
}

// This part is where the navigation and routing occurs @SARAMOSINH
const navigateTo = hash => window.location.hash = hash;

function handleRouting() {
  const route = (window.location.hash || '#/').replace('#/','') || 'home';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  if (['profile','requests'].includes(route) && !currentUser)
    return showToast('Please log in.','warning'), navigateTo('#/login');
  if (['employees','accounts','departments'].includes(route)) {
    if (!currentUser) return navigateTo('#/login');
    if (currentUser.role !== 'admin') return showToast('Admins only.','danger'), navigateTo('#/');
  }

  const pages = { home:'home-page', register:'register-page', 'verify-email':'verify-email-page',
    login:'login-page', profile:'profile-page', employees:'employees-page',
    departments:'departments-page', accounts:'accounts-page', requests:'requests-page' };

  const el = $(pages[route] || 'home-page');
  if (el) el.classList.add('active');

  const renders = { profile:renderProfile, employees:renderEmployees,
    departments:renderDepartments, accounts:renderAccounts, requests:renderRequests };
  if (renders[route]) renders[route]();

  if (route === 'verify-email') {
    $('verify-email-display').textContent = localStorage.getItem('unverified_email') || '';
    $('verified-msg').classList.add('d-none');
  }
}
window.addEventListener('hashchange', handleRouting);

// For authentication @SARAMOSING
function setAuthState(isAuth, user=null) {
  currentUser = user;
  document.body.className = isAuth
    ? (user.role==='admin' ? 'authenticated is-admin' : 'authenticated')
    : 'not-authenticated';
  if (isAuth) $('nav-username').textContent = user.role==='admin' ? 'Admin' : user.firstName;
}

function checkExistingAuth() {
  const token = localStorage.getItem('auth_token');
  const user  = token && window.db.accounts.find(a => a.email===token && a.verified);
  user ? setAuthState(true, user) : localStorage.removeItem('auth_token');
}

// For registration @SARAMOSING
$('register-form').addEventListener('submit', e => {
  e.preventDefault();
  const [fn, ln, em, pw] = ['reg-firstname','reg-lastname','reg-email','reg-password'].map(id => $(id).value.trim());
  if (window.db.accounts.find(a => a.email===em.toLowerCase()))
    return showToast('Email already registered.','danger');
  window.db.accounts.push({ id:uid(), firstName:fn, lastName:ln, email:em.toLowerCase(), password:pw, role:'user', verified:false });
  save();
  localStorage.setItem('unverified_email', em.toLowerCase());
  $('register-form').reset();
  navigateTo('#/verify-email');
});

// For verification simulation @SARAMOSING
$('simulate-verify-btn').addEventListener('click', () => {
  const acc = window.db.accounts.find(a => a.email === localStorage.getItem('unverified_email'));
  if (!acc) return;
  acc.verified = true; save();
  localStorage.removeItem('unverified_email');
  $('verified-msg').classList.remove('d-none');
  showToast('Email verified! You may now log in.','success');
});

// This part is for the Login page @SARAMOSING
$('login-btn').addEventListener('click', () => {
  const em  = $('login-email').value.trim().toLowerCase();
  const pw  = $('login-password').value;
  const acc = window.db.accounts.find(a => a.email===em && a.password===pw && a.verified);
  if (acc) {
    localStorage.setItem('auth_token', em);
    setAuthState(true, acc);
    $('login-error').classList.add('d-none');
    $('login-email').value = $('login-password').value = '';
    showToast(`Welcome, ${acc.firstName}!`,'success');
    navigateTo('#/profile');
  } else {
    $('login-error').textContent = 'Invalid credentials or email not verified.';
    $('login-error').classList.remove('d-none');
  }
});

// This part is for the Logout button in the navbar @SARAMOSING
$('logout-btn').addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('auth_token');
  setAuthState(false);
  showToast('Logged out.','info');
  navigateTo('#/');
});

// This part is for the Profile page @SARAMOSING
function renderProfile() {
  if (!currentUser) return;
  $('profile-content').innerHTML = `
    <div class="profile-card">
      <h5>${currentUser.firstName} ${currentUser.lastName}</h5>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Role:</strong> ${cap(currentUser.role)}</p>
      <button class="btn btn-outline-primary btn-sm mt-1" onclick="alert('Edit Profile – not implemented.')">Edit Profile</button>
    </div>`;
}

// This part is for the Employees page @SARAMOSING
function renderEmployees() {
  $('employees-tbody').innerHTML = window.db.employees.length
    ? window.db.employees.map(e => {
        const d = window.db.departments.find(x => x.id===e.deptId);
        return `<tr><td>${e.empId}</td><td>${e.email}</td><td>${e.position}</td><td>${d?d.name:'—'}</td>
          <td>
            <button class="btn btn-action-edit btn-outline-primary" onclick="openEmpForm('${e.id}')">Edit</button>
            <button class="btn btn-action-delete btn-outline-danger ms-1" onclick="delEmp('${e.id}')">Delete</button>
          </td></tr>`;
      }).join('')
    : '<tr><td colspan="5" class="text-center text-muted">No employees.</td></tr>';
}

$('show-add-employee-btn').addEventListener('click', () => openEmpForm(null));
$('cancel-employee-btn').addEventListener('click', () => $('employee-form-box').classList.add('d-none'));

function openEmpForm(id) {
  $('employee-form-box').classList.remove('d-none');
  $('emp-dept').innerHTML = window.db.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  const e = id ? window.db.employees.find(x => x.id===id) : {};
  $('emp-edit-id').value = e.id||'';       $('emp-id').value = e.empId||'';
  $('emp-email').value = e.email||'';      $('emp-position').value = e.position||'';
  if (e.deptId) $('emp-dept').value = e.deptId;
  $('emp-hiredate').value = e.hireDate||'';
}

function delEmp(id) {
  if (!confirm('Delete this employee?')) return;
  window.db.employees = window.db.employees.filter(e => e.id!==id);
  save(); renderEmployees(); showToast('Employee deleted.','success');
}

$('save-employee-btn').addEventListener('click', () => {
  const [editId,empId,email,position,deptId,hireDate] =
    ['emp-edit-id','emp-id','emp-email','emp-position','emp-dept','emp-hiredate'].map(id => $(id).value.trim());
  if (!window.db.accounts.find(a => a.email===email.toLowerCase()))
    return showToast('User email must match an existing account.','danger');
  editId
    ? Object.assign(window.db.employees.find(e=>e.id===editId), {empId,email,position,deptId,hireDate})
    : window.db.employees.push({id:uid(),empId,email,position,deptId,hireDate});
  save(); renderEmployees();
  $('employee-form-box').classList.add('d-none');
  showToast(`Employee ${editId?'updated':'added'}.`,'success');
});

// This part is for the Departments page @SARAMOSING
function renderDepartments() {
  $('departments-tbody').innerHTML = window.db.departments.map(d => `
    <tr><td>${d.name}</td><td>${d.description}</td>
    <td>
      <button class="btn btn-action-edit btn-outline-primary" onclick="alert('Edit – not implemented')">Edit</button>
      <button class="btn btn-action-delete btn-outline-danger ms-1" onclick="alert('Delete – not implemented')">Delete</button>
    </td></tr>`).join('');
}

// this part is for the Accounts page @SARAMOSING 
function renderAccounts() {
  $('accounts-tbody').innerHTML = window.db.accounts.map(a => `
    <tr><td>${a.firstName} ${a.lastName}</td><td>${a.email}</td><td>${cap(a.role)}</td>
    <td class="${a.verified?'verified-yes':'verified-no'}">${a.verified?'✔':'—'}</td>
    <td>
      <button class="btn btn-action-edit btn-outline-primary" onclick="openAccForm('${a.id}')">Edit</button>
      <button class="btn btn-action-reset btn-outline-primary ms-1" onclick="resetPw('${a.id}')">Reset Password</button>
      <button class="btn btn-action-delete btn-outline-danger ms-1" onclick="delAcc('${a.id}')">Delete</button>
    </td></tr>`).join('');
}

$('show-add-account-btn').addEventListener('click', () => openAccForm(null));
$('cancel-account-btn').addEventListener('click', () => $('account-form-box').classList.add('d-none'));

function openAccForm(id) {
  $('account-form-box').classList.remove('d-none');
  const a = id ? window.db.accounts.find(x=>x.id===id) : {};
  $('acc-edit-id').value = a.id||'';          $('acc-firstname').value = a.firstName||'';
  $('acc-lastname').value = a.lastName||'';   $('acc-email').value = a.email||'';
  $('acc-password').value = a.password||'';   $('acc-role').value = a.role||'user';
  $('acc-verified').checked = !!a.verified;
}

function resetPw(id) {
  const pw = prompt('Enter new password (min 6 chars):');
  if (!pw || pw.length<6) return showToast('Password too short.','danger');
  window.db.accounts.find(a=>a.id===id).password = pw;
  save(); showToast('Password reset.','success');
}

function delAcc(id) {
  if (currentUser?.id===id) return showToast('Cannot delete yourself.','danger');
  if (!confirm('Delete this account?')) return;
  window.db.accounts = window.db.accounts.filter(a=>a.id!==id);
  save(); renderAccounts(); showToast('Account deleted.','success');
}

$('save-account-btn').addEventListener('click', () => {
  const [editId,fn,ln,em,pw,role] = ['acc-edit-id','acc-firstname','acc-lastname','acc-email','acc-password','acc-role'].map(id=>$(id).value.trim());
  const verified = $('acc-verified').checked;
  if (pw.length<6) return showToast('Password must be at least 6 characters.','danger');
  if (editId) {
    Object.assign(window.db.accounts.find(a=>a.id===editId), {firstName:fn,lastName:ln,email:em,password:pw,role,verified});
  } else {
    if (window.db.accounts.find(a=>a.email===em)) return showToast('Email already exists.','danger');
    window.db.accounts.push({id:uid(),firstName:fn,lastName:ln,email:em,password:pw,role,verified});
  }
  save(); renderAccounts();
  $('account-form-box').classList.add('d-none');
  showToast(`Account ${editId?'updated':'created'}.`,'success');
});

// This part is for he Requests page @SARAMOSING
function renderRequests() {
  if (!currentUser) return;
  const mine = window.db.requests.filter(r => r.employeeEmail===currentUser.email);
  const badge = s => `<span class="badge-${s==='Approved'?'approved':s==='Rejected'?'rejected':'pending'}">${s}</span>`;
  $('requests-content').innerHTML = mine.length
    ? `<table class="table table-bordered table-sm">
        <thead class="table-light"><tr><th>Date</th><th>Type</th><th>Items</th><th>Status</th></tr></thead>
        <tbody>${mine.map(r=>`<tr><td>${r.date}</td><td>${r.type}</td>
          <td>${r.items.map(i=>`${i.name}×${i.qty}`).join(', ')}</td>
          <td>${badge(r.status)}</td></tr>`).join('')}</tbody>
       </table>`
    : `<p class="text-muted">You have no requests yet.</p>
       <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#requestModal">Create One</button>`;
}

const buildRow = first => {
  const d = document.createElement('div'); d.className = 'req-item-row';
  d.innerHTML = `
    <input type="text" class="form-control item-name" placeholder="Item name">
    <input type="number" class="form-control item-qty" value="1" min="1">
    <button type="button" class="${first?'btn-add-item':'btn-remove-item'}"
      onclick="${first ? 'addRow()' : "this.closest('.req-item-row').remove()"}">
      ${first ? '+' : '×'}</button>`;
  return d;
};
const addRow = () => $('req-items-container').appendChild(buildRow(false));

$('requestModal').addEventListener('show.bs.modal', () => {
  const c = $('req-items-container'); c.innerHTML = ''; c.appendChild(buildRow(true));
});

$('submit-request-btn').addEventListener('click', () => {
  const items = [...document.querySelectorAll('#req-items-container .req-item-row')]
    .map(r => ({ name: r.querySelector('.item-name').value.trim(), qty: +r.querySelector('.item-qty').value }))
    .filter(i => i.name && i.qty > 0);
  if (!items.length) return showToast('Add at least one item.','warning');
  window.db.requests.push({ id:uid(), type:$('req-type').value, items,
    status:'Pending', date:new Date().toISOString().split('T')[0], employeeEmail:currentUser.email });
  save();
  bootstrap.Modal.getInstance($('requestModal')).hide();
  showToast('Request submitted!','success');
  renderRequests();
});

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  checkExistingAuth();
  if (!window.location.hash) window.location.hash = '#/';
  handleRouting();
});