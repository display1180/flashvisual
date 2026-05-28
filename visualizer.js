let features;
let song;
let currentMode = 1; // 1: Spiritual Core, 2: Cosmic Tunnel, 3: Language Whisper, 4: Brain Garden

// 뇌 정원 모드를 위한 변수
let particles = [];
let gardenPlants = [];
let brainwaves = []; // 뇌파(시냅스 신호) 배열

// 언어/문자 텍스처를 담을 배열
let textTextures = [];
let words = ["의식", "소리", "흐름", "기억", "존재", "A", "E", "I", "O", "U", "숨", "결", "공간", "시간", "파동", "언어", "CREEK", "물결"];

function preload() {
  features = loadJSON('music_features.json');
  song = loadSound('Hiroshi Yoshimura - CREEK.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);

  // 문자 텍스처 미리 생성 (2D 그래픽스를 3D 평면에 입히기 위함)
  for (let i = 0; i < words.length; i++) {
    let pg = createGraphics(256, 256);
    pg.clear(); // 배경 투명
    pg.fill(255); // 흰색 글씨
    pg.textAlign(CENTER, CENTER);
    pg.textSize(64);
    pg.text(words[i], 128, 128);
    textTextures.push(pg);
  }

  // UI 버튼 이벤트 리스너 연결
  let playBtn = document.getElementById('playBtn');
  let mode1Btn = document.getElementById('mode1Btn');
  let mode2Btn = document.getElementById('mode2Btn');
  let mode3Btn = document.getElementById('mode3Btn'); // 새로 추가된 모드3 버튼
  let mode4Btn = document.getElementById('mode4Btn'); // 모드4 버튼

  playBtn.addEventListener('click', () => {
    if (song.isPlaying()) {
      song.pause();
      playBtn.innerText = '▶ Play';
    } else {
      song.play();
      playBtn.innerText = '⏸ Pause';
    }
  });

  mode1Btn.addEventListener('click', () => {
    currentMode = 1;
    updateModeUI(1);
  });

  mode2Btn.addEventListener('click', () => {
    currentMode = 2;
    updateModeUI(2);
  });

  mode3Btn.addEventListener('click', () => {
    currentMode = 3;
    updateModeUI(3);
  });

  mode4Btn.addEventListener('click', () => {
    currentMode = 4;
    updateModeUI(4);
  });

  // 뇌 모양을 형성하는 기본 입자 생성
  for (let i = 0; i < 2000; i++) {
    particles.push(new BrainParticle());
  }
  
  // 파티클 간의 시냅스 연결 (이웃 찾기 - 브레인 네트워크 형성)
  for (let p of particles) {
    p.findNeighbors();
  }

  // 뇌 내부의 '정원' 오브젝트 생성
  for (let i = 0; i < 50; i++) {
    gardenPlants.push(new SpiritPlant());
  }

  // 뇌파 생성 (알파, 베타, 세타, 델타, 감마)
  let waveTypes = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
  for (let i = 0; i < 60; i++) { // 60개의 뇌파 신호가 뇌 속을 돌아다님
    brainwaves.push(new Brainwave(random(waveTypes)));
  }
}

// UI 버튼 색상 업데이트
function updateModeUI(mode) {
  document.getElementById('mode1Btn').classList.remove('active-btn');
  document.getElementById('mode2Btn').classList.remove('active-btn');
  document.getElementById('mode3Btn').classList.remove('active-btn');
  document.getElementById('mode4Btn').classList.remove('active-btn');
  document.getElementById('mode' + mode + 'Btn').classList.add('active-btn');

  // 모드 4일 때만 뇌파 인덱스 표시
  let legend = document.getElementById('brainwaveLegend');
  if (legend) {
    legend.style.display = (mode === 4) ? 'block' : 'none';
  }
}

function draw() {
  colorMode(RGB, 255); // Reset color mode for all other modes
  background(0); // 완전한 검은색 배경

  // 마우스로 3D 공간 탐색
  orbitControl();

  let currentVolume = 0;
  
  // 현재 재생 시간에 맞춰 볼륨값(RMS) 찾기
  if (song.isPlaying()) {
    let t = song.currentTime();
    let times = features.volume.times;
    let values = features.volume.values;
    
    for (let i = 0; i < times.length; i++) {
      if (times[i] >= t) {
        currentVolume = values[max(0, i - 1)]; 
        break;
      }
    }
  }

  // 선택된 모드에 따라 렌더링
  if (currentMode === 1) {
    drawMode1(currentVolume);
  } else if (currentMode === 2) {
    drawMode2(currentVolume);
  } else if (currentMode === 3) {
    drawMode3(currentVolume);
  } else if (currentMode === 4) {
    drawMode4(currentVolume);
  }
}

// ----------------------------------------------------
// Mode 1: Spiritual Core (기존)
// ----------------------------------------------------
function drawMode1(currentVolume) {
  push();
  rotateY(frameCount * 0.002);
  rotateX(sin(frameCount * 0.005) * 0.1);
  rotateZ(cos(frameCount * 0.003) * 0.05);

  push();
  normalMaterial();
  sphere(30 + currentVolume * 200, 24, 24);
  pop();

  let chroma = features.tonality;
  let numPillars = 12;

  for (let i = 0; i < numPillars; i++) {
    let angle = map(i, 0, numPillars, 0, TWO_PI);
    let r = 200 + sin(frameCount * 0.02 + i) * 15; 
    let x = r * cos(angle);
    let z = r * sin(angle);
    
    let baseH = map(chroma[i], 0, 1, 10, 300); 
    let activeH = currentVolume * 1000; 
    let h = baseH + activeH;

    push();
    translate(x, 0, z);
    rotateY(-angle);
    rotateX(sin(frameCount * 0.01 + i) * 0.15);
    
    normalMaterial(); 
    box(40, h, 40); 
    
    push();
    translate(0, -h/2 - 30, 0);
    rotateY(frameCount * 0.05 + i);
    rotateX(frameCount * 0.05);
    box(10 + currentVolume * 50);
    pop();

    push();
    translate(0, h/2 + 30, 0);
    rotateY(-frameCount * 0.05 - i);
    rotateZ(frameCount * 0.05);
    box(10 + currentVolume * 50);
    pop();

    pop();
  }
  pop();
}

// ----------------------------------------------------
// Mode 2: Cosmic Tunnel (터널)
// ----------------------------------------------------
function drawMode2(currentVolume) {
  push();
  rotateX(frameCount * 0.005);
  rotateY(frameCount * 0.002);
  
  let chroma = features.tonality;
  let numRings = 25; 
  let speed = song.isPlaying() ? frameCount * 3 : 0;

  for (let i = 0; i < numRings; i++) {
    push();
    let zOffset = -i * 150 + (speed % 150);
    translate(0, 0, zOffset);
    
    let depthScale = map(zOffset, -numRings * 150, 0, 0.1, 1.5);
    scale(depthScale);

    let waveX = sin(frameCount * 0.01 + i) * 50;
    let waveY = cos(frameCount * 0.015 + i) * 50;
    translate(waveX, waveY, 0);
    
    let tVal = chroma[i % 12];
    let torusRadius = 250;
    let torusTube = 5 + tVal * 15 + currentVolume * 80;
    
    rotateZ(frameCount * 0.01 + i * 0.2);
    rotateX(sin(frameCount * 0.02 + i) * 0.5);
    
    normalMaterial();
    torus(torusRadius, torusTube, 40, 16);
    pop();
  }
  pop();
}

// ----------------------------------------------------
// Mode 3: Language Whisper (언어의 부유)
// ----------------------------------------------------
function drawMode3(currentVolume) {
  push();
  
  // 전체 언어 군집이 서서히 소용돌이치듯 회전
  rotateY(frameCount * 0.003);
  rotateX(sin(frameCount * 0.002) * 0.2);

  let numParticles = 80; // 떠다니는 문자 갯수
  let chroma = features.tonality;

  // 글자에 은은한 빛(틴트)을 주거나 볼륨에 따라 색상이 빛나게 설정
  // WEBGL에서 투명도와 블렌딩을 위해 조명 없이 직접 색상을 설정
  colorMode(HSB, 360, 100, 100);

  for (let i = 0; i < numParticles; i++) {
    push();
    
    // 나선형(원기둥 모양)으로 문자들이 우주로 솟아오르는 느낌
    let radius = 150 + sin(i * 0.5 + frameCount * 0.01) * 100;
    let angle = i * 0.4 + frameCount * 0.005;
    
    // 계속해서 위로 스크롤되는 Y축 계산 (-600 ~ 600 범위를 무한 루프)
    let ySpeed = song.isPlaying() ? frameCount * 1.5 : 0;
    let yPos = (i * 20 - ySpeed) % 1200;
    if (yPos < 0) yPos += 1200;
    yPos -= 600; 

    let x = cos(angle) * radius;
    let z = sin(angle) * radius;

    translate(x, yPos, z);

    // 각 글자가 항상 바깥을 바라보게 하면서도, 볼륨에 따라 나비처럼 파닥거림
    rotateY(-angle + PI/2);
    rotateX(currentVolume * 3 * (i % 2 === 0 ? 1 : -1)); 

    // 각 입자의 크기와 색상 결정
    let chromaIndex = i % 12;
    let baseEnergy = chroma[chromaIndex];
    let planeSize = 30 + baseEnergy * 60 + currentVolume * 200;

    // 텍스처(문자) 입히기
    let texIndex = i % textTextures.length;
    texture(textTextures[texIndex]);
    
    // 볼륨과 크로마에 반응하는 색상 틴트
    let hueValue = map(chromaIndex, 0, 12, 0, 360);
    let brightness = map(currentVolume, 0, 0.3, 50, 100);
    tint(hueValue, 80, brightness);
    
    noStroke();
    plane(planeSize, planeSize);
    
    pop();
  }
  
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ----------------------------------------------------
// Mode 4: Brain Garden
// ----------------------------------------------------
function drawMode4(currentVolume) {
  background(10, 15, 30); // 깊은 심연의 색
  
  // 은은한 빛 효과
  ambientLight(150, 200, 255);
  pointLight(255, 255, 255, 0, 0, 200);

  // 1. 뇌 구조 그리기
  push();
  rotateY(frameCount * 0.005);
  for (let p of particles) {
    p.update(currentVolume);
    p.display();
  }
  
  // 2. 시냅스와 뇌파 신호 그리기
  for (let bw of brainwaves) {
    bw.update(currentVolume);
    bw.display();
  }

  // 3. 내부 정원 그리기
  for (let plant of gardenPlants) {
    plant.display(currentVolume);
  }
  pop();
}

// 뇌 입자 클래스 (수학적 굴곡 표현)
class BrainParticle {
  constructor() {
    let u = random(TWO_PI);
    let v = random(PI);
    // 뇌의 대략적인 타원형 구조 설정
    this.basePos = createVector(
      150 * sin(v) * cos(u),
      100 * sin(v) * sin(u),
      120 * cos(v)
    );
    // 뇌의 주름 효과를 위한 노이즈 적용
    let noiseVal = noise(this.basePos.x * 0.01, this.basePos.y * 0.01);
    this.pos = this.basePos.copy().mult(1 + noiseVal * 0.3);
    this.neighbors = []; // 연결될 시냅스 이웃들
  }

  // 가까운 파티클들을 찾아 시냅스로 연결
  findNeighbors() {
    for (let other of particles) {
      if (other !== this) {
        let d = this.basePos.dist(other.basePos);
        if (d < 20) { 
          this.neighbors.push(other);
          if (this.neighbors.length >= 3) break; // 최대 3개의 시냅스 연결만 유지 (성능 최적화)
        }
      }
    }
  }

  display() {
    // 시냅스 연결선 그리기
    strokeWeight(0.5);
    stroke(180, 220, 255, 30); // 아주 희미한 선
    for (let n of this.neighbors) {
      line(this.pos.x, this.pos.y, this.pos.z, n.pos.x, n.pos.y, n.pos.z);
    }

    // 입자 그리기
    stroke(180, 220, 255, 150);
    strokeWeight(1.5);
    point(this.pos.x, this.pos.y, this.pos.z);
  }
  
  update(vol = 0) {
    // 호흡하는 듯한 미세한 움직임 (볼륨 반응 추가)
    this.pos.add(p5.Vector.random3D().mult(0.2 + vol * 5));
  }
}

// 정원 식물 클래스 (초월적 영성 표현)
class SpiritPlant {
  constructor() {
    this.pos = p5.Vector.random3D().mult(random(20, 80));
    this.color = color(random(150, 255), 255, random(150, 255), 200);
  }

  display(vol = 0) {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    noStroke();
    fill(this.color);
    // 식물이 피어나는 듯한 구체 형태 (볼륨 반응 추가)
    sphere(noise(frameCount * 0.02) * 5 + vol * 30); 
    pop();
  }
}

// ----------------------------------------------------
// 뇌파 (시냅스 신호) 클래스
// ----------------------------------------------------
class Brainwave {
  constructor(type) {
    this.type = type;
    this.trail = [];
    
    if (this.type === 'delta') {
      // 델타파: 깊은 수면 (가장 느리고 굵음)
      this.color = color(150, 50, 255, 200); // 보라색
      this.speed = 1.0;
      this.thickness = 3.5;
      this.maxTrail = 15;
    } else if (this.type === 'theta') {
      // 세타파: 명상, 직관
      this.color = color(50, 150, 255, 200); // 청록색
      this.speed = 2.5;
      this.thickness = 2.5;
      this.maxTrail = 20;
    } else if (this.type === 'alpha') {
      // 알파파: 안정, 이완
      this.color = color(50, 255, 150, 200); // 초록/민트
      this.speed = 4.0;
      this.thickness = 2.0;
      this.maxTrail = 25;
    } else if (this.type === 'beta') {
      // 베타파: 집중, 활동
      this.color = color(255, 200, 50, 200); // 노란/주황
      this.speed = 7.0;
      this.thickness = 1.5;
      this.maxTrail = 30;
    } else if (this.type === 'gamma') {
      // 감마파: 고도의 인지 활동 (가장 빠름)
      this.color = color(255, 100, 200, 255); // 핑크/흰색
      this.speed = 12.0;
      this.thickness = 1.0;
      this.maxTrail = 40;
    }

    let startParticle = random(particles);
    this.pos = startParticle.pos.copy();
    this.targetParticle = this.findNextParticle(startParticle);
  }

  findNextParticle(current) {
    // 1. 먼저 시냅스로 연결된 이웃 중 하나를 선택해 자연스럽게 신호가 흐르도록 함
    if (current.neighbors && current.neighbors.length > 0) {
      // 80% 확률로 이웃 파티클로 이동, 20% 확률로 다른 곳으로 점프 (새로운 아이디어/생각의 연결)
      if (random() < 0.8) {
        return random(current.neighbors);
      }
    }
    
    // 2. 이웃이 없거나 점프하는 경우: 근처에 있는 랜덤 파티클로 이동
    let best = random(particles);
    let minDist = Infinity;
    for(let i=0; i<15; i++) {
      let p = random(particles);
      if (p !== current) {
        let d = this.pos.dist(p.pos);
        if (d < minDist) {
          minDist = d;
          best = p;
        }
      }
    }
    return best;
  }

  update(vol = 0) {
    if (this.targetParticle) {
      let dir = p5.Vector.sub(this.targetParticle.pos, this.pos);
      let d = dir.mag();
      
      // 음악의 볼륨에 반응하여 뇌파 이동 속도 증폭
      let currentSpeed = this.speed * (1 + vol * 4);
      
      if (d < currentSpeed) {
        this.pos = this.targetParticle.pos.copy();
        this.targetParticle = this.findNextParticle(this.targetParticle);
      } else {
        dir.normalize();
        dir.mult(currentSpeed);
        this.pos.add(dir);
      }
    }

    // 이동 궤적(꼬리) 저장
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
  }

  display() {
    if (this.trail.length < 2) return;
    
    push();
    noFill();
    stroke(this.color);
    strokeWeight(this.thickness);
    
    // 뇌파 궤적 그리기
    beginShape();
    for (let p of this.trail) {
      vertex(p.x, p.y, p.z);
    }
    endShape();
    
    // 뇌파 신호의 머리 부분(가장 밝은 빛)
    strokeWeight(this.thickness * 4);
    point(this.pos.x, this.pos.y, this.pos.z);
    pop();
  }
}
