#!/usr/bin/env node
// Node.js test runner — loads features.js and runs logic tests

const fs = require('fs');

// Load features.js by wrapping in a module function
const featuresCode = fs.readFileSync(__dirname + '/features.js', 'utf8');
const featuresModule = new Function('module', 'exports', featuresCode + '\nmodule.exports={FEATURES,BADGE};');
const mod = { exports: {} };
featuresModule(mod, mod.exports);
const { FEATURES, BADGE } = mod.exports;

let pass = 0, fail = 0, currentSuite = '';
function suite(name) {
  currentSuite = name;
  console.log('\n  ' + name);
  console.log('  ' + '─'.repeat(name.length));
}
function test(name, fn) {
  try { fn(); console.log(`  \x1b[32m✓\x1b[0m ${name}`); pass++; }
  catch(e) { console.log(`  \x1b[31m✗\x1b[0m ${name} — ${e.message}`); fail++; }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function eq(a, b, m) { if (a !== b) throw new Error((m || '') + ` expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────
suite('features.js — data integrity');

test('FEATURES array has exactly 27 entries', () => eq(FEATURES.length, 27));

test('All IDs are unique and range 1–27', () => {
  const ids = FEATURES.map(f => f.id);
  assert(new Set(ids).size === 27, 'IDs not unique');
  assert(Math.min(...ids) === 1, 'Min id should be 1');
  assert(Math.max(...ids) === 27, 'Max id should be 27');
});

test('All shapes are valid', () => {
  const valid = new Set(['lake','line','triangle','region','label']);
  FEATURES.forEach(f => assert(valid.has(f.shape), `#${f.id} invalid shape: ${f.shape}`));
});

test('All categories are valid', () => {
  const valid = new Set(['ocean','water','river','mountain','land']);
  FEATURES.forEach(f => assert(valid.has(f.cat), `#${f.id} invalid cat: ${f.cat}`));
});

test('All features have cx, cy in SVG bounds (0-960, 0-600)', () => {
  FEATURES.forEach(f => {
    assert(typeof f.cx === 'number' && f.cx >= 0 && f.cx <= 960, `#${f.id} cx=${f.cx} out of range`);
    assert(typeof f.cy === 'number' && f.cy >= 0 && f.cy <= 600, `#${f.id} cy=${f.cy} out of range`);
  });
});

test('Lakes and regions have points arrays (≥3 points)', () => {
  FEATURES.filter(f => f.shape === 'lake' || f.shape === 'region').forEach(f => {
    assert(Array.isArray(f.points) && f.points.length >= 3, `#${f.id} needs points`);
  });
});

test('Rivers have points arrays (≥2 points)', () => {
  FEATURES.filter(f => f.shape === 'line').forEach(f => {
    assert(Array.isArray(f.points) && f.points.length >= 2, `#${f.id} needs points`);
  });
});

test('Mountains have peaks arrays (≥2 entries)', () => {
  FEATURES.filter(f => f.shape === 'triangle').forEach(f => {
    assert(Array.isArray(f.peaks) && f.peaks.length >= 2, `#${f.id} needs peaks`);
  });
});

test('BADGE covers all used categories', () => {
  const cats = [...new Set(FEATURES.map(f => f.cat))];
  cats.forEach(c => {
    assert(BADGE[c], `Missing BADGE for: ${c}`);
    assert(BADGE[c].label, `BADGE[${c}] missing label`);
    assert(BADGE[c].cls,   `BADGE[${c}] missing cls`);
  });
});

test('All 27 required Spanish names present', () => {
  const names = new Set(FEATURES.map(f => f.name));
  const required = [
    'Océano Pacífico','Océano Atlántico','Golfo de México','Estrecho de Bering',
    'Lago Superior','Lago Huron','Lago Michigan','Lago Ontario','Lago Erie',
    'Río Mississippi','Río Missouri','Río Ohio','Río Colorado','Río Grande',
    'Río Minnesota','Río San Lorenzo',
    'Montañas Rocosas','Montañas de Sierra Nevada','Montes Apalaches',
    'Desierto de Mojave','Gran Cuenca','Grandes Llanuras','Gran Cañón',
    'Meseta de Ozark','Monte McKinley','Mauna Kea','Monte Rushmore',
  ];
  required.forEach(n => assert(names.has(n), `Missing: ${n}`));
});

// ─────────────────────────────────────────────────────────────────
suite('shuffle — Fisher-Yates');

test('Shuffled array has same length', () => {
  eq(shuffle(FEATURES.map(f => f.id)).length, 27);
});
test('Shuffled array contains same elements', () => {
  const orig = FEATURES.map(f => f.id), s = shuffle(orig);
  orig.forEach(id => assert(s.includes(id), `Missing id ${id}`));
});
test('Original not mutated', () => {
  const orig = FEATURES.map(f => f.id), copy = [...orig];
  shuffle(orig);
  orig.forEach((v, i) => eq(v, copy[i]));
});
test('Two shuffles differ (probabilistic)', () => {
  const orig = FEATURES.map(f => f.id);
  const s1 = shuffle(orig), s2 = shuffle(orig);
  assert(!s1.every((v, i) => v === s2[i]), 'Two shuffles identical (extremely unlikely)');
});

// ─────────────────────────────────────────────────────────────────
suite('quiz state machine');

const POINTS_TABLE = [100, 50, 25];

function makeQuiz() {
  const q = {
    queue: shuffle(FEATURES.map(f => f.id)), qIdx: 0,
    score: 0, correctCount: 0, firstTryCount: 0, attemptsLeft: 3, answered: false,
    currentId() { return this.queue[this.qIdx]; },
    startQ() { this.answered = false; this.attemptsLeft = 3; },
    click(id) {
      if (this.answered) return 'ignored';
      if (id === this.currentId()) {
        const attemptsUsed = 3 - this.attemptsLeft;
        const pts = POINTS_TABLE[attemptsUsed] ?? 0;
        if (attemptsUsed === 0) this.firstTryCount++;
        this.answered = true; this.score += pts; this.correctCount++;
        return 'correct';
      }
      this.attemptsLeft--;
      if (this.attemptsLeft <= 0) { this.answered = true; return 'revealed'; }
      return 'wrong';
    },
    next() { this.qIdx++; if (this.qIdx < this.queue.length) this.startQ(); },
  };
  q.startQ(); return q;
}

test('Correct click awards 100 points (first try)', () => {
  const q = makeQuiz(); eq(q.click(q.currentId()), 'correct'); eq(q.score, 100); eq(q.firstTryCount, 1);
});
test('Correct on 2nd try awards 50 points, no firstTryCount', () => {
  const q = makeQuiz();
  const w = FEATURES.find(f => f.id !== q.currentId()).id;
  q.click(w); eq(q.click(q.currentId()), 'correct'); eq(q.score, 50); eq(q.firstTryCount, 0);
});
test('Correct on 3rd try awards 25 points, no firstTryCount', () => {
  const q = makeQuiz();
  const ws = FEATURES.filter(f => f.id !== q.currentId()).map(f => f.id);
  q.click(ws[0]); q.click(ws[1]); eq(q.click(q.currentId()), 'correct'); eq(q.score, 25); eq(q.firstTryCount, 0);
});
test('Wrong click decrements attemptsLeft', () => {
  const q = makeQuiz();
  const w = FEATURES.find(f => f.id !== q.currentId()).id;
  q.click(w); eq(q.attemptsLeft, 2);
});
test('2 wrong clicks leaves 1 attempt, not answered', () => {
  const q = makeQuiz();
  const ws = FEATURES.filter(f => f.id !== q.currentId()).map(f => f.id);
  q.click(ws[0]); q.click(ws[1]);
  eq(q.attemptsLeft, 1); assert(!q.answered);
});
test('3 wrong clicks = revealed, 0 points', () => {
  const q = makeQuiz();
  const ws = FEATURES.filter(f => f.id !== q.currentId()).map(f => f.id);
  q.click(ws[0]); q.click(ws[1]);
  eq(q.click(ws[2]), 'revealed'); eq(q.score, 0); assert(q.answered);
});
test('Post-answer clicks are ignored', () => {
  const q = makeQuiz(); q.click(q.currentId());
  eq(q.click(q.currentId()), 'ignored'); eq(q.score, 100);
});
test('nextQ advances qIdx', () => {
  const q = makeQuiz(); q.click(q.currentId()); q.next(); eq(q.qIdx, 1);
});
test('3 correct in a row = 300 points', () => {
  const q = makeQuiz();
  for (let i = 0; i < 3; i++) { q.click(q.currentId()); q.next(); }
  eq(q.score, 300); eq(q.correctCount, 3);
});
test('All correct = max 2700 points', () => {
  const q = makeQuiz();
  for (let i = 0; i < 27; i++) { q.click(q.currentId()); if (i < 26) q.next(); }
  eq(q.score, 2700); eq(q.correctCount, 27);
});
test('Mix correct+wrong: score only from correct', () => {
  const q = makeQuiz();
  // Q1: 3 wrong = 0 pts
  const ws = FEATURES.filter(f => f.id !== q.currentId()).map(f => f.id);
  q.click(ws[0]); q.click(ws[1]); q.click(ws[2]); q.next();
  // Q2: correct = 100 pts
  q.click(q.currentId()); q.next();
  eq(q.score, 100); eq(q.correctCount, 1);
});

// ─────────────────────────────────────────────────────────────────
suite('grade thresholds');

const grade = p => p >= 80 ? 'green' : p >= 55 ? 'gold' : 'red';
test('100% → green',  () => eq(grade(100), 'green'));
test('80% → green',   () => eq(grade(80),  'green'));
test('79% → gold',    () => eq(grade(79),  'gold'));
test('55% → gold',    () => eq(grade(55),  'gold'));
test('54% → red',     () => eq(grade(54),  'red'));
test('0% → red',      () => eq(grade(0),   'red'));
test('22/27 = 81% → green', () => {
  const pct = Math.round((22/27)*100);
  eq(pct, 81); eq(grade(pct), 'green');
});

// ─────────────────────────────────────────────────────────────────
suite('localStorage top score');

const store = { _data: {}, getItem(k){return this._data[k]||null;}, setItem(k,v){this._data[k]=String(v);} };
test('Saves new top score', () => {
  store._data = {}; let top = parseInt(store.getItem('topScore')||'0');
  if (1500 > top) { store.setItem('topScore', 1500); }
  eq(store.getItem('topScore'), '1500');
});
test('Does not overwrite higher score', () => {
  store._data = {topScore:'2000'}; let top = parseInt(store.getItem('topScore')||'0');
  if (1500 > top) store.setItem('topScore', 1500);
  eq(store.getItem('topScore'), '2000');
});
test('Missing score defaults to 0', () => {
  store._data = {};
  eq(parseInt(store.getItem('topScore')||'0'), 0);
});

// ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
const color = fail === 0 ? '\x1b[32m' : '\x1b[31m';
console.log(`${color}${pass + fail} tests: ${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail > 0 ? 1 : 0);
