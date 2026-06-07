#!/usr/bin/env node
/**
 * screenshot.js — Geographic accuracy checker for USA map quiz
 *
 * Usage:
 *   node screenshot.js          # Take screenshots + accuracy report
 *   node screenshot.js --fix    # Also apply coordinate corrections to features.js
 *
 * Outputs:
 *   screenshot-before.png       # Current map state
 *   screenshot-annotated.png    # Yellow rings = wrong position, green = OK
 *                               # Cyan lines = correct river paths
 *   comparison.json             # Full comparison data
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FIX_MODE = process.argv.includes('--fix');
const TOLERANCE = 22; // pixels — within this is considered acceptable
const DIR = __dirname;

// ─── GEOGRAPHIC REFERENCE ────────────────────────────────────────────────────
// Real geographic centers [longitude, latitude] for each feature's label/badge
// Sources: USGS, NOAA, Wikipedia
const GEO_CENTER = {
  // Great Lakes — geographic centers (NOAA)
  5:  [-87.50, 47.70],   // Lake Superior
  6:  [-82.40, 44.85],   // Lake Huron
  7:  [-86.80, 44.00],   // Lake Michigan
  8:  [-77.85, 43.70],   // Lake Ontario
  9:  [-81.17, 42.25],   // Lake Erie

  // Rivers — visual midpoint of drawn segment
  10: [-90.20, 37.50],   // Mississippi (between St. Louis & Memphis)
  11: [-97.00, 42.50],   // Missouri (Nebraska/Iowa)
  12: [-84.00, 38.50],   // Ohio River (near Cincinnati)
  13:[-113.50, 36.80],   // Colorado River (near Grand Canyon)
  14: [-99.50, 28.50],   // Rio Grande (Texas border midpoint)
  15: [-94.90, 45.10],   // Minnesota River
  16: [-73.00, 45.80],   // St. Lawrence (near Montreal)

  // Mountains — summit/center
  17:[-106.00, 40.00],   // Rocky Mountains (CO/WY spine)
  18:[-119.50, 37.00],   // Sierra Nevada (CA)
  19: [-80.50, 37.50],   // Appalachian (VA/WV, range center)
  20:[-116.50, 34.80],   // Mojave Desert
  21:[-117.00, 40.00],   // Great Basin
  22:[-100.00, 40.00],   // Great Plains
  23:[-112.10, 36.10],   // Grand Canyon
  24: [-92.50, 36.50],   // Ozark Plateau
  25:[-151.00, 63.07],   // Denali / Mt. McKinley (Alaska inset)
  26:[-155.47, 19.82],   // Mauna Kea (Hawaii inset)
  27:[-103.46, 43.88],   // Mt. Rushmore (Black Hills, South Dakota)
};

// River path waypoints [lon, lat] — used to reproject accurate polylines
const RIVER_WAYPOINTS = {
  10: [ // Mississippi River
    [-95.22, 47.24],  // Lake Itasca MN (source)
    [-93.22, 44.87],  // Minneapolis / St. Paul
    [-91.52, 42.49],  // Dubuque IA
    [-90.18, 38.63],  // St. Louis MO
    [-89.98, 35.15],  // Memphis TN
    [-91.52, 32.36],  // Natchez MS
    [-90.07, 29.95],  // New Orleans (mouth)
  ],
  11: [ // Missouri River
    [-111.50, 45.93], // Three Forks MT (source)
    [-106.50, 47.80], // near Great Falls MT
    [-100.78, 46.81], // Bismarck ND
    [-97.40,  43.55], // Sioux Falls SD
    [-96.40,  42.49], // Sioux City IA
    [-94.59,  39.10], // Kansas City MO
    [-90.12,  38.83], // Confluence with Mississippi
  ],
  12: [ // Ohio River
    [-80.01, 40.44],  // Pittsburgh PA (source)
    [-81.70, 40.10],  // Wheeling WV
    [-82.45, 38.41],  // Huntington WV
    [-85.76, 38.25],  // Louisville KY
    [-87.58, 37.97],  // Evansville IN
    [-89.17, 37.00],  // Cairo IL (mouth)
  ],
  13: [ // Colorado River
    [-105.50, 40.50], // Source — Rocky Mts CO
    [-108.55, 39.06], // Grand Junction CO
    [-109.88, 38.07], // Canyonlands UT
    [-111.59, 36.87], // Lee's Ferry AZ
    [-112.10, 36.05], // Grand Canyon
    [-114.74, 36.02], // Hoover Dam NV
    [-114.63, 32.71], // Yuma AZ (near mouth)
  ],
  14: [ // Rio Grande
    [-107.59, 37.78], // Source — San Juan Mts CO
    [-106.65, 35.08], // Albuquerque NM
    [-106.49, 31.76], // El Paso TX
    [-100.89, 29.37], // Del Rio TX
    [-99.50,  27.50], // Laredo area TX
    [-97.50,  25.90], // Brownsville TX (mouth)
  ],
  15: [ // Minnesota River
    [-96.45, 45.54],  // Big Stone Lake (source, SD/MN border)
    [-94.83, 45.10],  // Henderson MN
    [-93.22, 44.87],  // Confluence near Minneapolis
  ],
  16: [ // St. Lawrence River
    [-76.20, 44.22],  // Kingston ON (Lake Ontario outlet)
    [-73.55, 45.50],  // Montreal QC
    [-71.22, 46.81],  // Quebec City QC
    [-65.00, 49.00],  // Gulf of St. Lawrence
  ],
};

// ─── HTTP SERVER ─────────────────────────────────────────────────────────────
function startServer(dir) {
  const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
  const server = http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(dir, urlPath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
      res.end(data);
    });
  });
  return new Promise(resolve =>
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting local server...');
  const { server, port } = await startServer(DIR);
  console.log(`Serving at http://127.0.0.1:${port}/`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 750 });

    console.log('Loading page...');
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait until D3 has rendered the state paths
    await page.waitForFunction(
      () => document.querySelectorAll('.state-path').length > 40,
      { timeout: 20000 }
    );
    await new Promise(r => setTimeout(r, 2000)); // extra settle

    // Dismiss any title screen so the full map is visible
    await page.evaluate(() => {
      const btn = document.querySelector('#btn-play');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({ path: path.join(DIR, 'screenshot-before.png') });
    console.log('Saved: screenshot-before.png');

    // ── COMPUTE EXPECTED POSITIONS VIA D3 INSIDE THE PAGE ─────────────────────
    const comparison = await page.evaluate((geoCenter, riverWaypoints) => {
      const proj = d3.geoAlbersUsa().scale(1280).translate([480, 300]);

      return FEATURES.map(f => {
        const ref = geoCenter[f.id];
        if (!ref) return null;

        const projected = proj(ref); // [x, y] or null if outside AlbersUSA bounds
        const expected = projected
          ? { x: parseFloat(projected[0].toFixed(1)), y: parseFloat(projected[1].toFixed(1)) }
          : null;

        const dx = expected ? expected.x - f.cx : null;
        const dy = expected ? expected.y - f.cy : null;
        const dist = dx !== null ? Math.round(Math.sqrt(dx*dx + dy*dy)) : null;

        // Project river waypoints for accurate path comparison
        let projectedPath = null;
        if (f.shape === 'line' && riverWaypoints[f.id]) {
          projectedPath = riverWaypoints[f.id]
            .map(coord => {
              const p = proj(coord);
              return p ? [Math.round(p[0]), Math.round(p[1])] : null;
            })
            .filter(Boolean);
        }

        return {
          id: f.id,
          name: f.name,
          shape: f.shape,
          cat: f.cat,
          actual: { cx: f.cx, cy: f.cy },
          expected,
          dx: dx !== null ? Math.round(dx) : null,
          dy: dy !== null ? Math.round(dy) : null,
          dist,
          needsFix: dist !== null && dist > 22,
          projectedPath,
          hasPoints: !!(f.points && f.points.length),
          hasPeaks:  !!(f.peaks  && f.peaks.length),
        };
      }).filter(Boolean);
    }, GEO_CENTER, RIVER_WAYPOINTS);

    // ── PRINT TABLE ───────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('  GEOGRAPHIC ACCURACY REPORT — USA Map Quiz');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('ID | Feature               | Shape    | Actual(cx,cy) | Expected(x,y) | Δpx | Status');
    console.log('---|-----------------------|----------|---------------|---------------|-----|--------');

    const needsFix = [];
    for (const r of comparison) {
      const actualStr = `(${r.actual.cx},${r.actual.cy})`;
      const expStr = r.expected
        ? `(${Math.round(r.expected.x)},${Math.round(r.expected.y)})`
        : '(inset)';
      const distStr = r.dist !== null ? String(r.dist).padStart(3) : ' --';
      const status = r.dist === null
        ? '(inset proj)'
        : r.dist <= TOLERANCE ? '✅ OK' : `⚠️  OFF`;

      console.log(
        `${String(r.id).padStart(2)} | ${r.name.padEnd(21)} | ${r.shape.padEnd(8)} | ` +
        `${actualStr.padEnd(13)} | ${expStr.padEnd(13)} | ${distStr} | ${status}`
      );

      if (r.needsFix) needsFix.push(r);
    }

    console.log(`\n  ${needsFix.length} feature(s) need correction (>${TOLERANCE}px off).`);
    if (needsFix.length > 0) {
      console.log('\n  Corrections needed:');
      for (const f of needsFix) {
        const dxStr = `${f.dx >= 0 ? '+' : ''}${f.dx}`;
        const dyStr = `${f.dy >= 0 ? '+' : ''}${f.dy}`;
        console.log(`    [${String(f.id).padStart(2)}] ${f.name.padEnd(22)} shift (${dxStr}, ${dyStr}) px`);
        if (f.projectedPath) console.log(`         → river path: ${f.projectedPath.length} reprojected waypoints`);
      }
    }

    // Save full comparison to JSON
    fs.writeFileSync(path.join(DIR, 'comparison.json'), JSON.stringify(comparison, null, 2));
    console.log('\nSaved: comparison.json');

    // ── ANNOTATE SCREENSHOT ───────────────────────────────────────────────────
    await page.evaluate((comp, tol) => {
      const svg = document.querySelector('#map-svg');
      if (!svg) return;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.id = 'accuracy-overlay';

      // Legend
      const legend = [
        { y: 15, color: '#00ff00', text: 'Green ring = within tolerance (OK)' },
        { y: 27, color: '#ffff00', text: 'Yellow ring = expected position (needs shift)' },
        { y: 39, color: '#ff8800', text: 'Orange arrow = direction/magnitude of shift' },
        { y: 51, color: '#00ffff', text: 'Cyan dashes = correct river path from geography' },
      ];
      for (const { y, color, text } of legend) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', '10'); dot.setAttribute('cy', y - 3);
        dot.setAttribute('r', '4'); dot.setAttribute('fill', color);
        g.appendChild(dot);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', '18'); t.setAttribute('y', y);
        t.setAttribute('font-size', '9'); t.setAttribute('fill', 'white');
        t.setAttribute('stroke', 'black'); t.setAttribute('stroke-width', '2');
        t.setAttribute('paint-order', 'stroke');
        t.textContent = text;
        g.appendChild(t);
      }

      for (const r of comp) {
        if (!r.expected) continue;
        const ok = r.dist <= tol;

        // Ring at expected position
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', r.expected.x); ring.setAttribute('cy', r.expected.y);
        ring.setAttribute('r', '7');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', ok ? '#00ff00' : '#ffff00');
        ring.setAttribute('stroke-width', '2');
        g.appendChild(ring);

        if (!ok) {
          // Arrow from current to expected
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', r.actual.cx); line.setAttribute('y1', r.actual.cy);
          line.setAttribute('x2', r.expected.x); line.setAttribute('y2', r.expected.y);
          line.setAttribute('stroke', '#ff8800'); line.setAttribute('stroke-width', '1.5');
          line.setAttribute('stroke-dasharray', '5,3');
          g.appendChild(line);

          // Distance label
          const mx = (r.actual.cx + r.expected.x) / 2;
          const my = (r.actual.cy + r.expected.y) / 2 - 5;
          const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          lbl.setAttribute('x', mx); lbl.setAttribute('y', my);
          lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('font-size', '8');
          lbl.setAttribute('font-weight', 'bold'); lbl.setAttribute('fill', '#ff8800');
          lbl.setAttribute('stroke', 'black'); lbl.setAttribute('stroke-width', '2.5');
          lbl.setAttribute('paint-order', 'stroke');
          lbl.textContent = `${r.dist}px`;
          g.appendChild(lbl);
        }

        // Projected river path
        if (r.projectedPath && r.projectedPath.length > 1) {
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          poly.setAttribute('points', r.projectedPath.map(p => p.join(',')).join(' '));
          poly.setAttribute('fill', 'none');
          poly.setAttribute('stroke', '#00ffff'); poly.setAttribute('stroke-width', '1.5');
          poly.setAttribute('stroke-dasharray', '6,3'); poly.setAttribute('opacity', '0.75');
          g.appendChild(poly);
        }
      }

      svg.appendChild(g);
    }, comparison, TOLERANCE);

    await page.screenshot({ path: path.join(DIR, 'screenshot-annotated.png') });
    console.log('Saved: screenshot-annotated.png');

    // ── APPLY FIXES ───────────────────────────────────────────────────────────
    if (FIX_MODE) {
      if (needsFix.length === 0) {
        console.log('\n✅ No fixes needed.');
      } else {
        console.log('\n── Applying coordinate fixes to features.js ──');
        applyFixes(needsFix);
        console.log('Done. Re-run `node screenshot.js` to verify.');
      }
    } else if (needsFix.length > 0) {
      console.log('\nRun `node screenshot.js --fix` to apply corrections automatically.');
    }

  } finally {
    await browser.close();
    server.close();
    console.log('\nComplete.');
  }
}

// ─── FIX FEATURES.JS ────────────────────────────────────────────────────────
function applyFixes(needsFix) {
  let src = fs.readFileSync(path.join(DIR, 'features.js'), 'utf8');

  for (const fix of needsFix) {
    const newCx = Math.round(fix.expected.x);
    const newCy = Math.round(fix.expected.y);
    const dx = fix.dx;
    const dy = fix.dy;

    console.log(`  [${fix.id}] ${fix.name}`);
    console.log(`    cx: ${fix.actual.cx} → ${newCx},  cy: ${fix.actual.cy} → ${newCy}  (Δ${dx>=0?'+':''}${dx}, Δ${dy>=0?'+':''}${dy})`);

    // Find and replace within this feature's block
    const block = findFeatureBlock(src, fix.id);
    if (!block) { console.log(`    ⚠️  Could not locate block for id ${fix.id}`); continue; }

    let newBlock = block.text;

    // Update cx
    newBlock = newBlock.replace(
      new RegExp(`(\\bcx:\\s*)${fix.actual.cx}\\b`),
      `$1${newCx}`
    );
    // Update cy
    newBlock = newBlock.replace(
      new RegExp(`(\\bcy:\\s*)${fix.actual.cy}\\b`),
      `$1${newCy}`
    );

    if (fix.shape === 'line' && fix.projectedPath && fix.projectedPath.length > 0) {
      // Replace entire points array with reprojected geographic path
      const newPts = fix.projectedPath.map(([x, y]) => `[${x},${y}]`).join(',');
      newBlock = newBlock.replace(
        /points:\s*\[[\s\S]*?\]\s*(?=,?\s*\})/,
        `points: [${newPts}]`
      );
      console.log(`    points: replaced with ${fix.projectedPath.length} georeferenced waypoints`);
    } else if (fix.hasPoints || fix.hasPeaks) {
      // Shift all [x, y] coordinate pairs by (dx, dy)
      newBlock = newBlock.replace(/\[(\d+),(\d+)\]/g, (m, x, y) =>
        `[${parseInt(x) + dx},${parseInt(y) + dy}]`
      );
      console.log(`    coordinates shifted by (${dx>=0?'+':''}${dx}, ${dy>=0?'+':''}${dy})`);
    }

    src = src.slice(0, block.start) + newBlock + src.slice(block.end);
  }

  // Back up original
  fs.writeFileSync(path.join(DIR, 'features.js.bak'), fs.readFileSync(path.join(DIR, 'features.js')));
  fs.writeFileSync(path.join(DIR, 'features.js'), src);
  console.log('\n  Original backed up to features.js.bak');
}

function findFeatureBlock(src, id) {
  // Walk the FEATURES array and find the object with matching id
  const arrIdx = src.indexOf('const FEATURES = [');
  if (arrIdx === -1) return null;

  let i = src.indexOf('[', arrIdx) + 1;
  let outerDepth = 1;

  while (i < src.length && outerDepth > 0) {
    // Skip to next top-level { (a feature object)
    while (i < src.length && src[i] !== '{' && outerDepth > 0) {
      if (src[i] === '[') outerDepth++;
      else if (src[i] === ']') outerDepth--;
      i++;
    }
    if (outerDepth <= 0) break;

    const blockStart = i;
    let depth = 0;
    while (i < src.length) {
      if (src[i] === '{' || src[i] === '[') depth++;
      else if (src[i] === '}' || src[i] === ']') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    const blockEnd = i + 1;
    const blockText = src.slice(blockStart, blockEnd);

    if (new RegExp(`\\bid:\\s*${id}\\b`).test(blockText)) {
      return { start: blockStart, end: blockEnd, text: blockText };
    }
    i++;
  }
  return null;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
