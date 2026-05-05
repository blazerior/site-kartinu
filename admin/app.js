// ─── Admin frontend ───────────────────────────────────────────
// Auth: GitHub PAT (fine-grained, Contents r/w + Actions r/w on repo).
// Flow:
//   1. Upload image (base64) → PUT /repos/{repo}/contents/_uploads/{tmp}
//   2. POST /repos/{repo}/dispatches with client_payload {action, ...}
//   3. Poll /repos/{repo}/actions/runs to show status

const STORAGE_KEY = 'lapteva-admin-creds';
const API = 'https://api.github.com';

const $ = sel => document.querySelector(sel);

let CREDS = null;
let INDEX = null;

// ──────────── Boot ────────────
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      CREDS = JSON.parse(saved);
      const r = $('#f-repo'), u = $('#f-user'), t = $('#f-token'), m = $('#f-remember');
      if (r) r.value = CREDS.repo || '';
      if (u) u.value = CREDS.user || '';
      if (t) t.value = CREDS.token || '';
      if (m) m.checked = true;
    } catch {}
  }
  $('#login-form').addEventListener('submit', onLogin);
  $('#logout').addEventListener('click', onLogout);
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', onTabClick));
  $('#add-form').addEventListener('submit', onAddSubmit);
  $('#remove-form').addEventListener('submit', onRemoveSubmit);
  $('#rm-series').addEventListener('change', onRmSeriesChange);
});

// ──────────── Login ────────────
async function onLogin(e) {
  e.preventDefault();
  const repo = $('#f-repo').value.trim();
  const user = $('#f-user').value.trim();
  const token = $('#f-token').value.trim();
  const remember = $('#f-remember').checked;
  if (!repo.includes('/')) return showLoginError('Repo в формате owner/name');

  // Validate token
  try {
    const r = await fetch(`${API}/repos/${repo}`, { headers: ghHeaders(token) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (err) {
    return showLoginError('Не удалось проверить токен: ' + err.message);
  }

  CREDS = { repo, user, token };
  if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(CREDS));
  else localStorage.removeItem(STORAGE_KEY);

  $('#login-screen').hidden = true;
  $('#workspace').hidden = false;
  await loadIndex();
}

function showLoginError(msg) {
  const el = $('#login-error');
  el.textContent = msg;
  el.hidden = false;
}

function onLogout() {
  localStorage.removeItem(STORAGE_KEY);
  CREDS = null;
  location.reload();
}

function ghHeaders(token = CREDS?.token) {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// ──────────── Tabs ────────────
function onTabClick(e) {
  const tab = e.currentTarget.dataset.tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}

// ──────────── Index ────────────
async function loadIndex() {
  const url = `https://raw.githubusercontent.com/${CREDS.repo}/HEAD/data/index.json?cb=${Date.now()}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('index.json не найден; запустите workflow один раз вручную');
    INDEX = await r.json();
  } catch (e) {
    log('⚠ ' + e.message);
    INDEX = { series: [] };
  }
  fillSeriesDropdown('#add-series');
  fillSeriesDropdown('#rm-series');
  onRmSeriesChange();
}

function fillSeriesDropdown(sel) {
  const el = $(sel);
  el.innerHTML = '<option value="">— выберите серию —</option>' +
    INDEX.series.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('');
}

function onRmSeriesChange() {
  const sid = $('#rm-series').value;
  const series = INDEX.series.find(s => s.id === sid);
  const sel = $('#rm-painting');
  if (!series) {
    sel.innerHTML = '<option value="">—</option>';
    return;
  }
  sel.innerHTML = '<option value="">— выберите —</option>' +
    series.paintings.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

// ──────────── Add ────────────
async function onAddSubmit(e) {
  e.preventDefault();
  const series = $('#add-series').value;
  const title = $('#add-title').value.trim();
  const material = $('#add-material').value.trim();
  const size = $('#add-size').value.trim();
  const year = $('#add-year').value.trim();
  const file = $('#add-file').files[0];
  if (!series || !file) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  showLog();
  try {
    log(`→ Загрузка изображения (${file.name}, ${(file.size / 1024).toFixed(1)} KB)…`);
    const ext = (file.name.match(/\.[^.]+$/) || ['.jpg'])[0].toLowerCase();
    const tmpName = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const b64 = await fileToBase64(file);
    await uploadToRepo(`_uploads/${tmpName}`, b64, `Upload ${tmpName}`);
    log(`✓ Загружено в _uploads/${tmpName}`);

    log(`→ Триггерим workflow…`);
    await dispatch({ action: 'add', series, title, material, size, year, upload: tmpName });
    log(`✓ Запрос отправлен`);

    log(`→ Ждём выполнения (это может занять 1–2 мин)…`);
    await pollLastRun();
    log(`✓ Готово. Откройте сайт через ~30 сек, чтобы увидеть изменения.`);
    e.target.reset();
    setTimeout(loadIndex, 3000);
  } catch (err) {
    log('✗ Ошибка: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ──────────── Remove ────────────
async function onRemoveSubmit(e) {
  e.preventDefault();
  const series = $('#rm-series').value;
  const title = $('#rm-painting').value;
  if (!series || !title) return;
  if (!confirm(`Удалить «${title}»?`)) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  showLog();
  try {
    log(`→ Триггерим workflow…`);
    await dispatch({ action: 'remove', series, title });
    log(`✓ Запрос отправлен`);
    log(`→ Ждём выполнения…`);
    await pollLastRun();
    log(`✓ Готово.`);
    setTimeout(loadIndex, 3000);
  } catch (err) {
    log('✗ Ошибка: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ──────────── GitHub API helpers ────────────
async function uploadToRepo(path, base64, message) {
  const url = `${API}/repos/${CREDS.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64 }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`upload failed: ${r.status} ${t.slice(0, 200)}`);
  }
}

async function dispatch(payload) {
  const r = await fetch(`${API}/repos/${CREDS.repo}/dispatches`, {
    method: 'POST',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'paintings-update', client_payload: payload }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`dispatch failed: ${r.status} ${t.slice(0, 200)}`);
  }
}

async function pollLastRun() {
  const start = Date.now();
  let runId = null;
  // Wait for run to appear
  while (Date.now() - start < 30_000) {
    const r = await fetch(`${API}/repos/${CREDS.repo}/actions/runs?event=repository_dispatch&per_page=5`, { headers: ghHeaders() });
    const j = await r.json();
    const recent = (j.workflow_runs || []).filter(x => Date.now() - new Date(x.created_at).getTime() < 120_000);
    if (recent.length) { runId = recent[0].id; break; }
    await sleep(2500);
  }
  if (!runId) throw new Error('workflow run не обнаружен');
  log(`  · run #${runId}`);

  while (Date.now() - start < 5 * 60_000) {
    const r = await fetch(`${API}/repos/${CREDS.repo}/actions/runs/${runId}`, { headers: ghHeaders() });
    const j = await r.json();
    if (j.status === 'completed') {
      if (j.conclusion !== 'success') {
        throw new Error(`workflow завершился со статусом: ${j.conclusion}. Лог: ${j.html_url}`);
      }
      return;
    }
    log(`  · ${j.status}…`);
    await sleep(5000);
  }
  throw new Error('таймаут ожидания workflow');
}

// ──────────── Utils ────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showLog() {
  $('#log').hidden = false;
  $('#log-text').textContent = '';
}

function log(msg) {
  const el = $('#log-text');
  el.textContent += msg + '\n';
  el.scrollTop = el.scrollHeight;
}
