const state = { dashboard: null, demoCode: '' };
const $ = (selector) => document.querySelector(selector);

async function loadDashboard() {
  const response = await fetch('/api/dashboard');
  state.dashboard = await response.json();
  const { stats, users, activity, updated } = state.dashboard;
  $('#total-stat').textContent = stats.total.toLocaleString();
  $('#verified-stat').textContent = stats.verified.toLocaleString();
  $('#pending-stat').textContent = stats.pending;
  $('#flagged-stat').textContent = stats.flagged;
  $('#updated-time').textContent = updated;
  renderUsers(users, '#users-table');
  renderUsers(users, '#all-users-table');
  renderActivity(activity, '#activity-list');
  renderActivity(activity, '#activity-full');
}

function renderUsers(users, target) {
  const element = $(target);
  if (!element) return;
  element.innerHTML = users.map(user => `<tr><td><div class="applicant"><span class="user-avatar">${user.initials}</span><div><b>${user.name}</b><small>${user.id}</small></div></div></td><td>${user.document}</td><td><span class="status ${user.status === 'In review' ? 'review' : user.status === 'Needs action' ? 'action' : ''}">${user.status}</span></td><td><span class="risk ${user.risk.toLowerCase()}">${user.risk}</span></td><td>${user.joined}</td><td class="row-more">•••</td></tr>`).join('');
}

function renderActivity(items, target) {
  const element = $(target);
  if (!element) return;
  element.innerHTML = items.map(item => `<div class="activity-row"><span class="activity-icon ${item.tone}">${item.icon === 'check' ? '✓' : item.icon === 'alert' ? '!' : item.icon === 'phone' ? '⌁' : '＋'}</span><div class="activity-copy"><b>${item.title}</b><small>${item.detail}</small></div><span class="activity-time">${item.time}</span></div>`).join('');
}

function showPage(page) {
  document.querySelectorAll('.page-wrap').forEach(view => view.classList.add('hidden-page'));
  $(`#page-${page}`).classList.remove('hidden-page');
  document.querySelectorAll('.nav-item[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === page));
  $('#page-title').textContent = page === 'new-user' ? 'New verification' : page.charAt(0).toUpperCase() + page.slice(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-page]');
  if (trigger) showPage(trigger.dataset.page);
});

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 3200);
}

$('#send-otp').addEventListener('click', async () => {
  const phone = $('#phone-number').value;
  if (!phone.trim()) return toast('Enter a mobile number first.');
  const response = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
  const data = await response.json();
  if (!response.ok) return toast(data.error);
  state.demoCode = data.demo_code;
  $('#otp-message').textContent = `${data.message}. Demo code: ${data.demo_code}`;
  $('.otp-box').classList.remove('hidden');
  $('.form-section').classList.add('hidden');
  $('.otp-inputs input').forEach((input, index) => { input.value = data.demo_code[index]; });
  toast('Demo OTP generated.');
});

$('#check-otp').addEventListener('click', async () => {
  const code = [...document.querySelectorAll('.otp-inputs input')].map(input => input.value).join('');
  const response = await fetch('/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: $('#phone-number').value, code }) });
  const data = await response.json();
  if (!response.ok) return toast(data.error);
  $('.otp-box').classList.add('hidden');
  $('.form-success').classList.remove('hidden');
  document.querySelectorAll('.step')[1].classList.add('active');
  toast(data.message);
});

$('#verification-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await fetch('/api/verify-document', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('#applicant-name').value, document: $('#document-type').value }) });
  const data = await response.json();
  if (data.success) { toast(data.message); await loadDashboard(); showPage('applications'); }
});

$('#search-input').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  renderUsers(state.dashboard.users.filter(user => `${user.name} ${user.id} ${user.document}`.toLowerCase().includes(query)), '#users-table');
});
document.querySelectorAll('.otp-inputs input').forEach((input, index, inputs) => input.addEventListener('input', () => inputs[index + 1]?.focus()));
loadDashboard();
