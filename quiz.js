// quiz.js — game logic

const MAX_ATTEMPTS = 3;
const POINTS_PER_Q  = 100;

let queue = [], qIdx = 0, score = 0, correctCount = 0;
let attemptsLeft = MAX_ATTEMPTS;
let answered = false;
let topScore = parseInt(localStorage.getItem('topScore') || '0', 10);

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showTopScore();

  document.getElementById('btn-play').addEventListener('click', startGame);
  document.getElementById('btn-next').addEventListener('click', nextQ);
  document.getElementById('btn-repeat').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', showTitle);

  // Init map (loads TopoJSON, draws states + feature overlays)
  initMap().catch(err => console.error('Map load failed:', err));
});

function showTopScore() {
  if (topScore > 0) {
    const el = document.getElementById('top-score-display');
    el.style.display = 'block';
    document.getElementById('top-score-val').textContent = topScore;
  }
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
  document.getElementById('hist-list').innerHTML = '';
  clearAllStates();
  showScreen('screen-game');
  renderQ();
}

// Fisher-Yates shuffle
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
  answered = false;
  attemptsLeft = MAX_ATTEMPTS;
  clearAllStates();

  const fId = queue[qIdx];
  const f = FEATURES.find(x => x.id === fId);

  // Topbar
  document.getElementById('q-counter').textContent = ` ${qIdx + 1} / ${FEATURES.length}`;
  document.getElementById('score-display').textContent = score;

  // Progress bar
  const pct = (qIdx / FEATURES.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';

  // Sidebar
  document.getElementById('feature-name').textContent = f.name;
  document.getElementById('feature-hint').textContent = f.hint;
  const b = BADGE[f.cat];
  const badge = document.getElementById('feature-badge');
  badge.textContent = b.label;
  badge.className = 'feature-badge ' + b.cls;

  updateAttemptsUI();

  // Feedback + button
  setFeedback('', '');
  document.getElementById('btn-next').classList.add('hidden');

  // Highlight target feature
  setFeatureState(fId, 'target');

  // Pan to feature
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

  const correctId = queue[qIdx];
  const correctFeature = FEATURES.find(f => f.id === correctId);

  if (clickedId === correctId) {
    // Correct!
    answered = true;
    setFeatureState(correctId, 'correct');
    score += POINTS_PER_Q;
    correctCount++;
    document.getElementById('score-display').textContent = score;
    setFeedback(`✓ ¡Correcto! +${POINTS_PER_Q} puntos`, 'correct');
    addHistory(correctFeature, true);
    document.getElementById('btn-next').classList.remove('hidden');
  } else {
    // Wrong
    attemptsLeft--;
    setFeatureState(clickedId, 'wrong');
    updateAttemptsUI();

    if (attemptsLeft <= 0) {
      // Out of attempts — reveal correct
      answered = true;
      setFeatureState(correctId, 'revealed');
      setFeedback(`✗ Era: #${correctId} — ${correctFeature.name}`, 'wrong');
      addHistory(correctFeature, false);
      document.getElementById('btn-next').classList.remove('hidden');
      // Pan to correct after short delay
      setTimeout(() => panToFeature(correctFeature), 300);
    } else {
      const msg = attemptsLeft === 1 ? '✗ Incorrecto — ¡Último intento!' : '✗ Incorrecto — intenta de nuevo';
      setFeedback(msg, 'wrong');
      // Clear wrong state after flash
      setTimeout(() => setFeatureState(clickedId, null), 800);
    }
  }
}

function setFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback' + (type ? ' ' + type : '');
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
  if (qIdx >= FEATURES.length) {
    showResults();
  } else {
    renderQ();
  }
}

// ── RESULTS ──────────────────────────────────────────────────────────────────
function showResults() {
  const pct = Math.round((correctCount / FEATURES.length) * 100);
  const pctEl = document.getElementById('result-pct');
  pctEl.textContent = pct + '%';
  pctEl.className = 'result-pct ' + (pct >= 80 ? 'green' : pct >= 55 ? 'gold' : 'red');

  document.getElementById('stat-correct').textContent = correctCount;
  document.getElementById('stat-score').textContent = score;

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
