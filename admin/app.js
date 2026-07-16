// ─── Админка: логика ──────────────────────────────────────────
// Авторизация: GitHub PAT (fine-grained, Contents r/w + Actions r/w).
// Порядок действий:
//   1. (если есть файл) загрузка картинки → PUT /contents/_uploads/{tmp}
//   2. POST /dispatches c client_payload {action, ...}
//   3. Опрос /actions/runs до завершения workflow

const STORAGE_KEY = 'lapteva-admin-creds';
const API = 'https://api.github.com';

const $ = sel => document.querySelector(sel);

let CREDS = null;
let INDEX = null;

// ──────────── Запуск ────────────
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      CREDS = JSON.parse(saved);
      $('#f-repo').value = CREDS.repo || '';
      $('#f-user').value = CREDS.user || '';
      $('#f-token').value = CREDS.token || '';
      $('#f-remember').checked = true;
    } catch {}
  }
  $('#login-form').addEventListener('submit', onLogin);
  $('#logout').addEventListener('click', onLogout);
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', onTabClick));
  $('#add-form').addEventListener('submit', onAddSubmit);
  $('#series-form').addEventListener('submit', onSeriesSubmit);
  $('#remove-form').addEventListener('submit', onRemoveSubmit);
  $('#remove-series-form').addEventListener('submit', onRemoveSeriesSubmit);
  $('#rm-series').addEventListener('change', onRmSeriesChange);

  // Название серии → автоматический латинский адрес
  $('#ns-title').addEventListener('input', () => {
    const id = $('#ns-id');
    if (!id.dataset.touched) {
      id.value = translit($('#ns-title').value);
      $('#ns-id-echo').textContent = id.value || '…';
    }
  });
  $('#ns-id').addEventListener('input', e => {
    e.target.dataset.touched = '1';
    $('#ns-id-echo').textContent = e.target.value || '…';
  });
});

// ──────────── Вход ────────────
async function onLogin(e) {
  e.preventDefault();
  const repo = $('#f-repo').value.trim();
  const user = $('#f-user').value.trim();
  const token = $('#f-token').value.trim();
  if (!repo.includes('/')) return showLoginError('Репозиторий указывается в виде «имя-пользователя/название», например ivan/ekaterina-lapteva');

  try {
    const r = await fetch(`${API}/repos/${repo}`, { headers: ghHeaders(token) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (err) {
    return showLoginError('Не получилось войти. Проверьте: 1) нет ли опечатки в адресе репозитория; 2) не истёк ли срок ключа; 3) выданы ли ключу права Contents и Actions. (' + err.message + ')');
  }

  CREDS = { repo, user, token };
  if ($('#f-remember').checked) localStorage.setItem(STORAGE_KEY, JSON.stringify(CREDS));
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

// ──────────── Вкладки ────────────
function onTabClick(e) {
  const tab = e.currentTarget.dataset.tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}

// ──────────── Каталог серий ────────────
async function loadIndex() {
  const url = `https://raw.githubusercontent.com/${CREDS.repo}/HEAD/data/index.json?cb=${Date.now()}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('каталог не найден — возможно, сайт ещё ни разу не собирался');
    INDEX = await r.json();
  } catch (e) {
    log('⚠ Не удалось загрузить список серий: ' + e.message);
    INDEX = { series: [] };
  }
  fillSeriesDropdown('#add-series');
  fillSeriesDropdown('#rm-series');
  fillSeriesDropdown('#rms-series');
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
  if (!series) { sel.innerHTML = '<option value="">—</option>'; return; }
  sel.innerHTML = '<option value="">— выберите —</option>' +
    series.paintings.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

// ──────────── Добавить работу ────────────
async function onAddSubmit(e) {
  e.preventDefault();
  const series = $('#add-series').value;
  const file = $('#add-file').files[0];
  if (!series || !file) return;

  await runJob(e.target, async () => {
    const tmpName = await uploadImage(file);
    log('→ Отправляю данные картины…');
    await dispatch({
      action: 'add',
      series,
      title: $('#add-title').value.trim(),
      material: $('#add-material').value.trim(),
      size: $('#add-size').value.trim(),
      year: $('#add-year').value.trim(),
      description: $('#add-desc').value.trim(),
      upload: tmpName,
    });
  }, 'Картина добавлена! Откройте сайт через полминуты — если её не видно, обновите страницу через Ctrl+F5.');
}

// ──────────── Новая серия ────────────
async function onSeriesSubmit(e) {
  e.preventDefault();
  const file = $('#ns-file').files[0];
  const id = $('#ns-id').value.trim();
  if (!file || !id) return;
  if (INDEX.series.some(s => s.id === id)) {
    showLog();
    log('✗ Серия с адресом «' + id + '» уже существует. Придумайте другой адрес.');
    return;
  }

  await runJob(e.target, async () => {
    const tmpName = await uploadImage(file);
    log('→ Отправляю данные серии…');
    await dispatch({
      action: 'add_series',
      id,
      title: $('#ns-title').value.trim(),
      material: $('#ns-material').value.trim(),
      years: $('#ns-years').value.trim(),
      description: $('#ns-desc').value.trim(),
      upload: tmpName,
    });
  }, 'Серия создана! Теперь можно добавлять в неё работы на вкладке «Добавить работу».');
}

// ──────────── Удалить работу ────────────
async function onRemoveSubmit(e) {
  e.preventDefault();
  const series = $('#rm-series').value;
  const title = $('#rm-painting').value;
  if (!series || !title) return;
  if (!confirm(`Удалить картину «${title}» с сайта?\nЭто действие нельзя отменить.`)) return;

  await runJob(e.target, async () => {
    log('→ Отправляю запрос на удаление…');
    await dispatch({ action: 'remove', series, title });
  }, 'Картина удалена с сайта.');
}

// ──────────── Удалить серию ────────────
async function onRemoveSeriesSubmit(e) {
  e.preventDefault();
  const sid = $('#rms-series').value;
  const series = INDEX.series.find(s => s.id === sid);
  if (!series) return;
  const typed = $('#rms-confirm').value.trim().toLowerCase();
  if (typed !== series.title.toLowerCase()) {
    showLog();
    log(`✗ Название не совпало. Чтобы удалить серию, впишите в поле подтверждения: ${series.title}`);
    return;
  }
  if (!confirm(`Удалить серию «${series.title}» ЦЕЛИКОМ вместе со всеми ${series.paintings.length} работами?\nЭто действие нельзя отменить.`)) return;

  await runJob(e.target, async () => {
    log('→ Отправляю запрос на удаление серии…');
    await dispatch({ action: 'remove_series', series: sid });
  }, 'Серия полностью удалена с сайта.');
}

// ──────────── Общий сценарий задачи ────────────
async function runJob(form, steps, doneMessage) {
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  showLog();
  try {
    await steps();
    log('→ Сайт обновляется, обычно это занимает 1–2 минуты. Подождите…');
    await pollLastRun();
    log('');
    log('✓ Готово. ' + doneMessage);
    form.reset();
    const echo = $('#ns-id-echo'); if (echo) echo.textContent = '…';
    const nsId = $('#ns-id'); if (nsId) delete nsId.dataset.touched;
    setTimeout(loadIndex, 3000);
  } catch (err) {
    log('');
    log('✗ Что-то пошло не так: ' + err.message);
    log('  Попробуйте ещё раз. Если не помогает — см. раздел «Если что-то не работает» в ADMIN_SETUP.md');
  } finally {
    btn.disabled = false;
  }
}

async function uploadImage(file) {
  log(`→ Загружаю фотографию (${file.name}, ${(file.size / 1024 / 1024).toFixed(1)} МБ)…`);
  const ext = (file.name.match(/\.[^.]+$/) || ['.jpg'])[0].toLowerCase();
  const tmpName = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const b64 = await fileToBase64(file);
  await uploadToRepo(`_uploads/${tmpName}`, b64, `Upload ${tmpName}`);
  log('✓ Фотография загружена');
  return tmpName;
}

// ──────────── GitHub API ────────────
async function uploadToRepo(path, base64, message) {
  const url = `${API}/repos/${CREDS.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64 }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`не удалось загрузить файл: ${r.status} ${t.slice(0, 200)}`);
  }
}

let LAST_SEEN_RUN = null; // id последнего запуска ДО нашего dispatch

async function newestRunId() {
  const r = await fetch(`${API}/repos/${CREDS.repo}/actions/runs?per_page=1`, { headers: ghHeaders() });
  const j = await r.json();
  return (j.workflow_runs && j.workflow_runs[0]) ? j.workflow_runs[0].id : 0;
}

async function dispatch(payload) {
  // Запоминаем последний существующий запуск, чтобы потом ждать именно НОВЫЙ
  // (сравнение по id, а не по времени — не зависит от часов компьютера).
  try { LAST_SEEN_RUN = await newestRunId(); } catch { LAST_SEEN_RUN = null; }

  const r = await fetch(`${API}/repos/${CREDS.repo}/dispatches`, {
    method: 'POST',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'paintings-update', client_payload: payload }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`не удалось запустить обновление: ${r.status} ${t.slice(0, 200)}`);
  }
}

async function pollLastRun() {
  const start = Date.now();
  let runId = null;
  while (Date.now() - start < 90_000) {
    const r = await fetch(`${API}/repos/${CREDS.repo}/actions/runs?event=repository_dispatch&per_page=10`, { headers: ghHeaders() });
    const j = await r.json();
    let runs = (j.workflow_runs || []).filter(x => !x.path || x.path.endsWith('update-paintings.yml'));
    if (LAST_SEEN_RUN !== null) {
      runs = runs.filter(x => x.id > LAST_SEEN_RUN);
    } else {
      // запасной вариант: по времени, с допуском на расхождение часов до 10 минут
      runs = runs.filter(x => Math.abs(Date.now() - new Date(x.created_at).getTime()) < 600_000);
    }
    if (runs.length) { runId = runs[0].id; break; }
    await sleep(2500);
  }
  if (!runId) throw new Error('обновление не запустилось (workflow run не найден)');

  let dots = 0;
  while (Date.now() - start < 5 * 60_000) {
    const r = await fetch(`${API}/repos/${CREDS.repo}/actions/runs/${runId}`, { headers: ghHeaders() });
    const j = await r.json();
    if (j.status === 'completed') {
      if (j.conclusion !== 'success') {
        throw new Error(`обновление завершилось с ошибкой (${j.conclusion}). Подробности: ${j.html_url}`);
      }
      return;
    }
    dots = (dots % 3) + 1;
    log('  · выполняется' + '.'.repeat(dots));
    await sleep(5000);
  }
  throw new Error('обновление длится слишком долго — проверьте вкладку Actions на GitHub');
}

// ──────────── Утилиты ────────────
function translit(s) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  return s.toLowerCase()
    .split('').map(c => map[c] !== undefined ? map[c] : c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 30);
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('не удалось прочитать файл'));
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
  // строки «· выполняется...» заменяют друг друга, чтобы журнал не разрастался
  const lines = el.textContent.split('\n');
  if (msg.startsWith('  ·') && lines.length && lines[lines.length - 1].startsWith('  ·')) {
    lines[lines.length - 1] = msg;
    el.textContent = lines.join('\n');
  } else {
    el.textContent += (el.textContent ? '\n' : '') + msg;
  }
  el.scrollTop = el.scrollHeight;
}
