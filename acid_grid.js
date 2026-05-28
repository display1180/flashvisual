// ═══════════════════════════════════════════════════════
//  ACID GRID — Audio Reactive 3D Terrain  (v2: 성능 최적화)
//  Max Cooper "Symphony in Acid" 스타일
//  3가지 렌더링 모드: Wireframe / Point Cloud / ASCII
// ═══════════════════════════════════════════════════════

// ── 격자(Terrain) 설정 ── (성능 최적화: 셀 크기 ↑, 총 셀 수 ↓)
let cols, rows;
const SCL = 50;          // 격자 한 칸 크기 (30→50)
const W   = 2000;        // 전체 지형 가로폭 (2400→2000)
const H   = 1400;        // 전체 지형 세로폭 (1800→1400)
let flying  = 0;
let terrain = [];        // Float32Array 기반 1D 배열로 변경

// ── 오디오 ──
let song, fft;
let isStarted = false;

// ── 시각 모드 ──
let renderMode = 0;      // 0: Wireframe, 1: Point Cloud, 2: ASCII
const asciiChars = " .:-=+*#%@";

// ── 에너지 스무딩 ──
let sBass = 0, sMid = 0, sHigh = 0, sTreble = 0;

// ── 카메라 회전 ──
let camRotX = 0.85, camRotY = 0;

// ── HUD 갱신 카운터 (매 프레임 DOM 접근 방지) ──
let hudFrame = 0;
let hudBassEl, hudMidEl, hudHighEl;

// ═══════════════════════════════════════════════════════
function preload() {
  song = loadSound('Hiroshi Yoshimura - CREEK.mp3');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  // Retina 디스플레이 성능 최적화: 픽셀 밀도 고정
  pixelDensity(1);
  
  cols = Math.floor(W / SCL);
  rows = Math.floor(H / SCL);
  
  // 1D Flat 배열 (2D 인덱싱보다 캐시 친화적)
  terrain = new Float32Array(cols * rows);
  
  // FFT 분석기 (bin 수를 64로 줄여 연산 절감)
  fft = new p5.FFT(0.88, 64);

  // HUD DOM 요소 캐싱 (매 프레임 getElementById 방지)
  hudBassEl = document.getElementById('hud-bass');
  hudMidEl  = document.getElementById('hud-mid');
  hudHighEl = document.getElementById('hud-high');

  // ── UI 연결 ──
  document.getElementById('start-btn').addEventListener('click', startExperience);
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderMode = parseInt(btn.dataset.mode);
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const names = ['WIREFRAME', 'POINT CLOUD', 'ASCII'];
      document.getElementById('hud-mode').textContent = names[renderMode];
    });
  });
}

function startExperience() {
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loading-text').style.display = 'block';
  
  userStartAudio().then(() => {
    song.loop();
    isStarted = true;
    
    let overlay = document.getElementById('start-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 1000);
    
    document.getElementById('hud').classList.add('visible');
    document.getElementById('mode-panel').classList.add('visible');
  });
}

// ═══════════════════════════════════════════════════════
//  DRAW LOOP
// ═══════════════════════════════════════════════════════
function draw() {
  if (!isStarted) {
    background(5, 5, 8);
    return;
  }
  
  // ── 오디오 분석 ──
  fft.analyze();
  let rawBass   = fft.getEnergy("bass");
  let rawMid    = fft.getEnergy("mid");
  let rawHigh   = fft.getEnergy("highMid");
  let rawTreble = fft.getEnergy("treble");
  
  // 부드러운 에너지 보간
  sBass   = lerp(sBass,   rawBass,   0.12);
  sMid    = lerp(sMid,    rawMid,    0.10);
  sHigh   = lerp(sHigh,   rawHigh,   0.08);
  sTreble = lerp(sTreble, rawTreble, 0.06);
  
  // HUD 갱신: 6프레임마다 한 번 (DOM 접근 최소화)
  if (++hudFrame % 6 === 0) {
    hudBassEl.textContent = Math.floor(sBass);
    hudMidEl.textContent  = Math.floor(sMid);
    hudHighEl.textContent = Math.floor(sHigh);
  }
  
  // ── 배경 ──
  background(5 + sBass * 0.02, 5 + sBass * 0.01, 8 + sBass * 0.04);
  
  // ── 지형 높이맵 업데이트 ──
  let speed = map(sBass, 0, 255, 0.02, 0.10);
  flying -= speed;
  
  let dynamicHeight = map(sBass, 0, 255, 40, 300);
  let noiseStep     = map(sMid, 0, 255, 0.08, 0.16);
  
  let yoff = flying;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    let rowBase = y * cols;
    for (let x = 0; x < cols; x++) {
      terrain[rowBase + x] = map(noise(xoff, yoff), 0, 1, -dynamicHeight, dynamicHeight);
      xoff += noiseStep;
    }
    yoff += noiseStep;
  }
  
  // ── 카메라 ──
  let targetRotY = map(mouseX, 0, width, -0.25, 0.25);
  let targetRotX = map(mouseY, 0, height, 0.55, 1.15);
  camRotY = lerp(camRotY, targetRotY, 0.03);
  camRotX = lerp(camRotX, targetRotX, 0.03);
  
  rotateX(camRotX);
  rotateY(camRotY);
  translate(-W / 2, -H / 2 + 100, -200);
  
  // ── 렌더링 ──
  switch (renderMode) {
    case 0: drawWireframe();    break;
    case 1: drawPointCloud();   break;
    case 2: drawAsciiTerrain(); break;
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 0: WIREFRAME
//  최적화: 행(row) 단위 단일 stroke 설정, strokeWeight 고정
// ═══════════════════════════════════════════════════════
function drawWireframe() {
  noFill();
  strokeWeight(1);
  
  for (let y = 0; y < rows - 1; y++) {
    // 행 전체에 대해 대표 색상 하나로 설정 (per-vertex stroke 제거)
    let rowCenter = y * cols + Math.floor(cols / 2);
    let zMid = terrain[rowCenter];
    let tRow = constrain(map(zMid, -300, 300, 0, 1), 0, 1);
    
    stroke(
      lerp(30, 0, tRow),
      lerp(20, 255, tRow),
      lerp(60, 110, tRow),
      lerp(80, 255, tRow)
    );
    
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < cols; x++) {
      let idx1 = y * cols + x;
      let idx2 = (y + 1) * cols + x;
      vertex(x * SCL, y * SCL, terrain[idx1]);
      vertex(x * SCL, (y + 1) * SCL, terrain[idx2]);
    }
    endShape();
  }
  
  // ── 스캔라인 (베이스 히트 시) ──
  if (sBass > 160) {
    let scanY = (frameCount * 6) % (rows * SCL);
    let yIdx = Math.floor(scanY / SCL);
    if (yIdx < rows) {
      stroke(0, 255, 100, map(sBass, 160, 255, 40, 180));
      strokeWeight(1.5);
      beginShape(LINES);
      for (let x = 0; x < cols - 1; x++) {
        vertex(x * SCL, scanY, terrain[yIdx * cols + x]);
        vertex((x + 1) * SCL, scanY, terrain[yIdx * cols + x + 1]);
      }
      endShape();
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MODE 1: POINT CLOUD
//  최적화: strokeWeight 1회 설정, random→noise 대체로 일관된 떨림
// ═══════════════════════════════════════════════════════
function drawPointCloud() {
  let ptSize = map(sBass, 0, 255, 2, 7);
  strokeWeight(ptSize);
  
  let jitter = map(sTreble, 0, 255, 0, 3);
  let fc = frameCount * 0.1; // 시간 기반 노이즈 시드
  
  beginShape(POINTS);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let idx = y * cols + x;
      let z = terrain[idx];
      let t = constrain(map(z, -300, 300, 0, 1), 0, 1);
      
      // 색상 (per-vertex: WEBGL이 vertex color를 지원)
      let r = lerp(30,  255, t * t);
      let g = lerp(10,  80,  t);
      let b = lerp(120, 255, t);
      stroke(r, g, b, lerp(100, 255, t));
      
      // noise 기반 떨림 (random보다 시각적으로 매끄러움)
      let jx = (noise(x * 0.5, y * 0.3, fc) - 0.5) * jitter * 2;
      let jy = (noise(x * 0.3, y * 0.5, fc + 100) - 0.5) * jitter * 2;
      
      vertex(x * SCL + jx, y * SCL + jy, z);
    }
  }
  endShape();
}

// ═══════════════════════════════════════════════════════
//  MODE 2: ASCII TERRAIN
//  최적화: 2D 오프스크린에 직접 텍스트 렌더 → texture로 3D에 붙이기
//  (수천 번의 push/pop/translate 제거)
// ═══════════════════════════════════════════════════════
let asciiBuffer;

function drawAsciiTerrain() {
  // 지형 데이터를 ASCII 문자로 변환하여 2D 버퍼에 그리기
  let asciiW = Math.min(cols, 50);
  let asciiH = Math.min(rows, 35);
  
  if (!asciiBuffer || asciiBuffer.width !== asciiW * 14 || asciiBuffer.height !== asciiH * 18) {
    asciiBuffer = createGraphics(asciiW * 14, asciiH * 18);
    asciiBuffer.pixelDensity(1);
  }
  
  asciiBuffer.background(0, 0);
  asciiBuffer.textFont('monospace');
  asciiBuffer.textAlign(CENTER, CENTER);
  asciiBuffer.noStroke();
  
  let stepX = Math.max(1, Math.floor(cols / asciiW));
  let stepY = Math.max(1, Math.floor(rows / asciiH));
  
  for (let ay = 0; ay < asciiH; ay++) {
    for (let ax = 0; ax < asciiW; ax++) {
      let sx = Math.min(ax * stepX, cols - 1);
      let sy = Math.min(ay * stepY, rows - 1);
      let z  = terrain[sy * cols + sx];
      let t  = constrain(map(z, -300, 300, 0, 1), 0, 1);
      
      let charIdx = Math.floor(t * (asciiChars.length - 1));
      let ch = asciiChars[charIdx];
      if (ch === ' ') continue;
      
      let r = lerp(60, 0, t);
      let g = lerp(30, 255, t);
      let b = lerp(100, 80, t);
      
      asciiBuffer.fill(r, g, b, lerp(120, 255, t));
      asciiBuffer.textSize(map(t, 0, 1, 10, 16) + sBass * 0.015);
      asciiBuffer.text(ch, ax * 14 + 7, ay * 18 + 9);
    }
  }
  
  // 2D 버퍼를 3D 공간의 평면에 텍스처로 붙이기
  push();
  // 카메라를 향하도록 빌보딩 해제 (지형과 동일한 각도로 놓음)
  noStroke();
  texture(asciiBuffer);
  
  // 베이스에 따라 살짝 Z축으로 솟아오르기
  let liftZ = map(sBass, 0, 255, 0, 40);
  translate(W / 2, H / 2, liftZ);
  plane(W, H);
  pop();
}

// ═══════════════════════════════════════════════════════
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
