/* ============================================================
   POMODORO PALACE — app logic
   State disimpan di localStorage (key: pomodoroPalace.v1)
   Timer memakai endTime agar akurat walau tab tidak aktif.
   ============================================================ */

const STORE_KEY = 'pomodoroPalace.v1';
const CYCLE_GOAL = 4; // 4 fokus -> long break disarankan

const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15, auto: false };

const FLAVOR = {
  idle: {
    focus: 'The Palace awaits, rebel. Start your infiltration.',
    short: 'Catch your breath. The Shadows are regrouping too.',
    long: 'Well earned. Even phantom thieves need rest.',
  },
  running: {
    focus: 'Infiltrating the Palace… stay silent, stay focused.',
    short: 'Short break — stretch, hydrate, breathe.',
    long: 'Long break — the treasure can wait a little longer.',
  },
};

/* ---------- state ---------- */
let state = loadState();

function defaultState() {
  return {
    sessions: [],            // { date: 'YYYY-MM-DD', minutes: n, at: timestamp }
    settings: { ...DEFAULT_SETTINGS },
    cycle: 0,                // fokus selesai dalam siklus berjalan
    streak: { count: 0, lastDate: null },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = Object.assign(defaultState(), JSON.parse(raw));
    s.settings = Object.assign({ ...DEFAULT_SETTINGS }, s.settings);
    return s;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- timer ---------- */
let mode = 'focus';          // focus | short | long
let running = false;
let secondsLeft = DEFAULT_SETTINGS.focus * 60;
let endTime = null;
let tickId = null;

const $ = sel => document.querySelector(sel);

function modeMinutes(m) {
  return state.settings[m] || DEFAULT_SETTINGS[m];
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function setMode(m, resetTimer = true) {
  pauseTimer();
  mode = m;
  if (resetTimer) secondsLeft = modeMinutes(m) * 60;
  document.querySelectorAll('.mode-chip').forEach(ch =>
    ch.classList.toggle('active', ch.dataset.mode === m));
  $('#timerModeLabel').textContent = chipLabel(m);
  updateDisplay();
  setFlavor(FLAVOR.idle[m]);
}

function chipLabel(m) {
  return m === 'focus' ? 'FOCUS' : m === 'short' ? 'SHORT BREAK' : 'LONG BREAK';
}

function updateDisplay() {
  $('#timerDisplay').textContent = fmt(Math.max(0, secondsLeft));
  document.title = fmt(Math.max(0, secondsLeft)) + ' — Pomodoro Palace';
}

function startTimer() {
  if (running) return pauseTimer();
  ensureAudio();
  running = true;
  endTime = Date.now() + secondsLeft * 1000;
  $('#btnStart').textContent = 'PAUSE';
  $('.timer-ring').classList.add('running');
  setFlavor(FLAVOR.running[mode]);
  tickId = setInterval(tick, 250);
  tick();
}

function pauseTimer() {
  running = false;
  clearInterval(tickId);
  $('#btnStart').textContent = 'START';
  $('.timer-ring').classList.remove('running');
  if (secondsLeft > 0) setFlavor(FLAVOR.idle[mode]);
}

function resetTimer() {
  pauseTimer();
  secondsLeft = modeMinutes(mode) * 60;
  updateDisplay();
  setFlavor(FLAVOR.idle[mode]);
}

function tick() {
  secondsLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  updateDisplay();
  if (secondsLeft <= 0) completeSession();
}

function completeSession() {
  pauseTimer();
  playJingle();

  if (mode === 'focus') {
    const mins = modeMinutes('focus');
    state.sessions.push({ date: todayStr(), minutes: mins, at: Date.now() });
    state.cycle += 1;
    touchStreak();
    flash('TREASURE<br>SECURED!');
    saveState();
    renderStats();
    renderCycle();
    // alur otomatis: 4 fokus -> long break, selain itu short break
    const next = state.cycle >= CYCLE_GOAL ? 'long' : 'short';
    if (state.cycle >= CYCLE_GOAL) state.cycle = 0;
    setMode(next);
    renderCycle();
    if (state.settings.auto) startTimer();
  } else {
    flash(mode === 'short' ? 'BREAK<br>OVER!' : 'REST<br>COMPLETE!');
    setMode('focus');
    if (state.settings.auto) startTimer();
  }
}

/* ---------- helpers ---------- */
function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

function setFlavor(t) { $('#flavorLine').textContent = t; }

/* ---------- streak ---------- */
function touchStreak() {
  const today = todayStr();
  const last = state.streak.lastDate;
  if (last === today) return;
  state.streak.count = (last && daysBetween(last, today) === 1) ? state.streak.count + 1 : 1;
  state.streak.lastDate = today;
}

function checkStreakDecay() {
  const last = state.streak.lastDate;
  if (last && daysBetween(last, todayStr()) > 1) {
    state.streak.count = 0;
    state.streak.lastDate = null;
  }
}

/* ---------- stats ---------- */
function sessionsOn(date) {
  return state.sessions.filter(s => s.date === date);
}

function renderStats() {
  const today = todayStr();
  const todays = sessionsOn(today);
  const minutes = todays.reduce((a, s) => a + s.minutes, 0);

  $('#statSessions').textContent = todays.length;
  $('#statMinutes').textContent = minutes;
  $('#statTotal').textContent = state.sessions.length;
  $('#streakNum').textContent = state.streak.count;

  // grafik 7 hari terakhir (menit fokus)
  const days = [];
  for (let i = -6; i <= 0; i++) {
    const d = todayStr(i);
    days.push({
      date: d,
      name: new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase(),
      minutes: sessionsOn(d).reduce((a, s) => a + s.minutes, 0),
      isToday: i === 0,
    });
  }
  const max = Math.max(1, ...days.map(d => d.minutes));
  $('#weekChart').innerHTML = days.map(d =>
    '<div class="day-col">' +
      '<div class="day-val">' + d.minutes + '</div>' +
      '<div class="day-bar' + (d.isToday ? ' today' : '') + '" style="height:' + Math.max(6, (d.minutes / max) * 110) + 'px"></div>' +
      '<div class="day-name' + (d.isToday ? ' today' : '') + '">' + d.name + '</div>' +
    '</div>'
  ).join('');
}

function renderCycle() {
  const dots = $('#cycleDots');
  dots.innerHTML = '';
  for (let i = 0; i < CYCLE_GOAL; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < state.cycle ? ' filled' : '');
    dots.appendChild(d);
  }
}

/* ---------- flash ---------- */
let flashTimer = null;
function flash(html) {
  $('#flashText').innerHTML = html;
  const f = $('#flash');
  f.classList.remove('show');
  void f.offsetWidth;
  f.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => f.classList.remove('show'), 1500);
}

/* ---------- sound (Web Audio, tanpa file) ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* abaikan */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playJingle() {
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

/* ---------- init ---------- */
function init() {
  // isi form settings dari state
  $('#setFocus').value = state.settings.focus;
  $('#setShort').value = state.settings.short;
  $('#setLong').value = state.settings.long;
  $('#setAuto').checked = !!state.settings.auto;

  $('#settingsForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = Math.min(180, Math.max(1, parseInt($('#setFocus').value, 10) || 25));
    const s = Math.min(60, Math.max(1, parseInt($('#setShort').value, 10) || 5));
    const l = Math.min(90, Math.max(1, parseInt($('#setLong').value, 10) || 15));
    state.settings = { focus: f, short: s, long: l, auto: $('#setAuto').checked };
    saveState();
    if (!running) {
      secondsLeft = modeMinutes(mode) * 60;
      updateDisplay();
    }
    flash('PLAN<br>SAVED!');
  });

  $('#btnWipe').addEventListener('click', () => {
    if (!confirm('Hapus SEMUA data Pomodoro Palace? Tindakan ini tidak bisa dibatalkan.')) return;
    state = defaultState();
    saveState();
    setMode('focus');
    $('#setFocus').value = state.settings.focus;
    $('#setShort').value = state.settings.short;
    $('#setLong').value = state.settings.long;
    $('#setAuto').checked = false;
    renderStats();
    renderCycle();
  });

  document.querySelectorAll('.mode-chip').forEach(ch =>
    ch.addEventListener('click', () => setMode(ch.dataset.mode)));

  $('#btnStart').addEventListener('click', startTimer);
  $('#btnReset').addEventListener('click', resetTimer);

  checkStreakDecay();
  saveState();
  setMode('focus');
  renderStats();
  renderCycle();
}

document.addEventListener('DOMContentLoaded', init);
