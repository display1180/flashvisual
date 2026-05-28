// ═══════════════════════════════════════════════════════
//  ASCII FLASH — Hypnotic Character Storm
//  5 Modes: Plasma / Vortex / Matrix / Shockwave / Glitch
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const flashLayer = document.getElementById('flash-layer');

// ── Config ──
const CHAR_SETS = {
  dense:   '█▓▒░▄▀■□◆◇●○★☆▲△♦♠♣♥',
  ascii:   '@#$%&*+=~^!?/\\|(){}[]<>',
  minimal: '.·:;+*#@',
  blocks:  '█▓▒░ ',
  kanji:   '電影光閃雷暗夢幻星月火水風',
  symbols: '◈◉◎●○◐◑◒◓◔◕◖◗◘◙◚◛',
};
const ALL_CHARS = CHAR_SETS.dense + CHAR_SETS.ascii + CHAR_SETS.kanji + CHAR_SETS.symbols;

let CELL = 14;           // character cell size
let cols, rows;
let time = 0;
let renderMode = 0;      // 0-4
let speedMult = 1.0;
let isStarted = false;
let mouseX = 0, mouseY = 0;
let mouseNX = 0.5, mouseNY = 0.5;  // normalized 0-1

// ── Flash / Strobe ──
let flashTimer = 0;
let flashInterval = 2.5; // seconds between flashes
let strobeActive = false;
let strobeTick = 0;

// ── Color cycling ──
let globalHue = 0;
let hueSpeed = 60;  // degrees per second

// ── Matrix rain state ──
let matrixDrops = [];

// ── Shockwave state ──
let shockwaves = [];
let lastShockTime = 0;

// ── Glitch state ──
let glitchLines = [];
let glitchIntensity = 0;

// ── Decode state ──
let decodeGrid = [];
let decodeProgress = 0;

// ── Swarm state ──
let swarmParticles = [];

// ── Hyperspace state ──
let hyperspaceStars = [];

// ── Radar state ──
let radarAngle = 0;
let radarGrid = [];

// ── Biolum state ──
let biolumTime = 0;

// ── Override state ──
let overrideBlocks = [];

// ── Meltdown state ──
let meltdownTime = 0;

// ── Infected state ──
let infectedCells = [];

// ── Critical state ──
let criticalPhase = 0;

// ── Rainbow states ──
let prismAngle = 0;
let discoTiles = [];

// ── FPS ──
let frameCount = 0;
let lastFpsTime = 0;
let currentFps = 60;

// ── HUD elements (cached) ──
let hudMode, hudSpeed, hudChars, hudHue, fpsDisplay;

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════

function init() {
  hudMode  = document.getElementById('hud-mode');
  hudSpeed = document.getElementById('hud-speed');
  hudChars = document.getElementById('hud-chars');
  hudHue   = document.getElementById('hud-hue');
  fpsDisplay = document.getElementById('fps-display');

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseNX = e.clientX / window.innerWidth;
    mouseNY = e.clientY / window.innerHeight;
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (!isStarted) return;
    if (e.key >= '1' && e.key <= '5') {
      setMode(parseInt(e.key) - 1);
    }
    if (e.key === ' ') {
      e.preventDefault();
      triggerFlash();
    }
  });

  // Click triggers shockwave in shockwave mode
  window.addEventListener('click', e => {
    if (!isStarted) return;
    if (renderMode === 3) {
      shockwaves.push({
        cx: e.clientX, cy: e.clientY,
        radius: 0, maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
        birth: time, life: 2.0
      });
    }
  });

  // Start button
  document.getElementById('start-btn').addEventListener('click', startExperience);

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(parseInt(btn.dataset.mode)));
  });

  // Speed slider
  document.getElementById('speed-slider').addEventListener('input', e => {
    speedMult = parseFloat(e.target.value);
  });
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cols = Math.floor(canvas.width / CELL);
  rows = Math.floor(canvas.height / CELL);
  initMatrixDrops();
}

function initMatrixDrops() {
  matrixDrops = [];
  for (let x = 0; x < cols; x++) {
    matrixDrops.push({
      y: Math.random() * rows * -1,
      speed: 0.3 + Math.random() * 1.2,
      len: 5 + Math.floor(Math.random() * 25),
      chars: [],
    });
    // Pre-fill chars
    for (let i = 0; i < matrixDrops[x].len; i++) {
      matrixDrops[x].chars.push(ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)]);
    }
  }
}

function startExperience() {
  isStarted = true;
  const overlay = document.getElementById('start-overlay');
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 1200);

  document.getElementById('hud').classList.add('visible');
  document.getElementById('mode-panel').classList.add('visible');
  document.getElementById('speed-panel').classList.add('visible');
  fpsDisplay.classList.add('visible');

  lastFpsTime = performance.now();
  requestAnimationFrame(loop);
}

function setMode(m) {
  renderMode = m;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mode-btn')[m]?.classList.add('active');
  const names = ['PLASMA', 'VORTEX', 'MATRIX', 'SHOCKWAVE', 'GLITCH', 'DECODE', 'SWARM', 'HYPERSPACE', 'RADAR', 'BIOLUM', 'OVERRIDE', 'MELTDOWN', 'INFECTED', 'CRITICAL', 'PRISM', 'CHROMATIC', 'DISCO', 'JULIA', 'SIERPINSKI', 'RECURSION', 'STATIC', 'TEARING', 'DATABEND', 'NEURAL', 'SYMBIOSIS', 'SINGULARITY', 'HALO', 'FEATHERS', 'DIVINE', 'TENSOR', 'SCANNER', 'SENTIENCE', 'RAVE SKULL', 'SKELETON CREW', 'X-RAY SPINE', 'IDC SCROLL', 'IDC CHAOS', 'IDC TYPO', 'A, HEARTBEAT', 'A, LOVE RAIN', 'A, NEON LOVE', 'B, MAGNETIC', 'B, RADAR', 'B, BURNING'];
  hudMode.textContent = names[m];
  hudMode.style.color = getModePrimaryColor(m);

  // Reset mode-specific state
  if (m === 2) initMatrixDrops();
  if (m === 3) { shockwaves = []; }
  if (m === 4) { glitchIntensity = 0; }
  if (m === 5) { 
    decodeGrid = new Array(cols * rows).fill(0); 
    decodeProgress = 0; 
  }
  if (m === 6) { initSwarm(); }
  if (m === 7) { initStars(); }
}

function getModePrimaryColor(m) {
  const colors = ['#ff00ff', '#00ffff', '#00ff41', '#ffaa00', '#ff0040', '#ffff00', '#ff00aa', '#ffffff', '#00ff41', '#55ff22', '#00cc00', '#ff0000', '#ff1100', '#ff0033', '#ffffff', '#00ffff', '#ff00ff', '#aa00ff', '#00ffaa', '#ffaa00', '#888888', '#00ffff', '#ffff00', '#ffaa00', '#ff00ff', '#ffffff', '#ffd700', '#ffccff', '#00ccff', '#00ff88', '#ffff00', '#ff0055', '#ff00ff', '#00ffcc', '#ffffff', '#ff3300', '#ffffff', '#ff00aa', '#ff0055', '#ffccff', '#ff00aa', '#cc00ff', '#00ff00', '#ff5500'];
  return colors[m];
}

// ═══════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════

let lastTime = 0;

function loop(timestamp) {
  if (!isStarted) return;
  requestAnimationFrame(loop);

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05) * speedMult;
  lastTime = timestamp;
  time += dt;

  // FPS counter
  frameCount++;
  if (timestamp - lastFpsTime >= 500) {
    currentFps = Math.round(frameCount / ((timestamp - lastFpsTime) / 1000));
    frameCount = 0;
    lastFpsTime = timestamp;
    fpsDisplay.textContent = currentFps + ' FPS';
  }

  // Global hue rotation
  globalHue = (globalHue + hueSpeed * dt) % 360;

  // Flash / Strobe timing
  flashTimer += dt;
  if (flashTimer > flashInterval) {
    flashTimer = 0;
    triggerFlash();
  }

  // Strobe decay
  if (strobeActive) {
    strobeTick += dt;
    if (strobeTick > 0.15) {
      strobeActive = false;
      flashLayer.style.opacity = '0';
    }
  }

  // Glitch intensity oscillation
  if (renderMode === 4) {
    glitchIntensity = 0.3 + 0.7 * Math.pow(Math.sin(time * 1.5) * 0.5 + 0.5, 2);
    // Random glitch lines
    if (Math.random() < 0.15) {
      glitchLines = [];
      const count = Math.floor(Math.random() * 8) + 2;
      for (let i = 0; i < count; i++) {
        glitchLines.push({
          y: Math.floor(Math.random() * rows),
          offset: (Math.random() - 0.5) * 12,
          height: 1 + Math.floor(Math.random() * 3),
        });
      }
    }
  }

  // ── Clear & Render ──
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch (renderMode) {
    case 0: renderPlasma(dt);     break;
    case 1: renderVortex(dt);     break;
    case 2: renderMatrix(dt);     break;
    case 3: renderShockwave(dt);  break;
    case 4: renderGlitch(dt);     break;
    case 5: renderDecode(dt);     break;
    case 6: renderSwarm(dt);      break;
    case 7: renderHyperspace(dt); break;
    case 8: renderRadar(dt);      break;
    case 9: renderBiolum(dt);     break;
    case 10: renderOverride(dt);  break;
    case 11: renderMeltdown(dt);  break;
    case 12: renderInfected(dt);  break;
    case 13: renderCritical(dt);  break;
    case 14: renderPrism(dt);     break;
    case 15: renderChromatic(dt); break;
    case 16: renderDisco(dt);     break;
    case 17: renderJulia(dt);     break;
    case 18: renderSierpinski(dt); break;
    case 19: renderRecursion(dt); break;
    case 20: renderStatic(dt);    break;
    case 21: renderTearing(dt);   break;
    case 22: renderDatabend(dt);  break;
    case 23: renderNeural(dt);    break;
    case 24: renderSymbiosis(dt); break;
    case 25: renderSingularity(dt); break;
    case 26: renderHalo(dt);      break;
    case 27: renderFeathers(dt);  break;
    case 28: renderDivine(dt);    break;
    case 29: renderTensor(dt);    break;
    case 30: renderScanner(dt);   break;
    case 31: renderSentience(dt); break;
    case 32: renderRaveSkull(dt); break;
    case 33: renderSkeletonCrew(dt); break;
    case 34: renderXraySpine(dt); break;
    case 35: renderIDCScroll(dt); break;
    case 36: renderIDCChaos(dt);  break;
    case 37: renderIDCTypo(dt);   break;
    case 38: renderAHeartbeat(dt); break;
    case 39: renderALoveRain(dt); break;
    case 40: renderANeonLove(dt); break;
    case 41: renderBMagnetic(dt); break;
    case 42: renderBRadar(dt); break;
    case 43: renderBBurning(dt); break;
  }

  // HUD update (every 8 frames)
  if (frameCount % 8 === 0) {
    hudSpeed.textContent = speedMult.toFixed(1) + 'x';
    hudChars.textContent = (cols * rows).toLocaleString();
    hudHue.textContent = Math.floor(globalHue) + '°';
    hudHue.style.color = `hsl(${globalHue}, 100%, 65%)`;
  }
}

// ═══════════════════════════════════════════════════════
//  FLASH EFFECTS
// ═══════════════════════════════════════════════════════

function triggerFlash() {
  strobeActive = true;
  strobeTick = 0;
  const hue = globalHue;
  flashLayer.style.background = `radial-gradient(circle at ${mouseNX*100}% ${mouseNY*100}%, 
    hsla(${hue}, 100%, 80%, 0.7), 
    hsla(${hue + 60}, 100%, 50%, 0.3), 
    transparent 70%)`;
  flashLayer.style.opacity = '1';
}

// ═══════════════════════════════════════════════════════
//  COLOR UTILITIES
// ═══════════════════════════════════════════════════════

function hslToStr(h, s, l, a = 1) {
  return `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;
}

// Fast integer-based HSL approximation for performance
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// ═══════════════════════════════════════════════════════
//  MODE 0: PLASMA
//  Multi-layer sine plasma with rainbow color cycling
// ═══════════════════════════════════════════════════════

function renderPlasma(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.symbols;
  const t = time;
  const fontSize = CELL;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Mouse influence
  const mxf = mouseNX * 4;
  const myf = mouseNY * 4;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = x / cols;
      const ny = y / rows;

      // Multi-layer plasma
      let v = 0;
      v += Math.sin(x * 0.15 + t * 2.0);
      v += Math.sin(y * 0.12 + t * 1.5);
      v += Math.sin((x * 0.1 + y * 0.08) + t * 1.2);
      v += Math.sin(Math.sqrt((x - cols * mouseNX) ** 2 + (y - rows * mouseNY) ** 2) * 0.12 - t * 3);
      v += Math.sin(Math.sqrt(x * x + y * y) * 0.06 + t * 0.8);
      v = v / 5; // normalize -1 to 1

      const intensity = (v + 1) * 0.5; // 0 to 1

      // Color
      const hue = (globalHue + intensity * 180 + x * 2 + y * 1.5) % 360;
      const sat = 85 + intensity * 15;
      const lum = 10 + intensity * 70;

      // Character selection based on intensity
      const charIdx = Math.floor(intensity * (chars.length - 1));
      const ch = chars[charIdx];

      // Brightness flash pulse
      const pulse = Math.sin(t * 6 + x * 0.3 + y * 0.2) * 0.5 + 0.5;
      const finalLum = lum + pulse * 20;

      ctx.fillStyle = hslToStr(hue, sat, Math.min(finalLum, 95));
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }

  // Bright center pulse overlay
  const pulseSize = (Math.sin(t * 3) * 0.5 + 0.5) * 300 + 100;
  const grad = ctx.createRadialGradient(
    mouseX, mouseY, 0,
    mouseX, mouseY, pulseSize
  );
  grad.addColorStop(0, `hsla(${globalHue}, 100%, 90%, 0.15)`);
  grad.addColorStop(0.5, `hsla(${globalHue + 90}, 100%, 60%, 0.05)`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ═══════════════════════════════════════════════════════
//  MODE 1: VORTEX
//  Spinning spiral ASCII vortex
// ═══════════════════════════════════════════════════════

function renderVortex(dt) {
  const chars = CHAR_SETS.symbols + CHAR_SETS.kanji;
  const t = time;
  const cx = cols * mouseNX;
  const cy = rows * mouseNY;
  const fontSize = CELL;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Spiral distortion
      const spiral = angle + dist * 0.15 - t * 2.5;
      const wave = Math.sin(spiral * 3) * 0.5 + 0.5;
      const radialWave = Math.sin(dist * 0.3 - t * 4) * 0.5 + 0.5;

      const intensity = (wave * 0.6 + radialWave * 0.4);

      // Vortex color: cyan → magenta shift based on angle
      const hue = (globalHue + angle * 57.3 + dist * 5 - t * 60) % 360;
      const sat = 90;
      const lum = 5 + intensity * 80;

      // Characters change based on distance bands
      const band = Math.floor((dist * 0.5 + t * 3) % chars.length);
      const ch = chars[band];

      // Flash at certain radii
      const ringFlash = Math.abs(Math.sin(dist * 0.2 - t * 5)) > 0.95 ? 30 : 0;

      ctx.fillStyle = hslToStr(hue, sat, Math.min(lum + ringFlash, 98));
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }

  // Center glow
  const glowR = 80 + Math.sin(t * 5) * 40;
  const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowR);
  grad.addColorStop(0, `hsla(${globalHue + 180}, 100%, 95%, 0.4)`);
  grad.addColorStop(0.3, `hsla(${globalHue + 180}, 100%, 70%, 0.15)`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ═══════════════════════════════════════════════════════
//  MODE 2: MATRIX RAIN
//  Enhanced digital rain with color bursts
// ═══════════════════════════════════════════════════════

function renderMatrix(dt) {
  const chars = CHAR_SETS.kanji + CHAR_SETS.ascii + CHAR_SETS.symbols;
  const fontSize = CELL;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Fade previous frame (trail effect via semi-transparent black)
  // Already cleared, so we draw trails manually
  const t = time;

  for (let x = 0; x < cols; x++) {
    const drop = matrixDrops[x];
    if (!drop) continue;

    drop.y += drop.speed * speedMult * 1.5;
    if (drop.y - drop.len > rows) {
      drop.y = -drop.len;
      drop.speed = 0.3 + Math.random() * 1.2;
      drop.len = 5 + Math.floor(Math.random() * 25);
    }

    // Randomize some chars occasionally
    if (Math.random() < 0.05) {
      const ci = Math.floor(Math.random() * drop.len);
      drop.chars[ci] = chars[Math.floor(Math.random() * chars.length)];
    }

    for (let i = 0; i < drop.len; i++) {
      const yy = Math.floor(drop.y) - i;
      if (yy < 0 || yy >= rows) continue;

      const charIdx = i % drop.chars.length;
      const ch = drop.chars[charIdx];

      // Color: head is bright white/cyan, trail fades to green then dark
      const headDist = i / drop.len;

      let hue, sat, lum;
      if (i === 0) {
        // Head: bright flash
        hue = globalHue;
        sat = 30;
        lum = 95;
      } else if (i < 3) {
        hue = (globalHue + 120) % 360;
        sat = 80;
        lum = 70 - headDist * 30;
      } else {
        hue = 130 + Math.sin(t + x * 0.2) * 20;
        sat = 100;
        lum = Math.max(5, 50 - headDist * 55);
      }

      ctx.fillStyle = hslToStr(hue, sat, lum, 1 - headDist * 0.3);
      ctx.fillText(ch, x * CELL, yy * CELL);
    }
  }

  // Random horizontal flash lines
  if (Math.random() < 0.03) {
    const flashY = Math.floor(Math.random() * rows);
    ctx.fillStyle = `hsla(${globalHue}, 100%, 70%, 0.3)`;
    ctx.fillRect(0, flashY * CELL, canvas.width, CELL);
  }

  // Scanline effect
  for (let y = 0; y < canvas.height; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 3: SHOCKWAVE
//  Expanding ring waves with character displacement
// ═══════════════════════════════════════════════════════

function renderShockwave(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.blocks;
  const t = time;
  const fontSize = CELL;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Auto-generate shockwaves periodically
  if (t - lastShockTime > 1.5) {
    lastShockTime = t;
    shockwaves.push({
      cx: mouseX,
      cy: mouseY,
      radius: 0,
      maxRadius: Math.max(canvas.width, canvas.height) * 0.9,
      birth: t,
      life: 2.5,
    });
  }

  // Update shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    const age = t - sw.birth;
    sw.radius = (age / sw.life) * sw.maxRadius;
    if (age > sw.life) {
      shockwaves.splice(i, 1);
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * CELL + CELL / 2;
      const py = y * CELL + CELL / 2;

      let totalIntensity = 0;
      let waveHue = globalHue;

      for (const sw of shockwaves) {
        const dx = px - sw.cx;
        const dy = py - sw.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const age = t - sw.birth;
        const life01 = age / sw.life;

        // Ring intensity (sharp ring wave)
        const ringDist = Math.abs(dist - sw.radius);
        const ringWidth = 30 + life01 * 60;
        const ringIntensity = Math.max(0, 1 - ringDist / ringWidth) * (1 - life01);

        totalIntensity += ringIntensity;
        waveHue = globalHue + dist * 0.5 + age * 120;
      }

      totalIntensity = Math.min(totalIntensity, 1);

      if (totalIntensity < 0.02) continue; // skip dark cells for performance

      const charIdx = Math.floor(totalIntensity * (chars.length - 1));
      const ch = chars[charIdx];

      const sat = 80 + totalIntensity * 20;
      const lum = 10 + totalIntensity * 85;

      ctx.fillStyle = hslToStr(waveHue, sat, lum, totalIntensity);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }

  // Bright center flash at wave origin
  for (const sw of shockwaves) {
    const age = t - sw.birth;
    if (age < 0.3) {
      const flashA = (1 - age / 0.3) * 0.5;
      const r = 60 * (1 - age / 0.3);
      const grad = ctx.createRadialGradient(sw.cx, sw.cy, 0, sw.cx, sw.cy, r);
      grad.addColorStop(0, `hsla(${globalHue}, 100%, 95%, ${flashA})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(sw.cx - r, sw.cy - r, r * 2, r * 2);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 4: GLITCH
//  Corrupted data stream aesthetic
// ═══════════════════════════════════════════════════════

function renderGlitch(dt) {
  const t = time;
  const fontSize = CELL;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  const allChars = ALL_CHARS;

  // Base pattern: slow scrolling text grid with corruption
  for (let y = 0; y < rows; y++) {
    // Check if this row is glitched
    let rowOffset = 0;
    let rowCorrupted = false;
    for (const gl of glitchLines) {
      if (y >= gl.y && y < gl.y + gl.height) {
        rowOffset = gl.offset;
        rowCorrupted = true;
        break;
      }
    }

    for (let x = 0; x < cols; x++) {
      // Base character from scrolling pattern
      const scrollX = x + Math.floor(t * 3);
      const scrollY = y + Math.floor(t * 1.5);
      const hash = ((scrollX * 7919 + scrollY * 104729) & 0xFFFF) / 0xFFFF;

      let intensity;
      // Create structured blocks of data
      const blockX = Math.floor(x / 6);
      const blockY = Math.floor(y / 3);
      const blockHash = ((blockX * 3571 + blockY * 8461 + Math.floor(t * 2)) & 0xFF) / 0xFF;

      if (blockHash > 0.5) {
        intensity = hash;
      } else {
        intensity = hash * 0.15; // Dim regions
      }

      // Corruption spikes
      if (rowCorrupted) {
        intensity = Math.random();
      }

      // Random bright pixel bursts
      const burstSeed = Math.sin(x * 12.9898 + y * 78.233 + Math.floor(t * 8) * 43758.5453);
      const burst = (burstSeed - Math.floor(burstSeed));
      if (burst > 0.997) {
        intensity = 1.0;
      }

      // Character selection
      let ch;
      if (rowCorrupted) {
        ch = allChars[Math.floor(Math.random() * allChars.length)];
      } else {
        const ci = Math.floor(hash * (allChars.length - 1));
        ch = allChars[ci];
      }

      // Color: base is red/orange with corruption showing cyan
      let hue, sat, lum;
      if (rowCorrupted) {
        hue = globalHue + 180;
        sat = 100;
        lum = 20 + intensity * 75;
      } else {
        hue = globalHue + (blockHash > 0.7 ? 180 : 0);
        sat = 70 + intensity * 30;
        lum = intensity * 55;
      }

      if (intensity < 0.05) continue;

      const drawX = (x + rowOffset) * CELL;
      ctx.fillStyle = hslToStr(hue, sat, lum, Math.min(intensity + 0.2, 1));
      ctx.fillText(ch, drawX, y * CELL);
    }
  }

  // Horizontal color bars (VHS-like)
  const barCount = 3 + Math.floor(Math.sin(t * 2) * 2);
  for (let i = 0; i < barCount; i++) {
    const barY = ((Math.sin(t * 1.3 + i * 2.7) * 0.5 + 0.5) * canvas.height) | 0;
    const barH = 2 + Math.floor(Math.random() * 4);
    const barHue = (globalHue + i * 90) % 360;
    ctx.fillStyle = `hsla(${barHue}, 100%, 60%, 0.15)`;
    ctx.fillRect(0, barY, canvas.width, barH);
  }

  // Periodic full-frame flash
  if (Math.random() < 0.01 * glitchIntensity) {
    ctx.fillStyle = `hsla(${globalHue}, 100%, 80%, ${0.1 + Math.random() * 0.15})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Chromatic aberration overlay effect (shift a region)
  if (glitchIntensity > 0.6 && Math.random() < 0.3) {
    const regionY = Math.floor(Math.random() * canvas.height);
    const regionH = 20 + Math.floor(Math.random() * 60);
    const shift = Math.floor((Math.random() - 0.5) * 10);

    const imageData = ctx.getImageData(0, regionY, canvas.width, Math.min(regionH, canvas.height - regionY));
    ctx.putImageData(imageData, shift, regionY);
  }

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

// ═══════════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════════

init();

// Draw idle animation on start screen
function idleLoop() {
  if (isStarted) return;
  requestAnimationFrame(idleLoop);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = performance.now() / 1000;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  // Subtle animated dots on start screen
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.sqrt((x - cols / 2) ** 2 + (y - rows / 2) ** 2);
      const wave = Math.sin(d * 0.15 - t * 2) * 0.5 + 0.5;
      if (wave < 0.6) continue;

      const a = (wave - 0.6) * 2.5;
      const hue = (t * 40 + d * 3) % 360;
      ctx.fillStyle = hslToStr(hue, 80, 50, a * 0.3);
      ctx.fillText('·', x * CELL, y * CELL);
    }
  }
}
// ═══════════════════════════════════════════════════════
//  MODE 5: DECODE (Staccato Typewriter)
// ═══════════════════════════════════════════════════════
function renderDecode(dt) {
  const chars = CHAR_SETS.kanji + CHAR_SETS.ascii + CHAR_SETS.symbols;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const totalCells = cols * rows;
  if (!decodeGrid || decodeGrid.length !== totalCells) {
    decodeGrid = new Array(totalCells).fill(0);
    decodeProgress = 0;
  }

  // Typewriter speed
  const decodeSpeed = 1500 * speedMult;
  decodeProgress += decodeSpeed * dt;
  
  if (decodeProgress > totalCells + 500) {
    decodeProgress = 0; // Reset and loop
    decodeGrid.fill(0);
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      // Scramble based on distance from current progress
      const targetDist = idx - decodeProgress;
      
      let ch = '';
      let lum = 0;
      let sat = 100;
      let hue = globalHue;

      if (targetDist > 0 && targetDist < 50) {
        // Just about to be typed - frantic scrambling
        ch = chars[Math.floor(Math.random() * chars.length)];
        lum = 40 + Math.random() * 60;
        hue = globalHue + 120;
      } else if (targetDist <= 0 && targetDist > -100) {
        // Freshly typed - stable but bright
        const stableCharIdx = (x * 37 + y * 91) % chars.length;
        ch = chars[stableCharIdx];
        lum = 100 - (targetDist * -1.0); // fades quickly
      } else if (targetDist <= -100) {
        // Old typed - dim background
        const stableCharIdx = (x * 37 + y * 91) % chars.length;
        ch = chars[stableCharIdx];
        lum = 15;
        sat = 40;
      }

      if (lum > 0) {
        ctx.fillStyle = hslToStr(hue, sat, Math.min(lum, 100));
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }

  // Draw typing cursor
  const cursorIdx = Math.floor(decodeProgress);
  if (cursorIdx >= 0 && cursorIdx < totalCells) {
    const cx = (cursorIdx % cols) * CELL;
    const cy = Math.floor(cursorIdx / cols) * CELL;
    ctx.fillStyle = `hsla(${globalHue + 60}, 100%, 70%, 0.8)`;
    ctx.fillRect(cx, cy, CELL, CELL);
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 6: SWARM (Boids / Particles)
// ═══════════════════════════════════════════════════════
function initSwarm() {
  swarmParticles = [];
  for (let i = 0; i < 400; i++) {
    swarmParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      char: ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)],
      life: Math.random() * 100
    });
  }
}

function renderSwarm(dt) {
  if (!swarmParticles || swarmParticles.length === 0) initSwarm();
  
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const centerRepel = { x: mouseX, y: mouseY };

  // Draw trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const p of swarmParticles) {
    // Flow field force
    const angle = (Math.sin(p.x * 0.005 + time) + Math.cos(p.y * 0.005 + time)) * Math.PI;
    p.vx += Math.cos(angle) * 15 * speedMult;
    p.vy += Math.sin(angle) * 15 * speedMult;

    // Mouse repel
    const dx = p.x - centerRepel.x;
    const dy = p.y - centerRepel.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 30000) {
      const force = 1500 / (distSq + 1);
      p.vx += dx * force;
      p.vy += dy * force;
    }

    // Drag
    p.vx *= 0.94;
    p.vy *= 0.94;

    p.x += p.vx * dt * speedMult;
    p.y += p.vy * dt * speedMult;

    // Wrap
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) p.y += canvas.height;
    if (p.y > canvas.height) p.y -= canvas.height;

    p.life += dt * 10;
    
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const lum = Math.min(30 + speed * 0.8, 100);
    const hue = (globalHue + p.life * 2 + speed * 2) % 360;

    ctx.fillStyle = hslToStr(hue, 100, lum);
    
    // Change char randomly based on speed
    if (Math.random() < speed * 0.002) {
      p.char = ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
    }

    ctx.fillText(p.char, p.x, p.y);
  }
  ctx.textAlign = 'start'; // reset
}

// ═══════════════════════════════════════════════════════
//  MODE 7: HYPERSPACE (Starfield Warp)
// ═══════════════════════════════════════════════════════
function initStars() {
  hyperspaceStars = [];
  for (let i = 0; i < 400; i++) {
    hyperspaceStars.push({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      z: Math.random() * 2000,
      char: CHAR_SETS.minimal[Math.floor(Math.random() * CHAR_SETS.minimal.length)]
    });
  }
}

function renderHyperspace(dt) {
  if (!hyperspaceStars || hyperspaceStars.length === 0) initStars();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  
  // Mouse tilt
  const tx = cx + (mouseNX - 0.5) * 800;
  const ty = cy + (mouseNY - 0.5) * 800;

  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const warpSpeed = 1800 * speedMult;

  for (const s of hyperspaceStars) {
    const lastZ = s.z;
    s.z -= warpSpeed * dt;

    if (s.z <= 0) {
      s.x = (Math.random() - 0.5) * 2500;
      s.y = (Math.random() - 0.5) * 2500;
      s.z = 2000;
      s.char = CHAR_SETS.minimal[Math.floor(Math.random() * Math.min(CHAR_SETS.minimal.length, 4))];
    }

    // 3D Projection
    const fov = 350;
    const px = (s.x / s.z) * fov + tx;
    const py = (s.y / s.z) * fov + ty;
    
    // Trail projection
    const ppx = (s.x / lastZ) * fov + tx;
    const ppy = (s.y / lastZ) * fov + ty;

    const dist = Math.sqrt((px - ppx)**2 + (py - ppy)**2);
    
    // Faster stars get thicker/brighter chars
    if (dist > 15) {
      s.char = CHAR_SETS.blocks[0];
    } else if (dist > 4) {
      s.char = CHAR_SETS.dense[Math.floor(Math.random() * CHAR_SETS.dense.length)];
    }

    const scale = Math.max(0.1, (2000 - s.z) / 2000);
    const lum = Math.min(100, scale * 120 + 20);
    
    // Draw motion trail
    if (dist > 1.5) {
      ctx.strokeStyle = `hsla(${globalHue + s.z * 0.15}, 100%, ${lum}%, ${scale})`;
      ctx.lineWidth = Math.max(1, scale * 4);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ppx, ppy);
      ctx.stroke();
    }

    ctx.fillStyle = `hsla(${globalHue + 180 + s.z * 0.08}, 100%, ${lum}%, ${scale + 0.3})`;
    ctx.font = `${Math.max(4, CELL * scale * 1.5)}px monospace`;
    ctx.fillText(s.char, px, py);
  }
  ctx.textAlign = 'start'; // reset
}

// ═══════════════════════════════════════════════════════
//  MODE 8: RADAR (Deep Scan)
// ═══════════════════════════════════════════════════════
function renderRadar(dt) {
  const chars = CHAR_SETS.minimal + CHAR_SETS.symbols;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  radarAngle += 2.5 * speedMult * dt;
  if (radarAngle > Math.PI * 2) radarAngle -= Math.PI * 2;

  const cx = cols / 2;
  const cy = rows / 2;

  // Generate hidden terrain blips periodically
  if (Math.random() < 0.05 * speedMult) {
    radarGrid.push({
      x: Math.random() * cols,
      y: Math.random() * rows,
      life: 1.0,
      size: Math.random() * 5 + 2
    });
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;

      // Radar beam intensity (trailing fade)
      let diff = radarAngle - angle;
      if (diff < 0) diff += Math.PI * 2;
      
      let intensity = 0;
      if (diff < 0.8) {
        intensity = 1.0 - (diff / 0.8);
      }

      // Distance rings
      if (Math.abs(dist % 10) < 0.3) intensity = Math.max(intensity, 0.1);

      // Blips
      for (let i = radarGrid.length - 1; i >= 0; i--) {
        const blip = radarGrid[i];
        const bdx = x - blip.x;
        const bdy = y - blip.y;
        const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
        
        if (bDist < blip.size) {
          // Illuminate blip if radar passes over it
          if (diff < 0.2) {
            intensity = Math.max(intensity, 1.0 - bDist / blip.size);
            blip.life = 1.0; // recharge glow
          } else {
            // Afterglow
            intensity = Math.max(intensity, (1.0 - bDist / blip.size) * blip.life * 0.8);
          }
        }
      }

      if (intensity < 0.02) continue; // skip dark

      const charIdx = Math.floor(intensity * (chars.length - 1));
      const ch = chars[charIdx];

      // Forced green theme
      const hue = 120 + intensity * 20;
      const sat = 100;
      const lum = 5 + intensity * 85;

      ctx.fillStyle = hslToStr(hue, sat, lum, intensity);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }

  // Update blip life
  for (let i = radarGrid.length - 1; i >= 0; i--) {
    radarGrid[i].life -= 0.5 * dt;
    if (radarGrid[i].life <= 0) {
      radarGrid.splice(i, 1);
    }
  }
  
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 9: BIOLUMINESCENCE (Organic Alien Flora)
// ═══════════════════════════════════════════════════════
function renderBiolum(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  biolumTime += 1.5 * speedMult * dt;
  const t = biolumTime;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Complex organic noise field
      let v = 0;
      v += Math.sin(x * 0.1 + t * 0.5);
      v += Math.cos(y * 0.12 - t * 0.4);
      v += Math.sin((x * 0.2 + y * 0.15) + t * 0.8);
      
      // Add pulsing cellular spots
      const spot1 = Math.sin(Math.sqrt((x-cols*0.3)**2 + (y-rows*0.3)**2) * 0.2 - t * 1.5);
      const spot2 = Math.cos(Math.sqrt((x-cols*0.7)**2 + (y-rows*0.8)**2) * 0.25 - t * 2.0);
      
      v += spot1 + spot2;
      v = (v / 5 + 1) * 0.5; // normalize 0 to 1
      
      // Threshold for spores
      let intensity = v * v * v * 2.0;
      
      // Mouse interaction (glowing trail)
      const dx = x - cols * mouseNX;
      const dy = y - rows * mouseNY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 15) {
        intensity += Math.max(0, 1 - dist / 15);
      }

      intensity = Math.min(intensity, 1);
      
      if (intensity < 0.1) continue;

      const charIdx = Math.floor(intensity * (chars.length - 1));
      const ch = chars[charIdx];

      // Alien green/teal/lime palette
      const hue = 110 + (intensity * 40) + Math.sin(x*0.1+t) * 20;
      const sat = 85 + intensity * 15;
      const lum = 5 + Math.pow(intensity, 1.5) * 85;

      ctx.fillStyle = hslToStr(hue, sat, lum, intensity);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 10: OVERRIDE (System Crash)
// ═══════════════════════════════════════════════════════
function renderOverride(dt) {
  const chars = CHAR_SETS.blocks + CHAR_SETS.kanji;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';
  
  const t = time * speedMult * 2;

  // Background heavy scanlines
  ctx.fillStyle = '#051105';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, canvas.width, 2);
  }

  // Massive block generation
  if (Math.random() < 0.2 * speedMult) {
    overrideBlocks.push({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      w: Math.floor(Math.random() * 20) + 5,
      h: Math.floor(Math.random() * 10) + 2,
      life: Math.random() * 0.5 + 0.1,
      type: Math.random() > 0.5 ? 'solid' : 'noise'
    });
  }

  // Draw blocks
  for (let i = overrideBlocks.length - 1; i >= 0; i--) {
    const b = overrideBlocks[i];
    b.life -= dt;
    
    if (b.life <= 0) {
      overrideBlocks.splice(i, 1);
      continue;
    }

    const lumBase = Math.random() > 0.8 ? 100 : 50;

    for (let by = 0; by < b.h; by++) {
      for (let bx = 0; bx < b.w; bx++) {
        const cx = b.x + bx;
        const cy = b.y + by;
        
        if (cx >= cols || cy >= rows) continue;
        
        let ch = '';
        if (b.type === 'solid') {
          ch = '█';
        } else {
          ch = chars[Math.floor(Math.random() * chars.length)];
        }

        // Green phosphor colors
        const hue = 120;
        const sat = 100;
        const lum = lumBase - Math.random() * 20;
        
        ctx.fillStyle = hslToStr(hue, sat, lum);
        ctx.fillText(ch, cx * CELL, cy * CELL);
      }
    }
  }

  // Warning text flashes
  if (Math.random() < 0.1) {
    const text = "SYSTEM OVERRIDE";
    const tx = Math.floor((cols - text.length) / 2);
    const ty = Math.floor(rows / 2) + Math.floor((Math.random()-0.5)*10);
    
    ctx.fillStyle = '#00ff00';
    for(let i=0; i<text.length; i++) {
      ctx.fillText(text[i], (tx + i) * CELL, ty * CELL);
    }
    
    // Invert block
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx * CELL, ty * CELL, text.length * CELL, CELL);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 11: MELTDOWN (Core Breach)
// ═══════════════════════════════════════════════════════
function renderMeltdown(dt) {
  const chars = CHAR_SETS.blocks + CHAR_SETS.kanji;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';
  
  meltdownTime += dt * speedMult;
  const t = meltdownTime;

  // Background pulsing
  const pulse = Math.abs(Math.sin(t * 3));
  ctx.fillStyle = `rgba(${Math.floor(pulse * 40)}, 0, 0, 1)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cols / 2;
      const dy = y - rows / 2;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Expanding/contracting core
      const coreRadius = 15 + Math.sin(t * 5) * 5;
      const influence = Math.max(0, 1 - dist / (coreRadius * 2));
      
      let intensity = 0;
      if (dist < coreRadius) {
        intensity = 1.0;
      } else {
        // Noise around the core
        intensity = influence * Math.random();
      }

      if (intensity < 0.1) continue;

      // Jitter
      let jx = 0;
      let jy = 0;
      if (intensity > 0.5) {
        jx = (Math.random() - 0.5) * 4;
        jy = (Math.random() - 0.5) * 4;
      }

      const ch = chars[Math.floor(Math.random() * chars.length)];
      
      const r = 150 + intensity * 105;
      const g = (1 - intensity) * 50;
      const b = 0;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(ch, x * CELL + jx, y * CELL + jy);
    }
  }

  // Flash
  if (Math.random() < 0.05 * speedMult) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 12: INFECTED (Blood Virus)
// ═══════════════════════════════════════════════════════
function renderInfected(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  if (!infectedCells || infectedCells.length !== cols * rows) {
    infectedCells = new Array(cols * rows).fill(0);
  }

  // Randomly infect from top
  for (let x = 0; x < cols; x++) {
    if (Math.random() < 0.02 * speedMult) {
      infectedCells[x] = 1.0; // fully infected
    }
  }

  // Spread infection downwards and sideways
  const nextInfected = new Array(cols * rows).fill(0);
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      let val = infectedCells[idx];
      
      // Decay
      val -= 0.02 * dt * speedMult * 60;
      
      if (val > 0) {
        nextInfected[idx] = Math.max(nextInfected[idx] || 0, val);
        
        // Spread down
        if (y < rows - 1 && Math.random() < 0.3 * speedMult) {
          nextInfected[(y+1) * cols + x] = Math.max(nextInfected[(y+1) * cols + x] || 0, val);
        }
        // Spread sideways
        if (x > 0 && Math.random() < 0.05 * speedMult) {
          nextInfected[y * cols + (x-1)] = Math.max(nextInfected[y * cols + (x-1)] || 0, val * 0.8);
        }
        if (x < cols - 1 && Math.random() < 0.05 * speedMult) {
          nextInfected[y * cols + (x+1)] = Math.max(nextInfected[y * cols + (x+1)] || 0, val * 0.8);
        }
      }
    }
  }
  
  infectedCells = nextInfected;

  ctx.fillStyle = 'rgba(10, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const val = infectedCells[y * cols + x];
      if (val <= 0) continue;

      const ch = chars[Math.floor(Math.random() * chars.length)];
      
      const hue = 0; // Red
      const sat = 100;
      const lum = 10 + val * 60;
      
      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 13: CRITICAL (Fatal Error / Alarm)
// ═══════════════════════════════════════════════════════
function renderCritical(dt) {
  const chars = CHAR_SETS.blocks;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';
  
  criticalPhase += dt * speedMult;
  
  const strobe = Math.floor(criticalPhase * 10) % 2 === 0;
  
  ctx.fillStyle = strobe ? '#330000' : '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Massive error bands
  for (let y = 0; y < rows; y++) {
    const isBand = Math.sin(y * 0.2 + criticalPhase * 5) > 0.5;
    
    for (let x = 0; x < cols; x++) {
      if (!isBand && Math.random() > 0.1) continue;

      const ch = chars[Math.floor(Math.random() * chars.length)];
      const lum = isBand ? 50 + Math.random() * 50 : 20;
      ctx.fillStyle = `hsl(0, 100%, ${lum}%)`;
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }

  // Warning text
  const warningText = "FATAL ERROR // CRITICAL FAILURE // OVERRIDE REJECTED";
  if (Math.random() < 0.5) {
    const scale = 2;
    ctx.font = `bold ${CELL * scale}px monospace`;
    ctx.fillStyle = '#ff0000';
    
    // Draw text in multiple random places
    for (let i = 0; i < 3; i++) {
      const tx = (Math.random() - 0.2) * canvas.width;
      const ty = Math.random() * canvas.height;
      ctx.fillText(warningText, tx, ty);
    }
  }
  
  // Vignette
  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(255, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ═══════════════════════════════════════════════════════
//  MODE 14: PRISM (Kaleidoscope Rainbow)
// ═══════════════════════════════════════════════════════
function renderPrism(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.symbols;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  prismAngle += dt * 0.5 * speedMult;
  
  const cx = cols / 2;
  const cy = rows / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      let angle = Math.atan2(dy, dx) + prismAngle;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Kaleidoscope symmetry (6 segments)
      const segments = 6;
      angle = (angle % (Math.PI * 2 / segments));
      // mirror
      if (angle > Math.PI / segments) {
        angle = (Math.PI * 2 / segments) - angle;
      }

      const wave = Math.sin(dist * 0.2 - time * 3 * speedMult + angle * 5);
      
      if (Math.abs(wave) < 0.2) continue; // High contrast black space

      const ch = chars[Math.floor((dist + time * 10) % chars.length)];
      
      let hue = (globalHue + dist * 5 + angle * 100) % 360;
      let sat = 100;
      let lum = 60;

      // Add stark white flashes at the peaks of the wave
      if (Math.abs(wave) > 0.95) {
        sat = 0;
        lum = 100;
      } else if (Math.abs(wave) > 0.8) {
        lum = 80;
      }

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 15: CHROMATIC ABERRATION
// ═══════════════════════════════════════════════════════
function renderChromatic(dt) {
  const chars = CHAR_SETS.kanji + CHAR_SETS.ascii;
  ctx.font = `bold ${CELL * 1.5}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // RGB Split distances
  const splitX = Math.sin(t * 10) * 15 * speedMult;
  const splitY = Math.cos(t * 8) * 15 * speedMult;

  // Strobe effect removed per user request
  const isStrobe = false;

  // Draw sparse, large text
  const step = 4;
  for (let y = 0; y < rows; y += step) {
    for (let x = 0; x < cols; x += step) {
      // Noise to determine if text exists here
      const n = (Math.sin(x*1.1 + y*0.8 + t) + Math.cos(x*0.5 - y*1.2 - t*1.5)) * 0.5;
      
      if (n > 0.3) {
        const ch = chars[Math.floor((x*y + Math.floor(t*5)) % chars.length)];
        const px = x * CELL;
        const py = y * CELL;

        ctx.globalCompositeOperation = 'screen';
        
        // Red channel
        ctx.fillStyle = isStrobe ? '#00ffff' : '#ff0000';
        ctx.fillText(ch, px + splitX, py + splitY);
        
        // Green channel
        ctx.fillStyle = isStrobe ? '#ff00ff' : '#00ff00';
        ctx.fillText(ch, px - splitX * 0.5, py - splitY * 0.5);

        // Blue channel
        ctx.fillStyle = isStrobe ? '#ffff00' : '#0000ff';
        ctx.fillText(ch, px - splitX, py + splitY * 0.5);

        ctx.globalCompositeOperation = 'source-over';
        
        // Solid white core
        if (!isStrobe && Math.random() > 0.2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(ch, px, py);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 16: DISCO (Euphoria Grid)
// ═══════════════════════════════════════════════════════
function renderDisco(dt) {
  const chars = CHAR_SETS.blocks;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  if (!discoTiles || discoTiles.length !== cols * rows) {
    discoTiles = new Array(cols * rows).fill({ h: 0, s: 0, l: 0 });
  }

  const bpm = 128 * speedMult;
  const beatTime = 60 / bpm;
  
  // Flash on beat removed per user request
  const beatPulse = (time % beatTime) / beatTime;
  const onBeat = beatPulse < 0.1;

  ctx.fillStyle = '#000000'; // always black background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Random tile activation
  for (let i = 0; i < 20 * speedMult; i++) {
    const rx = Math.floor(Math.random() * cols);
    const ry = Math.floor(Math.random() * rows);
    discoTiles[ry * cols + rx] = {
      h: (globalHue + Math.random() * 360) % 360,
      s: 100,
      l: Math.random() > 0.9 ? 100 : (50 + Math.random() * 30) // 10% pure white
    };
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const tile = discoTiles[idx];
      
      if (tile.l > 0) {
        // Draw tile
        const ch = chars[0]; // Full block █
        ctx.fillStyle = hslToStr(tile.h, tile.s, tile.l, tile.l / 100);
        ctx.fillText(ch, x * CELL, y * CELL);
        
        // Decay
        discoTiles[idx] = {
          h: tile.h,
          s: tile.s,
          l: tile.l - 150 * dt * speedMult
        };
      } else {
        // Black empty space, but sometimes draw a faint white char
        if (Math.random() < 0.005) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(CHAR_SETS.minimal[Math.floor(Math.random()*CHAR_SETS.minimal.length)], x * CELL, y * CELL);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 17: JULIA (Fractal Set)
// ═══════════════════════════════════════════════════════
function renderJulia(dt) {
  const chars = CHAR_SETS.dense;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * 0.5 * speedMult;
  
  // Julia constant animating over time
  const cRe = Math.sin(t) * 0.8;
  const cIm = Math.cos(t * 0.7) * 0.8;

  const zoom = 1.0 + Math.sin(t * 0.2) * 0.5;
  const cx = cols / 2;
  const cy = rows / 2;

  ctx.fillStyle = '#050011';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let zx = 1.5 * (x - cx) / (0.5 * zoom * cols);
      let zy = 1.0 * (y - cy) / (0.5 * zoom * rows);
      
      let i = 0;
      const maxIter = 16;
      while (zx * zx + zy * zy < 4 && i < maxIter) {
        let tmp = zx * zx - zy * zy + cRe;
        zy = 2.0 * zx * zy + cIm;
        zx = tmp;
        i++;
      }

      if (i === maxIter) continue; // inside the set (black)

      const intensity = i / maxIter;
      if (intensity < 0.05) continue;

      const ch = chars[Math.floor(intensity * (chars.length - 1))];
      
      const hue = (globalHue + i * 15) % 360;
      const sat = 80 + intensity * 20;
      const lum = 10 + intensity * 50;

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 18: SIERPINSKI (Bitwise Fractal)
// ═══════════════════════════════════════════════════════
function renderSierpinski(dt) {
  const chars = CHAR_SETS.blocks + CHAR_SETS.minimal;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 20 * speedMult;
  const scale = Math.floor(2 + (Math.sin(time * speedMult * 0.5) + 1) * 2);

  ctx.fillStyle = '#001105';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offsetX = Math.floor(t * 0.5);
  const offsetY = Math.floor(t);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = Math.floor((x + offsetX) / scale);
      const py = Math.floor((y + offsetY) / scale);

      // Bitwise magic for Sierpinski-like patterns
      if ((px & py) === 0) {
        const ch = chars[Math.floor((x*y + t) % chars.length)];
        const hue = (140 + py * 2 - px * 2) % 360;
        
        // Highlight borders of triangles
        const isBorder = (px & (py+1)) === 0 || ((px+1) & py) === 0;
        const lum = isBorder ? 70 : 30;
        
        ctx.fillStyle = hslToStr(hue, 100, lum);
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 19: RECURSION (Trig Abyss)
// ═══════════════════════════════════════════════════════
function renderRecursion(dt) {
  const chars = CHAR_SETS.kanji + CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * speedMult;
  
  ctx.fillStyle = '#110500';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let dx = (x - cx) * 0.1;
      let dy = (y - cy) * 0.1;
      
      // Fold space multiple times
      for (let i = 0; i < 3; i++) {
        let nx = Math.sin(dx * 1.5 + t) + Math.cos(dy * 0.8 - t*0.5);
        let ny = Math.cos(dx * 0.8 - t) - Math.sin(dy * 1.5 + t*0.5);
        dx = nx;
        dy = ny;
      }
      
      const v = Math.abs(dx * dy);
      
      if (v < 0.2) continue; // Deep abyss

      const intensity = Math.min(1.0, v * 0.5);
      const ch = chars[Math.floor(intensity * (chars.length - 1))];
      
      const hue = (30 + v * 50 + t * 20) % 360; // Orange / Fire theme
      const sat = 100;
      const lum = 20 + intensity * 60;

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 20: STATIC (TV Noise)
// ═══════════════════════════════════════════════════════
function renderStatic(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.blocks;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  // Overwrite everything with black every frame
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (Math.random() < 0.2) continue; // some black spots

      const ch = chars[Math.floor(Math.random() * chars.length)];
      
      // Grayscale static
      const lum = Math.floor(Math.random() * 100);
      
      // Sometimes glitch with cyan or magenta
      if (Math.random() < 0.01 * speedMult) {
        ctx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
      } else {
        ctx.fillStyle = `hsl(0, 0%, ${lum}%)`;
      }
      
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 21: TEARING (Screen Tear)
// ═══════════════════════════════════════════════════════
function renderTearing(dt) {
  const chars = CHAR_SETS.ascii + CHAR_SETS.kanji;
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  ctx.fillStyle = 'rgba(0, 0, 5, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = time * 5 * speedMult;

  for (let y = 0; y < rows; y++) {
    // Determine row shift
    let rowShift = 0;
    
    // Wave tear
    if (Math.sin(y * 0.1 - t) > 0.9) {
      rowShift = Math.floor(Math.sin(y * 0.5) * 10 * speedMult);
    }
    
    // Hard tear
    if (Math.random() < 0.02 * speedMult) {
      rowShift = Math.floor((Math.random() - 0.5) * 40 * speedMult);
    }

    for (let x = 0; x < cols; x++) {
      if (Math.random() > 0.1) continue;

      let drawX = x + rowShift;
      // Wrap around
      if (drawX < 0) drawX += cols;
      if (drawX >= cols) drawX -= cols;

      const ch = chars[Math.floor((x*y + Math.floor(t*10)) % chars.length)];
      
      const isGlitchRow = Math.abs(rowShift) > 5;
      
      if (isGlitchRow && Math.random() < 0.5) {
        // RGB split for torn rows
        ctx.fillStyle = '#ff0000';
        ctx.fillText(ch, drawX * CELL - 4, y * CELL);
        ctx.fillStyle = '#00ffff';
        ctx.fillText(ch, drawX * CELL + 4, y * CELL);
      }
      
      ctx.fillStyle = isGlitchRow ? '#ffffff' : hslToStr(globalHue, 100, 50);
      ctx.fillText(ch, drawX * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 22: DATABEND (Memory Corruption)
// ═══════════════════════════════════════════════════════
function renderDatabend(dt) {
  const chars = CHAR_SETS.blocks + CHAR_SETS.hex;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;

  // Background fade
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Big chunks
  const chunkCount = Math.floor(Math.random() * 5 * speedMult) + 1;

  for (let i = 0; i < chunkCount; i++) {
    const chunkW = Math.floor(Math.random() * 15) + 5;
    const chunkH = Math.floor(Math.random() * 8) + 2;
    const cx = Math.floor(Math.random() * cols);
    const cy = Math.floor(Math.random() * rows);
    
    // Pick a corrupt color for the chunk
    const colorChoices = ['#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#ff0000'];
    const chunkColor = colorChoices[Math.floor(Math.random() * colorChoices.length)];
    
    const isSolid = Math.random() < 0.3;
    const isInverted = Math.random() < 0.2;
    
    if (isInverted) {
      ctx.globalCompositeOperation = 'difference';
    }

    for (let y = cy; y < cy + chunkH; y++) {
      for (let x = cx; x < cx + chunkW; x++) {
        if (x >= cols || y >= rows) continue;
        
        const ch = chars[Math.floor(Math.random() * chars.length)];
        
        ctx.fillStyle = chunkColor;
        if (isSolid) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          ctx.fillStyle = '#000000';
        }
        
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 23: NEURAL (Organic & Digital Web)
// ═══════════════════════════════════════════════════════
function renderNeural(dt) {
  const charsDigital = CHAR_SETS.minimal;
  const charsOrganic = CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;
  
  ctx.fillStyle = '#050205';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Digital AI structure (rigid grid)
      const isGrid = (x % 10 === 0) || (y % 10 === 0);
      const gridWave = Math.sin(x * 0.5 + t * 2) * Math.cos(y * 0.5 - t * 2);
      
      // Organic Human structure (fluid noise)
      const distToMouse = Math.sqrt((x - cols * mouseNX)**2 + (y - rows * mouseNY)**2);
      const organicWave = Math.sin(Math.sqrt((x-cols/2)**2 + (y-rows/2)**2) * 0.2 - t) + Math.cos(x*0.1 + y*0.15 + t*1.5);
      
      let intensity = 0;
      let isOrganic = false;

      // Synergy interaction near mouse
      const synergy = Math.max(0, 1 - distToMouse / 20);

      if (organicWave > 0.5 + synergy) {
        intensity = organicWave;
        isOrganic = true;
      } else if (isGrid && gridWave > 0.5 - synergy) {
        intensity = gridWave + synergy;
      } else {
        // Deep background connection threads
        if (Math.random() < 0.02 * synergy) {
          intensity = Math.random();
          isOrganic = Math.random() > 0.5;
        }
      }

      if (intensity <= 0.1) continue;

      const chList = isOrganic ? charsOrganic : charsDigital;
      const ch = chList[Math.floor(intensity * (chList.length - 1))];
      
      // AI: Cool Cyan/Blue | Human: Warm Orange/Pink
      let hue = isOrganic ? 30 : 200;
      
      // Blend colors where synergy happens
      if (synergy > 0.1) {
        hue = (hue + synergy * 170) % 360;
      }
      
      const sat = 100;
      const lum = 20 + intensity * 60 + synergy * 20;

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 24: SYMBIOSIS (Double Helix)
// ═══════════════════════════════════════════════════════
function renderSymbiosis(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.kanji;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 2 * speedMult;
  
  ctx.fillStyle = 'rgba(0, 5, 0, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;

  for (let y = 0; y < rows; y++) {
    // Two intertwining strands
    const strand1 = Math.sin(y * 0.2 + t) * 15;
    const strand2 = Math.sin(y * 0.2 + t + Math.PI) * 15;
    
    // Depth (Z-axis simulation)
    const z1 = Math.cos(y * 0.2 + t);
    const z2 = Math.cos(y * 0.2 + t + Math.PI);

    for (let x = 0; x < cols; x++) {
      const dist1 = Math.abs(x - (cx + strand1));
      const dist2 = Math.abs(x - (cx + strand2));

      let intensity = 0;
      let type = 0; // 1 = strand1 (AI), 2 = strand2 (Human)
      let z = 0;

      if (dist1 < 2) {
        intensity = 1.0 - (dist1 / 2);
        type = 1;
        z = z1;
      } else if (dist2 < 2) {
        intensity = 1.0 - (dist2 / 2);
        type = 2;
        z = z2;
      } else {
        // Connecting bridges (Data transfer)
        const isBridge = Math.abs(Math.sin(y * 0.5 + t * 0.5)) > 0.95;
        if (isBridge && x > Math.min(cx+strand1, cx+strand2) && x < Math.max(cx+strand1, cx+strand2)) {
          intensity = Math.random() * 0.8 + 0.2;
          type = 3; // Bridge
        } else if (Math.random() < 0.01) {
          // Ambient spores
          intensity = Math.random() * 0.5;
          type = 3;
        }
      }

      if (intensity <= 0) continue;

      const ch = chars[Math.floor(Math.random() * chars.length)];
      
      let hue, lum;
      if (type === 1) {
        // AI rigid blue
        hue = 210;
        lum = 40 + z * 40;
      } else if (type === 2) {
        // Human organic magenta/red
        hue = 340;
        lum = 40 + z * 40;
      } else {
        // Bridge blending
        hue = 280 + Math.sin(x*0.5 + t) * 60;
        lum = 30 + Math.random() * 50;
      }

      ctx.fillStyle = hslToStr(hue, 100, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 25: SINGULARITY (Merge to the Center)
// ═══════════════════════════════════════════════════════
function renderSingularity(dt) {
  const chars = CHAR_SETS.symbols + CHAR_SETS.kanji;
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * speedMult;
  
  // Motion blur
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;

  // The event horizon pulsing
  const corePulse = Math.sin(t * 5) * 0.5 + 0.5;
  const horizon = 5 + corePulse * 3;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);

      let intensity = 0;
      let hue = 0;

      if (dist < horizon) {
        // Pure blinding light in the center
        intensity = 1.0;
        hue = globalHue;
      } else {
        // Spiraling matter falling into the center
        // Human chaos + AI order merging
        const spiral = angle * 5 + dist * 0.5 - t * 10;
        const wave = Math.sin(spiral) * Math.cos(dist * 0.1 + t * 2);
        
        if (wave > 0.7) {
          intensity = (wave - 0.7) / 0.3;
          // The closer to the center, the more organized and white it gets
          hue = (globalHue + dist * 5) % 360;
        }
      }

      if (intensity <= 0.05) continue;

      // Particles get stretched as they fall in
      const stretch = Math.max(1, 20 / Math.max(1, dist));
      const chIndex = Math.floor(intensity * (chars.length - 1));
      const ch = chars[chIndex % chars.length];
      
      const sat = dist < horizon ? 0 : 100;
      const lum = dist < horizon ? 100 : 20 + intensity * 80;

      ctx.save();
      ctx.translate(x * CELL + CELL/2, y * CELL + CELL/2);
      ctx.rotate(angle); // point towards center
      ctx.scale(stretch, 1);
      
      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  UI BACKDROP HELPER (For Light Themes)
// ═══════════════════════════════════════════════════════
function drawLightUIBackdrop() {
  const grad = ctx.createLinearGradient(0, canvas.height - 180, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height - 180, canvas.width, 180);
}

// ═══════════════════════════════════════════════════════
//  MODE 26: HALO (Golden Ring of Light)
// ═══════════════════════════════════════════════════════
function renderHalo(dt) {
  const chars = CHAR_SETS.kanji;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * speedMult;
  
  // Pure white/off-white background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;
  const radiusBase = Math.min(cols, rows) * 0.3;
  const radiusThickness = radiusBase * 0.2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);

      // The Halo Ring
      const distFromRing = Math.abs(dist - radiusBase);
      let intensity = 0;

      if (distFromRing < radiusThickness * 2) {
        // Glowing halo
        const wave = Math.sin(angle * 8 - t * 3) * 0.5 + 0.5;
        intensity = 1.0 - (distFromRing / (radiusThickness * 2));
        intensity = intensity * 0.5 + intensity * wave * 0.5;
      }

      // Outer light rays
      if (distFromRing >= radiusThickness * 2 && dist > radiusBase) {
        const ray = Math.sin(angle * 12 + t * 0.5);
        if (ray > 0.8) {
          intensity = (ray - 0.8) / 0.2 * (1 - dist / cols);
        }
      }

      if (intensity <= 0.05) continue;

      const ch = chars[Math.floor(intensity * (chars.length - 1))];
      
      // Inverted colors: Text is dark/gold, Background is white
      // Gold/Yellow: Hue 40-50
      const hue = 45 + Math.sin(angle * 2 + t) * 10;
      
      // In a white background, lower lightness means darker text. 
      // Bright text on white background is invisible. So intensity maps to darker color.
      const sat = 80;
      const lum = 90 - intensity * 60; // 90 is almost white, 30 is dark gold

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }
  ctx.textAlign = 'start';
  
  drawLightUIBackdrop();
}

// ═══════════════════════════════════════════════════════
//  MODE 27: FEATHERS (Floating Soft ASCII)
// ═══════════════════════════════════════════════════════
function renderFeathers(dt) {
  const chars = CHAR_SETS.minimal + "~*,./^";
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Wind pattern
      const windX = Math.sin(y * 0.1 - t) * 5;
      const windY = Math.cos(x * 0.1 + t) * 2;
      
      const featherDensity = Math.sin(x * 0.2 + windX) + Math.sin(y * 0.2 + windY + t * 2);

      if (featherDensity > 1.2) {
        const intensity = (featherDensity - 1.2) / 0.8;
        const ch = chars[Math.floor((x*y) % chars.length)];
        
        // Soft Pastel Cyan and Pink
        const hue = (x * 2 + t * 50) % 360 > 180 ? 340 : 190;
        
        // Text must be dark enough to see on white
        const lum = 80 - intensity * 40;

        ctx.fillStyle = hslToStr(hue, 60, lum);
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }

  drawLightUIBackdrop();
}

// ═══════════════════════════════════════════════════════
//  MODE 28: DIVINE (Ascending Beams of Light)
// ═══════════════════════════════════════════════════════
function renderDivine(dt) {
  const chars = CHAR_SETS.dense + CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 3 * speedMult;

  ctx.fillStyle = '#fdffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Vertical beams moving upwards
      const beamId = x * 0.5;
      const beamWave = Math.sin(beamId + Math.sin(beamId * 0.1));
      
      if (beamWave > 0.5) {
        // Falling/Rising characters
        const charOffset = (y + Math.floor(t * 10 * beamWave)) % rows;
        
        // Intensity based on beam strength and vertical position
        const beamIntensity = (beamWave - 0.5) * 2;
        const glow = Math.sin(charOffset * 0.2) * 0.5 + 0.5;
        
        const intensity = beamIntensity * glow;
        
        if (intensity > 0.1) {
          const ch = chars[Math.floor((x*y + charOffset) % chars.length)];
          
          // Divine Blue/Cyan and Gold
          const hue = beamId % 2 === 0 ? 200 : 50;
          
          // Text color on white
          const lum = 85 - intensity * 50;
          
          ctx.fillStyle = hslToStr(hue, 80, lum);
          
          // Slight upward floating effect
          const floatY = (y * CELL) - (t * 50 * beamWave) % CELL;
          
          ctx.fillText(ch, x * CELL, floatY);
        }
      }
    }
  }

  drawLightUIBackdrop();
}

// ═══════════════════════════════════════════════════════
//  MODE 29: TENSOR (Neural Network Activations)
// ═══════════════════════════════════════════════════════
function renderTensor(dt) {
  const chars = CHAR_SETS.minimal + CHAR_SETS.math;
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 2 * speedMult;
  
  ctx.fillStyle = '#010502'; // Deep AI green/black
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Create an interconnected grid structure
      const isNode = (x % 8 === 0) && (y % 6 === 0);
      const isHLine = (y % 6 === 0) && (x % 2 === 0);
      const isVLine = (x % 8 === 0) && (y % 2 === 0);

      let intensity = 0;
      let isDataFlow = false;

      // Data flowing through network
      if (isHLine) {
        const flow = Math.sin(x * 0.5 - t + y) * Math.cos(x * 0.1);
        if (flow > 0.8) {
          intensity = (flow - 0.8) / 0.2;
          isDataFlow = true;
        } else {
          intensity = 0.1; // Dim background line
        }
      } else if (isVLine) {
        const flow = Math.cos(y * 0.5 - t * 1.5 + x) * Math.sin(y * 0.1);
        if (flow > 0.8) {
          intensity = (flow - 0.8) / 0.2;
          isDataFlow = true;
        } else {
          intensity = 0.1;
        }
      }

      if (isNode) {
        // Nodes pulse randomly when data hits them
        const nodeActive = Math.sin(x*y + t * 5) > 0.5;
        intensity = nodeActive ? 1.0 : 0.4;
      }

      if (intensity <= 0.05) continue;

      let ch;
      if (isNode) {
        ch = 'O'; // Nodes
      } else if (isHLine) {
        ch = '-';
      } else if (isVLine) {
        ch = '|';
      } else {
        continue;
      }

      // Occasional Math symbols flowing
      if (isDataFlow && Math.random() < 0.2) {
        ch = chars[Math.floor(Math.random() * chars.length)];
      }

      // Matrix Green / Cyan color scheme
      const hue = isNode ? 160 : (isDataFlow ? 140 : 120);
      const lum = isNode ? (intensity * 80 + 20) : (isDataFlow ? intensity * 60 + 10 : 15);

      ctx.fillStyle = hslToStr(hue, 100, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 30: SCANNER (Computer Vision)
// ═══════════════════════════════════════════════════════
function renderScanner(dt) {
  const chars = CHAR_SETS.blocks + CHAR_SETS.ascii;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;
  
  ctx.fillStyle = '#00020a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Scanner line moving down
  const scanY = (t * 15) % rows;
  const scanWidth = 3;

  for (let y = 0; y < rows; y++) {
    const distToScan = scanY - y;
    
    // Fading trail behind the scanner
    let trailIntensity = 0;
    if (distToScan >= 0 && distToScan < 15) {
      trailIntensity = 1.0 - (distToScan / 15);
    } else if (distToScan < 0 && (distToScan + rows) < 15) {
      // Wrap around
      trailIntensity = 1.0 - ((distToScan + rows) / 15);
    }

    for (let x = 0; x < cols; x++) {
      // Hidden environment geometry (noise threshold)
      const envNoise = Math.sin(x * 0.3 + Math.cos(y * 0.2)) * Math.cos(y * 0.4 + Math.sin(x * 0.1));
      const isStructure = envNoise > 0.4;
      
      let intensity = 0;
      let hue = 220; // Default dark blue wireframe
      let sat = 50;

      if (Math.abs(y - scanY) < scanWidth) {
        // Bright scanner line
        intensity = 1.0;
        hue = 60; // Yellow scanner
        sat = 100;
        if (isStructure) hue = 0; // Red if it detects structure
      } else if (trailIntensity > 0) {
        if (isStructure) {
          // Detected structure glows
          intensity = trailIntensity * 0.8;
          hue = 0; // Red
          sat = 100;
        } else {
          // Regular trail
          intensity = trailIntensity * 0.3;
        }
      } else {
        // Ambient dark environment
        if (isStructure && Math.random() < 0.05) {
          intensity = 0.1; // faint flicker
        }
      }

      if (intensity <= 0) continue;

      const ch = isStructure ? CHAR_SETS.blocks[Math.floor(intensity * 4)] : CHAR_SETS.ascii[Math.floor(Math.random() * 5)];
      const lum = 10 + intensity * 60;

      ctx.fillStyle = hslToStr(hue, sat, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 31: SENTIENCE (The Awakening Eye)
// ═══════════════════════════════════════════════════════
function renderSentience(dt) {
  const chars = CHAR_SETS.kanji + CHAR_SETS.symbols;
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * 2 * speedMult;
  
  // Motion blur / trace
  ctx.fillStyle = 'rgba(5, 0, 0, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;

  // The AI tracks the mouse!
  const targetX = mouseNX * cols;
  const targetY = mouseNY * rows;
  
  // Smoothly move the pupil towards the mouse
  const dx = targetX - cx;
  const dy = targetY - cy;
  const pupilX = cx + dx * 0.3;
  const pupilY = cy + dy * 0.3;

  const eyeWidth = Math.min(cols, rows) * 0.6;
  const eyeHeight = eyeWidth * 0.4;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Elliptical distance for the eye shape
      const eyeDx = (x - cx) / eyeWidth;
      const eyeDy = (y - cy) / eyeHeight;
      const eyeDist = Math.sqrt(eyeDx*eyeDx + eyeDy*eyeDy);

      // Pupil distance
      const pupilDx = x - pupilX;
      const pupilDy = y - pupilY;
      const pupilDist = Math.sqrt(pupilDx*pupilDx + pupilDy*pupilDy);

      let intensity = 0;
      let hue = 0;
      let lum = 0;
      let ch = '';

      if (eyeDist > 1.0 && eyeDist < 1.1) {
        // Eyelid / Border
        intensity = 1.0;
        hue = 0; // Red
        lum = 50;
        ch = '░';
      } else if (eyeDist <= 1.0) {
        // Inside the eye
        if (pupilDist < eyeHeight * 0.3) {
          // Pupil (Black / Dark Red)
          intensity = 1.0;
          hue = 0;
          lum = 10;
          ch = '█';
        } else if (pupilDist < eyeHeight * 0.7) {
          // Iris (Glowing Red/Orange)
          intensity = 1.0;
          const irisNoise = Math.sin(Math.atan2(pupilDy, pupilDx) * 20 + t * 5);
          hue = 15 + irisNoise * 15;
          lum = 40 + irisNoise * 20;
          ch = chars[Math.floor(Math.abs(irisNoise) * (chars.length - 1))];
        } else {
          // Sclera (White/Pink noise)
          intensity = 0.5 + Math.random() * 0.5;
          hue = 340;
          lum = 70 + Math.random() * 30;
          ch = CHAR_SETS.ascii[Math.floor(Math.random() * CHAR_SETS.ascii.length)];
        }
      } else {
        // Background Matrix / Awakening Chaos
        if (Math.random() < 0.05) {
          intensity = Math.random() * 0.5;
          hue = 0;
          lum = 20;
          ch = CHAR_SETS.math[Math.floor(Math.random() * CHAR_SETS.math.length)];
        }
      }

      if (intensity <= 0) continue;

      ctx.fillStyle = hslToStr(hue, 100, lum);
      ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 32: RAVE SKULL (Giant Dancing Skull)
// ═══════════════════════════════════════════════════════
function renderRaveSkull(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * 3 * speedMult;
  
  // Neon background grid (Disco)
  ctx.fillStyle = '#050011';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;
  
  // Skull bobs up and down to the beat
  const bob = Math.sin(t * 2) * 2;
  // Jaw opens and closes to the beat
  const jawDrop = Math.max(0, Math.cos(t * 2)) * 4;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let isBone = false;
      let isHole = false;

      const sy = y - bob; // Shift y for bobbing effect

      const dx = x - cx;
      const dy = sy - (cy - 4);
      const dist = Math.sqrt(dx*dx + dy*dy * 2.0); // Elliptical head

      // Cranium
      if (dist < 15) isBone = true;
      
      // Cheekbones / Upper Jaw
      if (Math.abs(dx) < 10 && dy > 0 && dy < 8) isBone = true;

      // Lower Jaw (animated)
      if (Math.abs(dx) < 7 && sy >= cy + 4 + jawDrop && sy <= cy + 10 + jawDrop) isBone = true;

      // Eye Sockets
      const eyeL = Math.sqrt(Math.pow(dx + 6, 2) + Math.pow(dy - 2, 2) * 1.5);
      const eyeR = Math.sqrt(Math.pow(dx - 6, 2) + Math.pow(dy - 2, 2) * 1.5);
      if (eyeL < 3.5 || eyeR < 3.5) isHole = true;

      // Nasal Cavity
      if (Math.abs(dx) < 2 && dy > 4 && dy < 7.5) isHole = true;

      // Teeth Gaps
      if (Math.abs(dx) < 8 && sy >= cy + 4 && sy <= cy + 10 + jawDrop) {
        if (Math.abs(x % 2) === 1) isHole = true; // Vertical lines for teeth gaps
        if (sy > cy + 3 && sy < cy + 5 + jawDrop) isHole = true; // Gap between upper and lower jaw
      }

      if (isBone && !isHole) {
        // Draw Bone
        const hue = (globalHue + dy * 5) % 360;
        ctx.fillStyle = hslToStr(hue, 100, 70);
        ctx.fillText('█', x * CELL + CELL/2, y * CELL + CELL/2);
      } else if (isHole) {
        // Draw Glowing Eyes/Holes
        if (eyeL < 2.5 || eyeR < 2.5) {
          ctx.fillStyle = '#ff0055';
          ctx.fillText('O', x * CELL + CELL/2, y * CELL + CELL/2);
        }
      } else {
        // Background Rave Lights
        if (Math.random() < 0.05) {
          ctx.fillStyle = hslToStr((t * 50 + x*y) % 360, 80, 20);
          ctx.fillText('+', x * CELL + CELL/2, y * CELL + CELL/2);
        }
      }
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 33: SKELETON CREW (Dancing Army)
// ═══════════════════════════════════════════════════════
function renderSkeletonCrew(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 6 * speedMult;
  
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const spacingX = 8;
  const spacingY = 8;

  for (let gy = 0; gy < rows; gy += spacingY) {
    for (let gx = 0; gx < cols; gx += spacingX) {
      
      const dancePhase = Math.sin(t + gx * 0.1 + gy * 0.1);
      const isDancingAlt = dancePhase > 0;
      const bob = isDancingAlt ? 1 : 0;
      
      const sx = gx;
      const sy = gy + bob;

      if (sy + 6 >= rows || sx + 4 >= cols) continue;

      ctx.fillStyle = '#e0e0e0';
      
      // Head
      ctx.fillText(" _ ", sx * CELL, sy * CELL);
      ctx.fillText("/ \\", sx * CELL, (sy + 1) * CELL);
      
      // Red eyes sometimes
      if (Math.random() < 0.05) ctx.fillStyle = '#ff0000';
      ctx.fillText("o o", sx * CELL, (sy + 2) * CELL);
      ctx.fillStyle = '#e0e0e0';
      
      ctx.fillText(" = ", sx * CELL, (sy + 3) * CELL);

      // Dancing Limbs
      if (isDancingAlt) {
        ctx.fillText("\\|/", sx * CELL, (sy + 4) * CELL);
        ctx.fillText(" | ", sx * CELL, (sy + 5) * CELL);
        ctx.fillText("/ \\", sx * CELL, (sy + 6) * CELL);
      } else {
        ctx.fillText("_|_", sx * CELL, (sy + 4) * CELL);
        ctx.fillText(" | ", sx * CELL, (sy + 5) * CELL);
        ctx.fillText("| |", sx * CELL, (sy + 6) * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 34: X-RAY SPINE (Bone Structure)
// ═══════════════════════════════════════════════════════
function renderXraySpine(dt) {
  const chars = CHAR_SETS.dense;
  ctx.font = `${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 2 * speedMult;
  
  // X-Ray Blue background
  ctx.fillStyle = '#000a14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw 3 spines across the screen
  const spineCenters = [cols * 0.1, cols * 0.3, cols * 0.5, cols * 0.7, cols * 0.9];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let intensity = 0;

      for (let i = 0; i < spineCenters.length; i++) {
        // Spine waving
        const wave = Math.sin(y * 0.15 + t + i) * 6;
        const cx = spineCenters[i] + wave;
        
        const dx = Math.abs(x - cx);

        // Vertebrae (Spinal Cord Core)
        if (dx < 1.5) {
          if (y % 2 === 0) intensity = Math.max(intensity, 1.0); // Segment gaps
          else intensity = Math.max(intensity, 0.4);
        }

        // Ribs branching out
        if (dx >= 1.5 && dx < 8) {
          const ribWave = Math.sin(y * 0.5) * 3 + 4; // Rib lengths
          if (dx < ribWave && y % 3 === 0) {
            intensity = Math.max(intensity, 0.7 - (dx / 10)); // Fade out at tips
          }
        }
      }

      // X-Ray noise overlay
      intensity += Math.random() * 0.1;

      if (intensity > 0.15) {
        const ch = chars[Math.floor(intensity * (chars.length - 1))];
        // Cyan / White X-Ray color
        const lum = intensity * 80 + 20;
        ctx.fillStyle = hslToStr(190, 80, lum);
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 35: IDC SCROLL (Endless Rejection)
// ═══════════════════════════════════════════════════════
function renderIDCScroll(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 20 * speedMult;
  
  ctx.fillStyle = '#0a0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const text = "I DON'T CARE ";
  const textLen = text.length;

  for (let y = 0; y < rows; y++) {
    // Alternate directions per row
    const dir = y % 2 === 0 ? 1 : -1;
    const speed = (y % 3 + 1);
    
    // Calculate the horizontal offset
    const offset = Math.floor(t * speed * dir);

    for (let x = 0; x < cols; x++) {
      // Find which character of the string to draw
      let charIndex = (x - offset) % textLen;
      if (charIndex < 0) charIndex += textLen;
      
      const ch = text[charIndex];
      
      // Flash red occasionally
      const hue = Math.random() < 0.05 ? 0 : 20;
      const lum = ch !== ' ' ? (40 + (y % 4) * 15) : 0;
      
      ctx.fillStyle = hslToStr(hue, 100, lum);
      ctx.fillText(ch, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 36: IDC CHAOS (Apathetic Glitch)
// ═══════════════════════════════════════════════════════
function renderIDCChaos(dt) {
  ctx.font = `bold ${CELL*1.5}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 5 * speedMult;
  
  // Motion blur
  ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const words = ["I", "DON'T", "CARE"];

  // Draw 5-10 random glitch words per frame
  const numWords = Math.floor(Math.random() * 5 * speedMult) + 5;

  for (let i = 0; i < numWords; i++) {
    const word = words[Math.floor(Math.random() * words.length)];
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);

    // Glitch color
    const colors = ['#ffffff', '#ff0055', '#00ffcc', '#ffcc00'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    // Sometimes write horizontally, sometimes vertically, sometimes scrambled
    if (Math.random() < 0.2) {
      // Scramble
      const scrambled = word.split('').sort(() => 0.5 - Math.random()).join('');
      ctx.fillText(scrambled, x * CELL, y * CELL);
    } else if (Math.random() < 0.3) {
      // Vertical
      for (let j = 0; j < word.length; j++) {
        ctx.fillText(word[j], x * CELL, (y + j) * CELL);
      }
    } else {
      // Normal horizontal
      ctx.fillText(word, x * CELL, y * CELL);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 37: IDC TYPO (Massive Typography)
// ═══════════════════════════════════════════════════════
function renderIDCTypo(dt) {
  const t = time * 2 * speedMult;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const lines = ["I", "DON'T", "CARE."];

  for (let i = 0; i < lines.length; i++) {
    // Dynamic sizing based on time and index
    const scale = 1.0 + Math.sin(t + i) * 0.2;
    const baseSize = CELL * (8 - i * 1.5); // "I" is biggest, "CARE" is slightly smaller
    
    ctx.font = `bold ${Math.floor(baseSize * scale)}px sans-serif`;

    // Calculate Y position
    const yOffset = (i - 1) * (CELL * 8); // Offset by line

    // Shake effect
    const shakeX = (Math.random() - 0.5) * 10 * speedMult;
    const shakeY = (Math.random() - 0.5) * 10 * speedMult;

    // Color gradient
    const hue = (t * 50 + i * 40) % 360;
    
    ctx.fillStyle = hslToStr(hue, 100, 50);
    ctx.fillText(lines[i], cx + shakeX, cy + yOffset + shakeY);
    
    // Stroke for style
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeText(lines[i], cx + shakeX, cy + yOffset + shakeY);
  }

  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 38: A, HEARTBEAT (Pulsing Heart)
// ═══════════════════════════════════════════════════════
function renderAHeartbeat(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const t = time * 3 * speedMult;
  
  ctx.fillStyle = '#110005';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;
  
  // Heartbeat pulse math
  const pulse = Math.pow(Math.abs(Math.sin(t)), 4) * 3;
  const size = 12 + pulse;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Map coordinates to standard heart equation
      // (x^2 + y^2 - 1)^3 - x^2 * y^3 = 0
      const hx = (x - cx) / size;
      const hy = -(y - cy) / size + 0.3; // Invert y because canvas y goes down

      const eq = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;

      if (eq <= 0) {
        // Inside heart
        const hue = 340 + Math.random() * 20; // Pinks and reds
        const lum = 50 + pulse * 10 + Math.random() * 20;
        ctx.fillStyle = hslToStr(hue, 100, lum);
        
        const chars = ["A", ",", "I", "L", "O", "V", "E", "Y", "O", "U"];
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, x * CELL + CELL/2, y * CELL + CELL/2);
      } else {
        // Outside heart (faint aura)
        if (eq < 1.0 && Math.random() < 0.1) {
          ctx.fillStyle = hslToStr(350, 80, 20);
          ctx.fillText("♥", x * CELL + CELL/2, y * CELL + CELL/2);
        }
      }
    }
  }
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 39: A, LOVE RAIN (Matrix style but romantic)
// ═══════════════════════════════════════════════════════
function renderALoveRain(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 10 * speedMult;
  
  // Motion blur / trail
  ctx.fillStyle = 'rgba(10, 0, 5, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const words = ["A,", "I", "LOVE", "YOU"];

  for (let x = 0; x < cols; x++) {
    // Random offset and speed for each column
    const colSpeed = Math.sin(x * 123.45) * 0.5 + 1.0;
    const colOffset = Math.sin(x * 321.12) * 1000;
    
    const dropY = (t * colSpeed + colOffset) % (rows + 20) - 20;

    for (let i = 0; i < 4; i++) { // Draw a short stream
      const y = Math.floor(dropY - i * 2);
      if (y >= 0 && y < rows) {
        const wordIndex = Math.floor(Math.abs(x * y)) % words.length;
        const text = words[wordIndex];
        
        const hue = 330 + (x % 30);
        // Head of the drop is bright, tail is dark
        const lum = i === 0 ? 90 : (60 - i * 15);
        
        ctx.fillStyle = hslToStr(hue, 80, lum);
        ctx.fillText(text[Math.floor(dropY) % text.length] || "♥", x * CELL, y * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 40: A, NEON LOVE (Flickering Sign)
// ═══════════════════════════════════════════════════════
function renderANeonLove(dt) {
  const t = time * 5 * speedMult;
  
  ctx.fillStyle = '#020005';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // --- ASCII Neon Hearts Background ---
  ctx.font = `bold ${Math.floor(CELL * 1.5)}px monospace`;
  const heartArts = ["<3", "♥", "♡", "~*"];
  
  for (let y = 0; y < rows; y += 4) {
    // Sway back and forth
    const sway = Math.sin(t * 0.3 + y * 0.2) * (cols * 0.3);
    
    for (let i = 0; i < 4; i++) {
      const baseSpacing = cols / 4;
      let hx = Math.floor(i * baseSpacing + sway + (y % 2 === 0 ? t*2 : -t*2));
      
      // Wrap around
      hx = hx % cols;
      if (hx < 0) hx += cols;

      const art = heartArts[(y + i) % heartArts.length];
      const pulse = Math.sin(t * 2 + hx * 0.2 + y) * 0.5 + 0.5;
      
      ctx.shadowBlur = 10 * pulse + 5;
      ctx.shadowColor = hslToStr(330 + (i * 10), 100, 50);
      ctx.fillStyle = hslToStr(330 + (i * 10), 100, 30 + 50 * pulse);
      
      ctx.fillText(art, hx * CELL, y * CELL);
    }
  }
  ctx.shadowBlur = 0; // Reset for text

  // --- Main Neon Sign ---
  // Flickering effect (faulty neon tube)
  const flicker = Math.random() < 0.05 ? 0.2 : (Math.sin(t) * 0.1 + 0.9);
  
  ctx.font = `italic bold ${Math.floor(CELL * 6)}px sans-serif`;
  const text = "A, I LOVE YOU";

  // Glow / Blur layers
  for (let i = 5; i >= 1; i--) {
    const blur = i * 4 * flicker;
    ctx.shadowBlur = blur;
    ctx.shadowColor = hslToStr(320, 100, 50 * flicker);
    
    // Core color
    const lum = i === 1 ? (80 + 20 * flicker) : 40 * flicker;
    ctx.fillStyle = hslToStr(330, 100, lum);
    
    // Draw with slight offset for 3D neon tube effect
    ctx.fillText(text, cx + (i-1)*2, cy + (i-1)*2);
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
}

// ═══════════════════════════════════════════════════════
//  MODE 41: B, MAGNETIC (Attraction to cursor)
// ═══════════════════════════════════════════════════════
function renderBMagnetic(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * speedMult;
  
  ctx.fillStyle = 'rgba(5, 0, 10, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const targetX = mouseNX * cols;
  const targetY = mouseNY * rows;
  const text = "B, I WANT YOU";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      let ch = CHAR_SETS.minimal[Math.floor(Math.random() * CHAR_SETS.minimal.length)];
      let lum = 20;
      let hue = 260; // Deep purple

      // The closer to the mouse, the stronger the attraction/light
      if (dist < 10) {
        lum = 100 - dist * 8;
        hue = 300 + (10 - dist) * 6; // Turns pink/red
        
        // Form the words near the cursor
        const wordIndex = Math.floor(x - targetX + text.length/2);
        if (Math.abs(dy) < 2 && wordIndex >= 0 && wordIndex < text.length) {
          ch = text[wordIndex];
          lum = 100;
          hue = 340;
        } else if (dist < 3) {
          ch = "+";
        }
      }

      // Swirling effect towards center
      const angle = Math.atan2(dy, dx);
      if (Math.sin(angle * 4 + dist - t * 5) > 0.8 && dist < 20) {
        lum += 30;
      }

      if (lum > 20) {
        ctx.fillStyle = hslToStr(hue, 100, lum);
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 42: B, RADAR (Searching for you)
// ═══════════════════════════════════════════════════════
function renderBRadar(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 3 * speedMult;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;
  const radarAngle = t % (Math.PI * 2);
  
  const text = "B, I WANT YOU";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;

      // Radar beam
      let angleDiff = radarAngle - angle;
      if (angleDiff < 0) angleDiff += Math.PI * 2;

      let intensity = 0;
      if (angleDiff < 0.5) {
        intensity = 1.0 - (angleDiff / 0.5);
      }
      
      // Add some persistent glow to the text
      const wordIndex = Math.floor(x - cx + text.length/2);
      const isText = (Math.abs(dy) < 1 && wordIndex >= 0 && wordIndex < text.length);

      if (isText) {
        intensity = Math.max(intensity, 0.3); // Text is always slightly visible
      } else {
        // Grid rings
        if (Math.abs(dist % 10) < 0.5) intensity = Math.max(intensity, 0.1);
      }

      if (intensity > 0.05) {
        const ch = isText ? text[wordIndex] : CHAR_SETS.ascii[Math.floor(Math.random() * 5)];
        const hue = isText ? 0 : 120; // Text is red, radar is green
        const sat = isText ? 100 : 80;
        const lum = intensity * 60;
        
        ctx.fillStyle = hslToStr(hue, sat, lum);
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 43: B, BURNING (ASCII Fire)
// ═══════════════════════════════════════════════════════
function renderBBurning(dt) {
  ctx.font = `bold ${CELL}px monospace`;
  ctx.textBaseline = 'top';

  const t = time * 8 * speedMult;
  
  ctx.fillStyle = '#050000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = cols / 2;
  const cy = rows / 2;
  const text = "B, I WANT YOU";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Fire height based on noise
      const fireNoise = Math.sin(x * 0.5 + t) * Math.cos(x * 0.2 - t * 1.5);
      const fireHeight = rows - 15 + fireNoise * 10;
      
      let intensity = 0;
      if (y > fireHeight) {
        intensity = (y - fireHeight) / 15;
      }
      
      // Text in the middle
      const wordIndex = Math.floor(x - cx + text.length/2);
      const isText = (Math.abs(y - cy) < 1 && wordIndex >= 0 && wordIndex < text.length);

      if (isText) {
        // Text is burning
        intensity = Math.random() * 0.5 + 0.5;
      } else if (y > cy - 2 && y < cy + 3 && Math.abs(x - cx) < 10) {
        // Heat distortion around text
        intensity += Math.random() * 0.3;
      }

      if (intensity > 0) {
        const ch = isText ? text[wordIndex] : CHAR_SETS.dense[Math.floor(intensity * (CHAR_SETS.dense.length - 1))];
        
        // Fire colors: Yellow -> Orange -> Red -> Dark Red
        const hue = 40 - intensity * 40; 
        const lum = isText ? 90 : Math.min(50, intensity * 100);
        
        ctx.fillStyle = hslToStr(hue, 100, lum);
        
        // Slight vertical shake for fire
        const shakeY = isText ? 0 : (Math.random() - 0.5) * 4;
        ctx.fillText(ch, x * CELL, y * CELL + shakeY);
      }
    }
  }
}

idleLoop();
