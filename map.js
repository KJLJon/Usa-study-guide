// map.js — renders USA SVG via D3 + TopoJSON, then draws feature overlays

const MAP_W = 960, MAP_H = 600;

// AlbersUSA projection (D3 built-in handles Alaska + Hawaii insets)
let projection, path, svg, featureGroups = {};

async function initMap() {
  svg = d3.select('#map-svg')
    .attr('viewBox', `0 0 ${MAP_W} ${MAP_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // AlbersUSA automatically positions Alaska (bottom-left) and Hawaii (bottom-left-center)
  projection = d3.geoAlbersUsa()
    .scale(1280)
    .translate([MAP_W / 2, MAP_H / 2]);

  path = d3.geoPath().projection(projection);

  // Load US states topology from CDN
  const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');

  // Draw states
  const statesGroup = svg.append('g').attr('class', 'states-layer');
  statesGroup.selectAll('path')
    .data(topojson.feature(us, us.objects.states).features)
    .join('path')
    .attr('class', 'state-path')
    .attr('d', path);

  // State borders
  statesGroup.append('path')
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr('class', 'state-path')
    .attr('fill', 'none')
    .attr('stroke', '#243448')
    .attr('stroke-width', '0.5')
    .attr('d', path);

  // Draw feature overlays
  drawFeatureOverlays();
}

function drawFeatureOverlays() {
  FEATURES.forEach(f => {
    const g = svg.append('g')
      .attr('class', `feature-group feature-hit`)
      .attr('data-id', f.id)
      .style('cursor', 'crosshair');

    featureGroups[f.id] = g;

    if (f.shape === 'lake') {
      drawLake(g, f);
    } else if (f.shape === 'line') {
      drawRiver(g, f);
    } else if (f.shape === 'triangle') {
      drawMountain(g, f);
    } else if (f.shape === 'region') {
      drawRegion(g, f);
    } else if (f.shape === 'label') {
      drawOceanLabel(g, f);
    }

    // Click handler on the group
    g.on('click', (event) => {
      event.stopPropagation();
      if (typeof onFeatureClick === 'function') onFeatureClick(f.id);
    });
  });

  // Also allow clicking on the map background (for ocean/water labels which are large areas)
  svg.on('click', (event) => {
    if (event.target === svg.node() || event.target.classList.contains('state-path')) {
      // Find nearest ocean/label feature to click
      const [mx, my] = d3.pointer(event);
      let nearest = null, nearestDist = Infinity;
      FEATURES.filter(f => f.shape === 'label').forEach(f => {
        const dx = mx - f.cx, dy = my - f.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < nearestDist) { nearestDist = dist; nearest = f; }
      });
      if (nearest && nearestDist < 120 && typeof onFeatureClick === 'function') {
        onFeatureClick(nearest.id);
      }
    }
  });
}

function drawLake(g, f) {
  const pts = f.points.map(p => p.join(',')).join(' ');
  g.append('polygon')
    .attr('class', 'water-body')
    .attr('points', pts);

  // Number label at center
  g.append('text')
    .attr('class', 'feature-number')
    .attr('x', f.cx).attr('y', f.cy)
    .text(f.id);
}

function drawRiver(g, f) {
  const line = d3.line()(f.points);

  // Invisible wide clickzone
  g.append('path')
    .attr('class', 'river-clickzone')
    .attr('d', line);

  // Visible river line
  g.append('path')
    .attr('class', 'river-path')
    .attr('d', line);

  // Number at midpoint
  const mid = f.points[Math.floor(f.points.length / 2)];
  g.append('circle')
    .attr('cx', mid[0]).attr('cy', mid[1])
    .attr('r', 8)
    .attr('fill', '#172030')
    .attr('stroke', '#2a7ab0')
    .attr('stroke-width', 1);
  g.append('text')
    .attr('class', 'feature-number')
    .attr('x', mid[0]).attr('y', mid[1])
    .text(f.id);
}

function drawMountain(g, f) {
  // Draw multiple small triangles along the range
  const peaks = f.peaks;
  for (let i = 0; i < peaks.length - 1; i += 2) {
    const bx = peaks[i][0], by = peaks[i][1];
    const tx = peaks[i+1][0], ty = peaks[i+1][1];
    const half = Math.abs(by - ty) * 0.7;
    const pts = `${tx},${ty} ${bx - half},${by} ${bx + half},${by}`;
    g.append('polygon')
      .attr('class', 'mountain-triangle')
      .attr('points', pts);
  }

  // Number badge at center
  g.append('circle')
    .attr('cx', f.cx).attr('cy', f.cy + 14)
    .attr('r', 9)
    .attr('fill', '#172030')
    .attr('stroke', '#8a7060')
    .attr('stroke-width', 1);
  g.append('text')
    .attr('class', 'feature-number')
    .attr('x', f.cx).attr('y', f.cy + 14)
    .text(f.id);

  // Transparent click zone
  g.append('rect')
    .attr('x', f.cx - 30).attr('y', f.cy - 30)
    .attr('width', 60).attr('height', 60)
    .attr('fill', 'transparent');
}

function drawRegion(g, f) {
  const pts = f.points.map(p => p.join(',')).join(' ');
  g.append('polygon')
    .attr('class', 'land-region')
    .attr('points', pts);

  g.append('circle')
    .attr('cx', f.cx).attr('cy', f.cy)
    .attr('r', 9)
    .attr('fill', '#172030')
    .attr('stroke', 'rgba(200,160,80,.4)')
    .attr('stroke-width', 1);
  g.append('text')
    .attr('class', 'feature-number')
    .attr('x', f.cx).attr('y', f.cy)
    .text(f.id);
}

function drawOceanLabel(g, f) {
  // Large invisible click zone
  g.append('rect')
    .attr('x', f.cx - 70).attr('y', f.cy - 40)
    .attr('width', 140).attr('height', 80)
    .attr('fill', 'transparent');

  g.append('text')
    .attr('class', 'ocean-label')
    .attr('x', f.cx).attr('y', f.cy)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .text(`(${f.id})`);
}

// Public: set visual state on a feature group
function setFeatureState(id, state) {
  // state: null | 'target' | 'correct' | 'wrong' | 'revealed'
  const g = featureGroups[id];
  if (!g) return;
  g.classed('state-target',    state === 'target');
  g.classed('state-correct',   state === 'correct');
  g.classed('state-wrong',     state === 'wrong');
  g.classed('state-revealed',  state === 'revealed');
}

function clearAllStates() {
  Object.values(featureGroups).forEach(g => {
    g.classed('state-target', false)
     .classed('state-correct', false)
     .classed('state-wrong', false)
     .classed('state-revealed', false);
  });
}

// Pan map view to center on a feature
function panToFeature(f) {
  const pane = document.getElementById('map-pane');
  const svgEl = document.getElementById('map-svg');
  const rect = svgEl.getBoundingClientRect();
  const scaleX = rect.width / MAP_W;
  const scaleY = rect.height / MAP_H;
  const px = f.cx * scaleX;
  const py = f.cy * scaleY;
  pane.scrollTo({
    left: px - pane.clientWidth / 2,
    top:  py - pane.clientHeight / 2,
    behavior: 'smooth',
  });
}
