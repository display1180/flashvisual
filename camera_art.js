let capture;
let isStarted = false;
let faceapi;
let detections = [];

let offscreen;
let prevPixels = new Uint8ClampedArray(0); // 프레임 간 변화(움직임) 감지용 배열
const gridSize = 22; // 아스키 텍스트 크기 (글자를 큼직하고 여유있게)

// 감정별 아스키 문자 셋 및 색상 정의
const expressionMap = {
  neutral:  { chars: "01010101", color: [0, 255, 100] },
  happy:    { chars: "LOVEHAPY", color: [255, 100, 200] },
  sad:      { chars: "TEARS///", color: [100, 150, 255] },
  angry:    { chars: "ERROR!@#", color: [255, 50, 50] },
  fearful:  { chars: "FEARFEAR", color: [150, 0, 255] },
  disgusted:{ chars: "YUCKXXXX", color: [200, 255, 50] },
  surprised:{ chars: "WOWOOOOO", color: [0, 255, 255] }
};

let currentExpression = "neutral";
let targetColor = [0, 255, 100];
let currentColor = [0, 255, 100];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  
  // 오프스크린 캔버스 생성 (퍼포먼스를 위해 해상도를 gridSize만큼 줄임)
  let cols = floor(width / gridSize);
  let rows = floor(height / gridSize);
  offscreen = createGraphics(cols, rows);
  
  // 1. 카메라 연동
  capture = createCapture(VIDEO, () => {
    // 2. 카메라가 준비되면 ml5.js FaceAPI 모델 로드 시작
    const detectionOptions = {
      withLandmarks: false,
      withDescriptors: false,
      withExpressions: true
    };
    faceapi = ml5.faceApi(capture, detectionOptions, modelReady);
  });
  capture.hide(); // 기본 HTML 비디오 요소 숨김
  
  document.getElementById('start-btn').addEventListener('click', () => {
    isStarted = true;
    let overlay = document.getElementById('start-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 1200);
    document.getElementById('hud').classList.add('visible');
  });
}

function modelReady() {
  console.log('FaceAPI Ready');
  // 로딩 UI 숨기고 시작 버튼 표시
  document.getElementById('loading-status').style.display = 'none';
  document.getElementById('start-btn').style.display = 'block';
  // 얼굴 추적 루프 시작
  faceapi.detect(gotResults);
}

// ── 얼굴 트래킹 루프 ──
function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  detections = result;
  
  if (detections && detections.length > 0) {
    // 가장 먼저 인식된 얼굴의 감정 확률 데이터 추출
    let exprs = detections[0].expressions;
    let maxVal = 0;
    let maxExpr = "neutral";
    
    for (const [key, value] of Object.entries(exprs)) {
      if (value > maxVal) {
        maxVal = value;
        maxExpr = key;
      }
    }
    
    // 확률이 40% 이상일 때만 상태 변경 (깜빡임 방지)
    if (maxVal > 0.4) {
      currentExpression = maxExpr;
      targetColor = expressionMap[maxExpr].color;
      
      // HUD 텍스트 업데이트
      document.querySelector('.hud-text').innerText = 
        `SYS.OPTIC // EMOTION: ${maxExpr.toUpperCase()} [${Math.floor(maxVal*100)}%]`;
    }
  } else {
    // 얼굴이 안 보일 경우
    currentExpression = "neutral";
    targetColor = [100, 100, 100]; // 회색
    document.querySelector('.hud-text').innerText = `SYS.OPTIC // TARGET LOST`;
  }
  
  // 다음 프레임 계속 추적
  faceapi.detect(gotResults);
}

// ── 메인 렌더링 루프 ──
function draw() {
  if (!isStarted) return;
  background(10, 10, 15); // 매우 어두운 배경
  
  if (capture.width === 0 || capture.height === 0) return;

  // 색상 부드러운 전환 (Lerp)
  currentColor[0] = lerp(currentColor[0], targetColor[0], 0.1);
  currentColor[1] = lerp(currentColor[1], targetColor[1], 0.1);
  currentColor[2] = lerp(currentColor[2], targetColor[2], 0.1);
  
  // 1. 실제 고해상도 비디오를 캔버스 배경에 렌더링 (거울 모드)
  push();
  translate(width, 0);
  scale(-1, 1);
  let mainVRatio = capture.width / capture.height;
  let mainCRatio = width / height;
  let mw, mh, mx, my;
  if (mainCRatio > mainVRatio) {
    mw = width; mh = width / mainVRatio; mx = 0; my = (height - mh) / 2;
  } else {
    mw = height * mainVRatio; mh = height; mx = (width - mw) / 2; my = 0;
  }
  image(capture, mx, my, mw, mh);
  pop();
  
  // 비디오 위에 반투명한 검은색을 덮어 아스키 텍스트가 잘 보이도록 함 (오버레이 효과)
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  // 2. 오프스크린 캔버스에 비디오 렌더링 (픽셀 분석을 위한 축소판)
  offscreen.background(0);
  offscreen.push();
  // 거울 모드
  offscreen.translate(offscreen.width, 0);
  offscreen.scale(-1, 1);
  
  // Object-fit: cover 비율 계산
  let vRatio = capture.width / capture.height;
  let cRatio = offscreen.width / offscreen.height;
  let dw, dh, dx, dy;
  
  if (cRatio > vRatio) {
    dw = offscreen.width;
    dh = offscreen.width / vRatio;
    dx = 0;
    dy = (offscreen.height - dh) / 2;
  } else {
    dw = offscreen.height * vRatio;
    dh = offscreen.height;
    dx = (offscreen.width - dw) / 2;
    dy = 0;
  }
  offscreen.image(capture, dx, dy, dw, dh);
  offscreen.pop();
  
  // 2. 오프스크린 픽셀 데이터를 읽어 아스키 아트로 변환
  offscreen.loadPixels();
  
  // 첫 렌더링이거나 캔버스 크기가 바뀌어 배열 크기가 다를 경우 초기화
  if (prevPixels.length !== offscreen.pixels.length) {
    prevPixels = new Uint8ClampedArray(offscreen.pixels.length);
    prevPixels.set(offscreen.pixels);
  }
  
  textFont('Space Mono');
  textSize(gridSize * 1.2); // 글자가 살짝 겹치도록 키움
  textAlign(CENTER, CENTER);
  
  for (let y = 0; y < offscreen.height; y++) {
    for (let x = 0; x < offscreen.width; x++) {
      let idx = (y * offscreen.width + x) * 4;
      
      let r = offscreen.pixels[idx + 0];
      let g = offscreen.pixels[idx + 1];
      let b = offscreen.pixels[idx + 2];
      
      let pr = prevPixels[idx + 0];
      let pg = prevPixels[idx + 1];
      let pb = prevPixels[idx + 2];
      
      // 이전 프레임과의 RGB 차이(의미 있는 변화량) 계산
      // dist 함수를 통해 3차원 유클리드 거리 측정
      let diff = dist(r, g, b, pr, pg, pb);
      
      // 움직임 임계치(Threshold)를 80으로 대폭 상향하여 
      // 카메라 노이즈나 미세한 떨림은 무시하고, 확실하게 크게 움직일 때만 0과 1을 오버레이
      if (diff > 80) {
        let charToDraw = random() > 0.5 ? '0' : '1';
        
        // 변화량이 클수록 더 뚜렷하고 불투명하게 렌더링
        let alpha = map(diff, 80, 255, 150, 255);
        fill(currentColor[0], currentColor[1], currentColor[2], alpha);
        
        // 캔버스에 문자 렌더링
        let renderX = x * gridSize + gridSize / 2;
        let renderY = y * gridSize + gridSize / 2;
        text(charToDraw, renderX, renderY);
      }
    }
  }
  
  // 현재 프레임의 픽셀 데이터를 다음 프레임 비교를 위해 저장
  prevPixels.set(offscreen.pixels);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 오프스크린 캔버스도 다시 생성
  let cols = floor(width / gridSize);
  let rows = floor(height / gridSize);
  offscreen = createGraphics(cols, rows);
}
