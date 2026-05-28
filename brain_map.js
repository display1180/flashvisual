let currentTab = 'real'; // 'real' (실제 뇌) 또는 'personal' (나의 뇌 정원)
let particles = [];
let numParticles = 3500; // 뇌의 밀도를 높이기 위해 입자 수 증가

// 실제 뇌 구역 색상 (새로운 해부학 이미지 기준)
const realColors = {
  '전두엽 (Frontal Lobe)': [150, 190, 230], // 하늘색
  '두정엽 (Parietal Lobe)': [240, 210, 130], // 노란빛/살구색
  '후두엽 (Occipital Lobe)': [230, 150, 160], // 핑크/붉은색
  '측두엽 (Temporal Lobe)': [160, 200, 150], // 연두색
  '소뇌 (Cerebellum)': [200, 180, 160],      // 베이지
  '뇌간 (Brainstem)': [180, 180, 180]       // 회색
};

// 개인 뇌 정원 색상 (사용자 그림 기준)
const personalColors = {
  '놀궁리': [255, 120, 180], // 밝은 핑크 (가장 넓은 부위)
  '꿈': [120, 200, 255],     // 하늘색 (위쪽)
  '딴 생각': [100, 255, 180], // 민트/연두 (뒷쪽)
  '졸림': [255, 230, 100],   // 부드러운 노랑 (아래 옆쪽)
  '휴식': [180, 130, 255]    // 연보라 (가장 아래쪽)
};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);
  
  // 수학적으로 타원형 뇌 형태의 점묘(Point Cloud) 모델링 생성
  for (let i = 0; i < numParticles; i++) {
    // 구면 좌표계를 이용해 입체 타원형을 무작위로 채움
    let u = random(TWO_PI);
    let v = random(PI);
    
    // 뇌의 대략적인 비율 (x: 길이(앞뒤), y: 높이(상하), z: 너비(좌우))
    // 양수 x축 방향이 '앞(Front)'이라고 가정
    let rx = random(120, 240); 
    let ry = random(100, 180);
    let rz = random(90, 160);
    
    // 타원형 내부를 꽉 채우기 위해 반경을 랜덤 배율로 조절
    let rScale = pow(random(1), 0.33); 
    
    let x = rx * rScale * sin(v) * cos(u);
    let y = ry * rScale * cos(v);
    let z = rz * rScale * sin(v) * sin(u);
    
    // 뇌 표면의 주름(굴곡) 질감을 더하기 위한 3D 노이즈
    let n = noise(x * 0.015, y * 0.015, z * 0.015) * 25;
    x += n; y += n; z += n;

    // 뇌간(Brainstem) 모양 구현: 뇌의 제일 뒤쪽 아래에서 밑으로 뻗어나가는 꼬리 형태
    if (x < -80 && x > -160 && y > 100 && random() > 0.4) {
      y += random(30, 120); // 아래로 길게
      z *= 0.4; // 폭을 좁게
    }

    particles.push(new MapParticle(x, y, z));
  }
  
  updateLegend();
}

function draw() {
  background(10, 12, 18); // 차분하고 깊은 우주/어둠 배경
  
  // 마우스로 3D 제어
  orbitControl(2, 2, 0.1);
  
  // 부드럽고 입체적인 조명 설정
  ambientLight(100);
  directionalLight(255, 255, 255, 1, 1, -1);
  directionalLight(150, 150, 250, -1, -1, 1); // 뒤에서 비추는 약간 푸른 반사광
  
  push();
  // 사용자가 뇌의 옆모습을 먼저 볼 수 있도록 기본 회전값 적용
  rotateY(PI / 3 + frameCount * 0.001); // 천천히 자동 회전
  
  // 모든 뇌 세포(파티클) 렌더링
  for (let p of particles) {
    p.update();
    p.display();
  }
  
  // 뇌의 형태를 묶어주는 반투명한 회백질(Gray Matter) 외피 렌더링
  push();
  noStroke();
  // 반투명하고 무광(Matte)인 대뇌피질 연출
  fill(220, 220, 230, 35); 
  // specularMaterial을 제거하고 ambientMaterial만 사용하여 빛 반사가 없는 무광 처리
  ambientMaterial(220, 220, 230, 35);
  
  // 파티클이 흩어져 있는 최대 범위를 감싸는 메인 타원체
  ellipsoid(245, 185, 165, 40, 40);
  
  // 뇌간(꼬리) 부분을 감싸는 외피
  push();
  translate(-110, 110, 0);
  rotateZ(-PI/8);
  cylinder(50, 120, 24, 24);
  pop();
  
  pop(); // 회백질 pop
  
  pop(); // 전체 회전 pop
}

// UI 탭 클릭 시 호출되는 함수 (HTML에서 실행)
window.switchTab = function(tab) {
  if (currentTab === tab) return; // 이미 같은 탭이면 무시
  
  currentTab = tab;
  
  // UI 스타일 업데이트
  document.getElementById('tab-real').classList.remove('active');
  document.getElementById('tab-personal').classList.remove('active');
  document.getElementById('tab-' + tab).classList.add('active');
  
  updateLegend();
}

// 좌측 범례(Legend) UI 업데이트
function updateLegend() {
  let content = document.getElementById('legend-content');
  let title = document.getElementById('legend-title');
  content.innerHTML = '';
  
  let colors = currentTab === 'real' ? realColors : personalColors;
  title.innerText = currentTab === 'real' ? '실제 뇌 구조' : '나의 뇌 정원';
  
  for (let key in colors) {
    let c = colors[key];
    content.innerHTML += `
      <div class="legend-item">
        <span class="dot" style="background: rgb(${c[0]}, ${c[1]}, ${c[2]}); box-shadow: 0 0 10px rgb(${c[0]}, ${c[1]}, ${c[2]});"></span>
        ${key}
      </div>
    `;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ------------------------------------
// 구역 판별 및 색상 전환 파티클 클래스
// ------------------------------------
class MapParticle {
  constructor(x, y, z) {
    this.basePos = createVector(x, y, z);
    this.pos = createVector(x, y, z);
    this.offset = random(1000);
    
    // 색상이 부드럽게 변하도록 현재 색상과 목표 색상을 관리
    this.currentColor = color(255);
    this.targetColor = color(255);
    
    // 공간 좌표를 기준으로 구역(Region) 할당
    this.assignRegions();
  }
  
  assignRegions() {
    // 기준 축: 
    // x (앞뒤) -> 양수가 '앞', 음수가 '뒤'
    // y (상하) -> 음수가 '위', 양수가 '아래'
    // z (좌우)
    let x = this.basePos.x;
    let y = this.basePos.y;
    let z = this.basePos.z;
    
    // ----------------------------------------------------
    // 1. 실제 뇌 구조 (Real Brain Anatomy)
    // ----------------------------------------------------
    if (y > 100 && x < -80) {
      this.realRegion = '뇌간 (Brainstem)';
    } else if (y > 50 && x < -100) {
      this.realRegion = '소뇌 (Cerebellum)';
    } else if (x > 40) {
      this.realRegion = '전두엽 (Frontal Lobe)';
    } else if (y > 20 && x > -60 && x <= 40) {
      this.realRegion = '측두엽 (Temporal Lobe)';
    } else if (x < -80 && y <= 50) {
      this.realRegion = '후두엽 (Occipital Lobe)';
    } else {
      this.realRegion = '두정엽 (Parietal Lobe)';
    }
    
    // ----------------------------------------------------
    // 2. 나의 뇌 정원 (Personal Brain Garden)
    // 손그림 바탕 매핑
    // ----------------------------------------------------
    if (y > 80 && x < -80) {
      // 소뇌, 뇌간 위치 -> 휴식
      this.personalRegion = '휴식';
    } else if (y < -30 && x > -30) {
      // 위쪽(두정엽 부근) -> 꿈
      this.personalRegion = '꿈';
    } else if (x < -80 && y <= 80) {
      // 뒤쪽(후두엽 부근) -> 딴 생각
      this.personalRegion = '딴 생각';
    } else if (y > 30 && x > -60 && x < 60) {
      // 아래 옆면(측두엽 부근) -> 졸림
      this.personalRegion = '졸림';
    } else {
      // 나머지 가장 넓은 전면/중앙(전두엽 등) -> 놀궁리
      this.personalRegion = '놀궁리';
    }
  }
  
  update() {
    // 현재 선택된 탭에 맞춰 목표 색상 가져오기
    let targetRGB;
    if (currentTab === 'real') {
      targetRGB = realColors[this.realRegion];
    } else {
      targetRGB = personalColors[this.personalRegion];
    }
    
    // 안전 코드
    if (!targetRGB) targetRGB = [255, 255, 255];
    
    this.targetColor = color(targetRGB[0], targetRGB[1], targetRGB[2], 140);
    
    // lerpColor를 이용해 색상이 스르륵(부드럽게) 변환되도록 함
    this.currentColor = lerpColor(this.currentColor, this.targetColor, 0.04);
    
    // 파티클이 살아있는 것처럼 미세한 떨림 (호흡)
    this.pos.x = this.basePos.x + sin(frameCount * 0.02 + this.offset) * 1.5;
    this.pos.y = this.basePos.y + cos(frameCount * 0.03 + this.offset) * 1.5;
    this.pos.z = this.basePos.z + sin(frameCount * 0.025 + this.offset) * 1.5;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    noStroke();
    
    // 색상이 지정된 조명 반응형 재질
    ambientMaterial(this.currentColor);
    
    // box 대신 sphere를 사용하여 유기적이고 둥근 뇌세포 느낌 강조
    sphere(3.5, 6, 6); 
    pop();
  }
}
