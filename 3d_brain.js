let img;
let particles = [];
let actionWords = ['명상', '운동', '수다', '자책', '노래부르기'];
let actionTextures = [];
let actionParticles = [];
let currentAction = 'none';
let actionColors = {
  '명상': [50, 255, 150],   // 초록/민트
  '운동': [255, 100, 50],   // 주황/빨강
  '수다': [255, 200, 50],   // 노랑
  '자책': [150, 50, 255],   // 보라
  '노래부르기': [255, 100, 200] // 핑크
};

function preload() {
  // 이미지를 불러옵니다. 사용자가 올린 이미지를 'brain.png'로 저장했다고 가정합니다.
  img = loadImage('brain.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);
  
  // 퍼포먼스를 위해 이미지 크기를 줄여 파티클 수를 조절합니다 (너비 120픽셀 기준)
  img.resize(150, 0);
  img.loadPixels();
  
  let w = img.width;
  let h = img.height;
  
  // 중심을 화면 가운데로 맞추기 위한 오프셋
  let offsetX = -w / 2;
  let offsetY = -h / 2;
  
  // 픽셀 간격(스케일)
  let scale = 3.5;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let index = (x + y * w) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let a = img.pixels[index + 3];
      
      // 검은색에 가까운 배경이거나 투명한 픽셀은 건너뜁니다
      if (a > 50 && (r > 30 || g > 30 || b > 30)) {
        
        // 2D 이미지에 Z축 깊이를 부여하여 입체감(3D)을 형성합니다.
        // x, y 좌표를 0~PI로 매핑한 뒤 sin 함수를 곱하면 가운데가 볼록하고 가장자리가 얇아집니다.
        let nx = map(x, 0, w, 0, PI);
        let ny = map(y, 0, h, 0, PI);
        let depth = sin(nx) * sin(ny) * 80; 
        
        // 뇌의 주름진 표면 느낌을 살리기 위해 노이즈를 더합니다.
        let n = noise(x * 0.1, y * 0.1) * 20;
        depth += n;
        
        // 원본 이미지의 색상을 파티클에 적용하되, 어둡게(0.3배) 만듭니다.
        let c = color(r * 0.3, g * 0.3, b * 0.3, 230);
        
        // 앞면 파티클 생성
        particles.push(new BrainPixel(
          (x + offsetX) * scale, 
          (y + offsetY) * scale, 
          depth * (scale * 0.25), 
          c, random(actionWords)
        ));
        
        // 뒷면 파티클 생성 (대칭을 이뤄 온전한 3D 뇌를 만듦)
        particles.push(new BrainPixel(
          (x + offsetX) * scale, 
          (y + offsetY) * scale, 
          -depth * (scale * 0.25), 
          c, random(actionWords)
        ));
      }
    }
  }
  
  // 픽셀 간 시냅스 연결 미리 계산
  for (let p of particles) {
    p.findNeighbors();
  }
  
  // HTML UI 버튼 이벤트 연결
  let buttons = ['none', '명상', '운동', '수다', '자책', '노래부르기'];
  buttons.forEach(action => {
    let btn = document.getElementById('btn-' + action);
    if (btn) {
      btn.addEventListener('click', () => {
        currentAction = action;
        buttons.forEach(a => {
          let b = document.getElementById('btn-' + a);
          if (b) b.classList.remove('active');
        });
        btn.classList.add('active');
      });
    }
  });

  // 떠다니는 행동 글자 텍스처 생성
  for (let i = 0; i < actionWords.length; i++) {
    let pg = createGraphics(256, 128);
    pg.clear();
    pg.fill(255, 255, 255, 220); // 약간 투명한 흰색
    pg.textAlign(CENTER, CENTER);
    pg.textSize(48);
    pg.text(actionWords[i], 128, 64);
    actionTextures.push(pg);
  }
  
  // 행동 파티클 생성
  for (let i = 0; i < 35; i++) {
    actionParticles.push(new ActionParticle());
  }
}

function draw() {
  background(10, 10, 15); // 깊고 어두운 우주 느낌의 배경
  
  // 마우스 클릭 및 드래그로 3D 회전/줌 제어
  orbitControl();
  
  // 은은하고 입체적인 조명 설정
  ambientLight(120);
  directionalLight(255, 255, 255, 1, 1, -1);
  pointLight(255, 200, 200, 0, 0, 200); // 전면에서 쏘는 약간 붉은 빛
  
  // 뇌 전체가 스스로 천천히 둥둥 떠다니며 회전하는 애니메이션
  push();
  rotateY(frameCount * 0.005);
  translate(0, sin(frameCount * 0.02) * 20, 0); // 위아래로 부유
  
  // 모든 픽셀 파티클 렌더링
  for (let p of particles) {
    p.update();
    p.display();
  }
  
  // 활성화된 행동 그룹의 시냅스(네트워크 선) 일괄 렌더링
  if (currentAction !== 'none') {
    let ac = actionColors[currentAction];
    stroke(ac[0], ac[1], ac[2], 180);
    strokeWeight(1.5);
    beginShape(LINES);
    for (let p of particles) {
      if (p.group === currentAction) {
        for (let n of p.neighbors) {
          vertex(p.pos.x, p.pos.y, p.pos.z);
          vertex(n.pos.x, n.pos.y, n.pos.z);
        }
      }
    }
    endShape();
  }
  
  // 떠다니는 행동 글자들 렌더링
  for (let ap of actionParticles) {
    ap.update();
    ap.display();
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// -------------------------------
// 파티클 (복셀) 클래스
// -------------------------------
class BrainPixel {
  constructor(x, y, z, c, group) {
    this.baseX = x;
    this.baseY = y;
    this.baseZ = z;
    this.pos = createVector(x, y, z);
    this.c = c;
    this.group = group; // 이 세포가 담당하는 행동 그룹
    this.offset = random(1000); 
    this.neighbors = [];
  }
  
  findNeighbors() {
    // 같은 행동 그룹에 속한 가까운 세포들끼리 시냅스로 연결
    for (let other of particles) {
      if (other !== this && other.group === this.group) {
        let d = dist(this.baseX, this.baseY, this.baseZ, other.baseX, other.baseY, other.baseZ);
        if (d < 45) { // 연결 반경
          this.neighbors.push(other);
          if (this.neighbors.length >= 3) break; // 성능을 위해 최대 3개
        }
      }
    }
  }
  
  update() {
    let moveAmount = 0.2; // 평소에는 거의 미동도 없이 고요함
    
    // 이 세포가 현재 선택된 행동 그룹이라면 강하게 활성화
    if (currentAction === this.group) {
      moveAmount = 2.5;
    }
    
    this.pos.x = this.baseX + sin(frameCount * 0.05 + this.offset) * moveAmount;
    this.pos.y = this.baseY + cos(frameCount * 0.04 + this.offset) * moveAmount;
    this.pos.z = this.baseZ + sin(frameCount * 0.03 + this.offset) * moveAmount;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    noStroke();
    
    if (currentAction === this.group) {
      // 선택된 그룹은 고유의 밝은 빛을 내며 크기도 살짝 커짐
      let ac = actionColors[currentAction];
      emissiveMaterial(ac[0], ac[1], ac[2]); 
      box(4.5);
    } else {
      // 선택되지 않은 세포는 빛을 반사하지 않고 매우 어둡게 유지됨
      ambientMaterial(this.c);
      box(3.0);
    }
    
    pop();
  }
}

// -------------------------------
// 떠다니는 행동 파티클 클래스
// -------------------------------
class ActionParticle {
  constructor() {
    this.texIndex = floor(random(actionWords.length));
    this.angle = random(TWO_PI);
    this.radius = random(180, 350); // 뇌 바깥쪽 궤도
    this.y = random(-120, 120);
    this.speed = random(0.005, 0.015) * (random() > 0.5 ? 1 : -1);
    this.size = random(60, 90);
    this.offset = random(1000);
  }
  
  update() {
    this.angle += this.speed;
    this.y += sin(frameCount * 0.02 + this.offset) * 0.5;
  }
  
  display() {
    push();
    let x = cos(this.angle) * this.radius;
    let z = sin(this.angle) * this.radius;
    translate(x, this.y, z);
    
    // 항상 뇌의 중심 바깥쪽을 향하도록 회전 (빌보드 느낌)
    rotateY(-this.angle + PI/2);
    
    texture(actionTextures[this.texIndex]);
    noStroke();
    plane(this.size * 2, this.size);
    pop();
  }
}
