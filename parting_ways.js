// ═══════════════════════════════════════════════════════════
//  Parting Ways — Cellular Meiosis (JS Physics + GLSL)
//  Maxime Causeret의 작업에서 영감을 받은 세포 분열 시뮬레이션
// ═══════════════════════════════════════════════════════════

const MAX_CELLS = 40; // 셰이더에 정의된 최대 세포 수와 반드시 일치해야 함

let partingShader;
let song, fft;
let isStarted = false;

// 세포(Cell) 데이터를 담을 배열
let cells = [];

// 에너지 스무딩 및 비트 기반 분열 감지
let sBass = 0;
let prevRawBass = 0;
let beatCooldown = 0; // 연속 분열 방지 타이머
let globalBeatFlash = 0; // 심장박동 및 발광을 위한 전역 플래시 수치

// ── 세포 객체 클래스 ──
class Cell {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(0.1);
    this.acc = createVector(0, 0);
    this.radius = 0.2; // 셰이더 공간(-1.0 ~ 1.0) 기준 대략적인 크기
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // 마찰력 (속도 감쇠)
    this.vel.mult(0.92);
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 화면 밖으로 나가지 않도록 약한 중앙 당김(구심력) 적용
    let centerPull = p5.Vector.mult(this.pos, -0.005);
    this.applyForce(centerPull);
  }
}

// ═══════════════════════════════════════════════════════════
function preload() {
  // 셰이더와 음악 로드
  partingShader = loadShader('parting_ways.vert', 'parting_ways.frag');
  song = loadSound('01 IF U WANT IT (Original Mix).mp3');
}

function setup() {
  // 셰이더를 사용하기 위해선 반드시 WEBGL 모드로 생성
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1); // 성능을 위해 픽셀 밀도 1로 고정 (매우 중요)
  noStroke();

  fft = new p5.FFT(0.85, 64);

  // 초기 세포 1개 생성
  cells.push(new Cell(0, 0));

  // UI 이벤트 연결
  document.getElementById('start-btn').addEventListener('click', startExperience);
}

function startExperience() {
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loading-text').style.display = 'block';
  
  userStartAudio().then(() => {
    song.loop();
    isStarted = true;
    
    let overlay = document.getElementById('start-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 1200);
    
    document.getElementById('hud').classList.add('visible');
  });
}

// ═══════════════════════════════════════════════════════════
//  물리 엔진: 세포 간의 상호작용 (Repulsion) 및 분열 (Mitosis)
// ═══════════════════════════════════════════════════════════
function updatePhysics(bassEnergy, rawBass) {
  // 1. 반발력 및 인력 (몽글몽글하게 뭉침)
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      let a = cells[i];
      let b = cells[j];
      
      let dir = p5.Vector.sub(a.pos, b.pos);
      let d = dir.mag();
      
      // 두 세포 사이의 거리 설정
      let repelDist = 0.18;   // 겹치지 않게 밀어내는 거리 (약간 넓혀서 독립적인 군집 유지)
      let attractDist = 0.50; // 떨어지지 않게 끌어당기는 거리 (포도송이 형태 유지)
      
      if (d < repelDist && d > 0) {
        // 너무 가까우면 밀어냄 (척력)
        let forceMag = (repelDist - d) * 0.15;
        let repel = dir.normalize().mult(forceMag);
        a.applyForce(repel);
        b.applyForce(p5.Vector.mult(repel, -1));
      } else if (d < attractDist && d > 0) {
        // 적당히 멀면 끌어당김 (인력)
        let forceMag = (d - repelDist) * 0.03;
        let attract = dir.normalize().mult(-forceMag);
        a.applyForce(attract);
        b.applyForce(p5.Vector.mult(attract, -1));
      }
    }
  }

  // 2. 마우스 상호작용 (관객이 세포를 휘저을 수 있음)
  let mx = map(mouseX, 0, width, -1.0, 1.0);
  let my = map(mouseY, 0, height, -1.0, 1.0);
  mx *= width / height; // 종횡비 보정
  let mousePos = createVector(mx, my);

  for (let c of cells) {
    let d = p5.Vector.dist(c.pos, mousePos);
    if (d < 0.6) {
      // 마우스 근처에 가면 밀어냄
      let repel = p5.Vector.sub(c.pos, mousePos);
      repel.normalize().mult((0.6 - d) * 0.02);
      c.applyForce(repel);
    }
    c.update();
  }

  // 3. 비트 기반 정직한 2배수 분열 (Mitosis)
  let isBeat = false;
  // 베이스가 급격히 상승(+30)하고 충분히 큰 소리(>150)일 때 비트로 판정
  if (rawBass - prevRawBass > 30 && rawBass > 150) {
    globalBeatFlash = 1.0; // 심장박동(뚱땅) 및 발광을 위한 플래시를 100%로 켬
    
    if (beatCooldown <= 0) {
      isBeat = true;
      beatCooldown = 40; // 한 번 분열하면 40프레임 동안 연속 분열 금지
    }
  }
  
  // 마우스 클릭 시 수동 강제 분열 (테스트용)
  if (mouseIsPressed && beatCooldown <= 0) {
    isBeat = true;
    globalBeatFlash = 1.0;
    beatCooldown = 20;
  }
  
  prevRawBass = rawBass;
  if (beatCooldown > 0) beatCooldown--;
  
  // 플래시 수치 자연스럽게 감쇠 (심장박동처럼 빠르게 부풀었다가 서서히 줄어듦)
  globalBeatFlash = lerp(globalBeatFlash, 0, 0.15);

  // 비트가 터졌고 아직 한계치(MAX_CELLS)에 도달하지 않았다면 기존의 모든 세포를 2배로 복제!
  if (isBeat && cells.length < MAX_CELLS) {
    let currentLen = cells.length;
    let cellsAdded = 0;
    
    for (let i = 0; i < currentLen; i++) {
      if (cells.length + cellsAdded >= MAX_CELLS) break;
      
      let parent = cells[i];
      let offset = p5.Vector.random2D().mult(0.02); // 아주 살짝 어긋난 위치에서 태어남
      let child = new Cell(parent.pos.x + offset.x, parent.pos.y + offset.y);
      
      // 분열 시 강하게 튕겨나가는 킥력 부여 (요청에 따라 초기 튕김을 아주 약하게 줄임)
      let kick = offset.copy().normalize().mult(0.04); 
      child.applyForce(kick);
      parent.applyForce(p5.Vector.mult(kick, -1));
      
      cells.push(child);
      cellsAdded++;
    }
    
    // HUD 업데이트
    document.getElementById('hud-cells').textContent = cells.length;
    if (cells.length >= MAX_CELLS) {
      document.getElementById('hud-status').textContent = "Maximum Saturation Reached";
      document.getElementById('hud-status').style.color = "#ff3355";
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  DRAW LOOP
// ═══════════════════════════════════════════════════════════
function draw() {
  if (!isStarted) {
    background(2, 2, 5);
    return;
  }

  // ── 오디오 분석 ──
  fft.analyze();
  let rawBass = fft.getEnergy("bass");
  // 0.0 ~ 1.0 사이의 값으로 정규화 및 스무딩
  let normalizedBass = map(rawBass, 100, 255, 0.0, 1.0);
  normalizedBass = constrain(normalizedBass, 0.0, 1.0);
  sBass = lerp(sBass, normalizedBass, 0.15);

  // ── 물리 엔진 업데이트 ──
  // 스무딩된 에너지(크기 조정용)와 raw 에너지(비트 타격용)를 모두 전달
  updatePhysics(sBass, rawBass);

  // ── 셰이더로 전달할 좌표 배열 준비 ──
  // GLSL uniform 배열에는 1차원 평탄화(Flat)된 배열을 전달해야 합니다.
  // MAX_CELLS * 2 크기의 배열 생성 (각 세포당 x, y)
  let positionsArray = [];
  
  for (let i = 0; i < MAX_CELLS; i++) {
    if (i < cells.length) {
      // 실제 존재하는 세포의 좌표
      positionsArray.push(cells[i].pos.x, cells[i].pos.y);
    } else {
      // 존재하지 않는 잉여 세포는 화면 아주 멀리 쫓아내어 렌더링에 영향이 없게 함
      positionsArray.push(1000.0, 1000.0);
    }
  }

  // ── 셰이더 활성화 및 Uniform 전달 ──
  shader(partingShader);
  
  partingShader.setUniform('u_resolution', [width, height]);
  partingShader.setUniform('u_time', millis() / 1000.0);
  partingShader.setUniform('u_energy', sBass);
  partingShader.setUniform('u_flash', globalBeatFlash); // 심장박동 플래시 전달
  partingShader.setUniform('u_cell_count', cells.length);
  // p5.js에서 배열 셰이더 변수로 전달 (flat array)
  partingShader.setUniform('u_positions', positionsArray);

  // 화면 전체를 덮는 사각형(Plane)을 렌더링하여 프래그먼트 셰이더가 작동하게 함
  rect(-width / 2, -height / 2, width, height);
}

// ═══════════════════════════════════════════════════════════
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
