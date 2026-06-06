// quiz.js — game logic

const MAX_ATTEMPTS = 3;
const POINTS_PER_Q  = 100;

let queue = [], qIdx = 0, score = 0, correctCount = 0;
let attemptsLeft = MAX_ATTEMPTS;
let answered = false;
let topScore = parseInt(localStorage.getItem('topScore') || '0', 10);
let correctlySolved = new Set(); // IDs answered correctly — stay green all game

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showTopScore();
  buildLegend();
  setupTabs();

  document.getElementById('btn-play').addEventListener('click', startGame);
  document.getElementById('btn-next').addEventListener('click', nextQ);
  document.getElementById('btn-repeat').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', showTitle);
  document.getElementById('hint-toggle').addEventListener('click', toggleHint);

  initMap().catch(err => console.error('Map load failed:', err));
});

function showTopScore() {
  if (topScore > 0) {
    const el = document.getElementById('top-score-display');
    el.style.display = 'block';
    document.getElementById('top-score-val').textContent = topScore;
  }
}

// ── HINT TOGGLE ──────────────────────────────────────────────────────────────
function toggleHint() {
  const hint = document.getElementById('feature-hint');
  const btn  = document.getElementById('hint-toggle');
  const visible = hint.style.display !== 'none';
  hint.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? '💡 Mostrar pista' : '🙈 Ocultar pista';
}

function resetHint() {
  document.getElementById('feature-hint').style.display = 'none';
  document.getElementById('hint-toggle').textContent = '💡 Mostrar pista';
}

// ── LEGEND ───────────────────────────────────────────────────────────────────
function buildLegend() {
  const list = document.getElementById('legend-list');
  FEATURES.forEach(f => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-num">${f.id}</span><span class="legend-name">${f.name}</span>`;
    // Clicking a legend entry highlights the feature on the map (once map is ready)
    item.addEventListener('click', () => {
      if (typeof panToFeature === 'function') panToFeature(f);
    });
    list.appendChild(item);
  });
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.toggle('hidden', p.dataset.panel !== target);
      });
    });
  });
}

// ── SCREEN HELPERS ───────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function showTitle() { showScreen('screen-title'); showTopScore(); }

// ── GAME START ───────────────────────────────────────────────────────────────
function startGame() {
  queue = shuffle(FEATURES.map(f => f.id));
  qIdx = 0; score = 0; correctCount = 0;
  answered = false;
  correctlySolved.clear();
  document.getElementById('hist-list').innerHTML = '';
  clearAllStates();
  showScreen('screen-game');
  renderQ();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── RENDER QUESTION ──────────────────────────────────────────────────────────
function renderQ() {
  answered     = false;
  attemptsLeft = MAX_ATTEMPTS;

  // Clear per-question states, preserve green on solved features
  clearCurrentQ();
  correctlySolved.forEach(id => setFeatureState(id, 'correct'));

  const fId = queue[qIdx];
  const f   = FEATURES.find(x => x.id === fId);

  document.getElementById('q-counter').textContent    = ` ${qIdx + 1} / ${FEATURES.length}`;
  document.getElementById('score-display').textContent = score;
  document.getElementById('progress-bar').style.width  = (qIdx / FEATURES.length * 100) + '%';

  document.getElementById('feature-name').textContent = f.name;
  document.getElementById('feature-hint').textContent = f.hint;
  resetHint();
  const b    = BADGE[f.cat];
  const badge = document.getElementById('feature-badge');
  badge.textContent = b.label;
  badge.className   = 'feature-badge ' + b.cls;

  updateAttemptsUI();
  setFeedback('', '');
  document.getElementById('btn-next').classList.add('hidden');

  setFeatureState(fId, 'target');
  panToFeature(f);
}

function updateAttemptsUI() {
  const el = document.getElementById('attempts-display');
  el.innerHTML = '';
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const dot = document.createElement('div');
    dot.className = 'attempt-dot ' + (i < (MAX_ATTEMPTS - attemptsLeft) ? 'used' : 'available');
    el.appendChild(dot);
  }
}

// ── CLICK HANDLER (called from map.js) ──────────────────────────────────────
function onFeatureClick(clickedId) {
  if (answered) return;

  const correctId      = queue[qIdx];
  const correctFeature = FEATURES.find(f => f.id === correctId);

  if (clickedId === correctId) {
    answered = true;
    correctlySolved.add(correctId);
    setFeatureState(correctId, 'correct');
    score += POINTS_PER_Q;
    correctCount++;
    document.getElementById('score-display').textContent = score;
    setFeedback(`✓ ¡Correcto! +${POINTS_PER_Q} puntos`, 'correct');
    addHistory(correctFeature, true);
    document.getElementById('btn-next').classList.remove('hidden');
  } else {
    attemptsLeft--;
    // Wrong click: badge turns red and STAYS red until next question
    setFeatureState(clickedId, 'wrong');
    updateAttemptsUI();

    if (attemptsLeft <= 0) {
      answered = true;
      // Correct location → orange (revealed) so user can see where it was
      setFeatureState(correctId, 'revealed');
      setFeedback(`✗ Era: #${correctId} — ${correctFeature.name}`, 'wrong');
      addHistory(correctFeature, false);
      document.getElementById('btn-next').classList.remove('hidden');
      setTimeout(() => panToFeature(correctFeature), 300);
    } else {
      const msg = attemptsLeft === 1
        ? '✗ Incorrecto — ¡Último intento!'
        : '✗ Incorrecto — intenta de nuevo';
      setFeedback(msg, 'wrong');
      // No timeout: red badge stays until next question for visual memory
    }
  }
}

function setFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className   = 'feedback' + (type ? ' ' + type : '');
}

function addHistory(f, wasCorrect) {
  const list = document.getElementById('hist-list');
  const item = document.createElement('div');
  item.className = 'hist-item ' + (wasCorrect ? 'correct' : 'wrong');
  item.innerHTML = `<span class="hist-num">#${f.id}</span> ${f.name}`;
  list.prepend(item);
}

// ── NEXT QUESTION ────────────────────────────────────────────────────────────
function nextQ() {
  qIdx++;
  if (qIdx >= FEATURES.length) showResults();
  else renderQ();
}

// ── RESULTS ──────────────────────────────────────────────────────────────────
function showResults() {
  const pct   = Math.round((correctCount / FEATURES.length) * 100);
  const pctEl = document.getElementById('result-pct');
  pctEl.textContent = pct + '%';
  pctEl.className   = 'result-pct ' + (pct >= 80 ? 'green' : pct >= 55 ? 'gold' : 'red');

  document.getElementById('stat-correct').textContent = correctCount;
  document.getElementById('stat-score').textContent   = score;

  const newTop = document.getElementById('new-top-score');
  if (score > topScore) {
    topScore = score;
    localStorage.setItem('topScore', topScore);
    newTop.style.display = 'block';
  } else {
    newTop.style.display = 'none';
  }

  showScreen('screen-results');
}
