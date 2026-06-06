// map.js — renders USA SVG via D3 + TopoJSON, then draws feature overlays

const MAP_W = 960, MAP_H = 600;

let projection, path, svg;
let featureGroups = {};   // id → D3 selection of .feature-hit group
let numberBadges  = {};   // id → { circle, text, currentState, defaultStroke }

async function initMap() {
  svg = d3.select('#map-svg')
    .attr('viewBox', `0 0 ${MAP_W} ${MAP_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  projection = d3.geoAlbersUsa()
    .scale(1280)
    .translate([MAP_W / 2, MAP_H / 2]);

  path = d3.geoPath().projection(projection);

  const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');

  const statesGroup = svg.append('g').attr('class', 'states-layer');
  statesGroup.selectAll('path')
    .data(topojson.feature(us, us.objects.states).features)
    .join('path')
    .attr('class', 'state-path')
    .attr('d', path);

  statesGroup.append('path')
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr('class', 'state-path')
    .attr('fill', 'none')
    .attr('stroke', '#a8b898')
    .attr('stroke-width', '0.5')
    .attr('d', path);

  drawFeatureOverlays();
}

function drawFeatureOverlays() {
  FEATURES.forEach(f => {
    const g = svg.append('g')
      .attr('class', 'feature-group feature-hit')
      .attr('data-id', f.id);

    featureGroups[f.id] = g;

    if      (f.shape === 'lake')     drawLake(g, f);
    else if (f.shape === 'line')     drawRiver(g, f);
    else if (f.shape === 'triangle') drawMountain(g, f);
    else if (f.shape === 'region')   drawRegion(g, f);
    else if (f.shape === 'label')    drawOceanZone(g, f);

    g.on('click', event => {
      event.stopPropagation();
      if (typeof onFeatureClick === 'function') onFeatureClick(f.id);
    });

    // Hover → JS-update badge colors
    g.on('mouseenter', () => hoverOn(f.id));
    g.on('mouseleave', () => hoverOff(f.id));
  });

  // Numbers drawn last: top SVG layer, pointer-events:none
  drawNumbers();
}

// ── FEATURE DRAWERS ────────────────────────────────────────────────────────────

function drawLake(g, f) {
  const pts = f.points.map(p => p.join(',')).join(' ');
  g.append('polygon').attr('class', 'water-body').attr('points', pts);
}

function drawRiver(g, f) {
  const line = d3.line()(f.points);
  g.append('path').attr('class', 'river-clickzone').attr('d', line);
  g.append('path').attr('class', 'river-path').attr('d', line);
}

function drawMountain(g, f) {
  for (let i = 0; i < f.peaks.length - 1; i += 2) {
    const bx = f.peaks[i][0],   by = f.peaks[i][1];
    const tx = f.peaks[i+1][0], ty = f.peaks[i+1][1];
    const half = Math.max(Math.abs(by - ty) * 0.8, 12); // min 24px wide
    g.append('polygon')
      .attr('class', 'mountain-triangle')
      .attr('points', `${tx},${ty} ${bx - half},${by} ${bx + half},${by}`);
  }
  // Transparent clickbox so pointer events don't require pixel-perfect triangle hit
  g.append('rect')
    .attr('class', 'mountain-hitbox')
    .attr('x', f.cx - 32).attr('y', f.cy - 32)
    .attr('width', 64).attr('height', 64);
}

function drawRegion(g, f) {
  const pts = f.points.map(p => p.join(',')).join(' ');
  g.append('polygon').attr('class', 'land-region').attr('points', pts);
}

// Geographic click-zone rects for each ocean/strait in AlbersUSA 960×600 space
const OCEAN_ZONES = {
  1: { x: 0,   y: 0,   w: 125, h: 430 },  // Pacific
  2: { x: 848, y: 0,   w: 112, h: 472 },  // Atlantic
  3: { x: 448, y: 488, w: 334, h: 112 },  // Gulf
  4: { x: 18,  y: 432, w: 158, h: 122 },  // Bering Strait
};

function drawOceanZone(g, f) {
  const z = OCEAN_ZONES[f.id] || { x: f.cx - 70, y: f.cy - 40, w: 140, h: 80 };
  g.append('rect')
    .attr('class', 'ocean-clickzone')
    .attr('x', z.x).attr('y', z.y)
    .attr('width', z.w).attr('height', z.h);
}

// ── NUMBER BADGES (separate top layer, JS-controlled colors) ──────────────────

function defaultStrokeFor(f) {
  if (f.cat === 'ocean' || f.cat === 'water') return '#4a90c0';
  if (f.cat === 'river')    return '#3a80b8';
  if (f.cat === 'mountain') return '#b09068';
  return '#c0a040';  // land
}

function drawNumbers() {
  const layer = svg.append('g')
    .attr('class', 'numbers-layer')
    .attr('pointer-events', 'none');

  FEATURES.forEach(f => {
    // Badge position: midpoint for rivers, below peak for mountains, center for rest
    let bx = f.cx, by = f.cy;
    if (f.shape === 'line') {
      const mid = f.points[Math.floor(f.points.length / 2)];
      bx = mid[0]; by = mid[1];
    } else if (f.shape === 'triangle') {
      by = f.cy + 18;
    }

    const stroke = defaultStrokeFor(f);

    const circle = layer.append('circle')
      .attr('cx', bx).attr('cy', by).attr('r', 10)
      .attr('fill', '#1a3050')
      .attr('stroke', stroke)
      .attr('stroke-width', 1.5);

    const text = layer.append('text')
      .attr('class', 'feature-number')
      .attr('x', bx).attr('y', by)
      .text(f.id);

    numberBadges[f.id] = { circle, text, currentState: null, defaultStroke: stroke };
  });
}

// ── BADGE STATE HELPERS ───────────────────────────────────────────────────────

function applyBadgeColors(b, state) {
  switch (state) {
    case 'correct':
      b.circle.attr('fill','#14532d').attr('stroke','#22c55e').attr('stroke-width', 2);
      b.text.attr('fill','#86efac');
      break;
    case 'wrong':
      b.circle.attr('fill','#7f1d1d').attr('stroke','#ef4444').attr('stroke-width', 2);
      b.text.attr('fill','#fca5a5');
      break;
    case 'revealed':
      b.circle.attr('fill','#7c2d12').attr('stroke','#f97316').attr('stroke-width', 2);
      b.text.attr('fill','#fed7aa');
      break;
    case 'target':
      b.circle.attr('fill','#1a3050').attr('stroke','#f5c518').attr('stroke-width', 2);
      b.text.attr('fill','#f5c518');
      break;
    default:
      b.circle.attr('fill','#1a3050').attr('stroke', b.defaultStroke).attr('stroke-width', 1.5);
      b.text.attr('fill','#e2eef8');
  }
}

function updateBadgeState(id, state) {
  const b = numberBadges[id];
  if (!b) return;
  b.currentState = state || null;
  applyBadgeColors(b, b.currentState);
}

// Hover — only applies when badge is in neutral or target state
function hoverOn(id) {
  const b = numberBadges[id];
  if (!b) return;
  if (!b.currentState || b.currentState === 'target') {
    b.circle.attr('fill','#e0eaf8').attr('stroke','#1a3050').attr('stroke-width', 2.5);
    b.text.attr('fill','#1a3050');
  }
}

function hoverOff(id) {
  const b = numberBadges[id];
  if (!b) return;
  applyBadgeColors(b, b.currentState);
}

// ── STATE MANAGEMENT ──────────────────────────────────────────────────────────

function setFeatureState(id, state) {
  const g = featureGroups[id];
  if (!g) return;
  g.classed('state-target',   state === 'target');
  g.classed('state-correct',  state === 'correct');
  g.classed('state-wrong',    state === 'wrong');
  g.classed('state-revealed', state === 'revealed');
  updateBadgeState(id, state);
}

// Called between questions — preserves state-correct on already-solved features
function clearCurrentQ() {
  Object.entries(featureGroups).forEach(([idStr, g]) => {
    const id = parseInt(idStr, 10);
    g.classed('state-target',   false);
    g.classed('state-wrong',    false);
    g.classed('state-revealed', false);
    // Preserve correct; reset badge only if feature is not already green
    if (!g.classed('state-correct')) {
      updateBadgeState(id, null);
    }
  });
}

// Called only on game start / reset
function clearAllStates() {
  Object.entries(featureGroups).forEach(([idStr, g]) => {
    const id = parseInt(idStr, 10);
    g.classed('state-target',   false)
     .classed('state-correct',  false)
     .classed('state-wrong',    false)
     .classed('state-revealed', false);
    updateBadgeState(id, null);
  });
}

// Pan map to center on a feature
function panToFeature(f) {
  const pane  = document.getElementById('map-pane');
  const svgEl = document.getElementById('map-svg');
  const rect  = svgEl.getBoundingClientRect();
  pane.scrollTo({
    left: f.cx * (rect.width  / MAP_W) - pane.clientWidth  / 2,
    top:  f.cy * (rect.height / MAP_H) - pane.clientHeight / 2,
    behavior: 'smooth',
  });
}
