let video;
let model = null;
let predictions = [];
let prevX = 0, prevY = 0;
let speed = 0;

let song;
let fft;
let filter;
let isStarted = false;

// 스무딩(부드러운 전환)을 위한 변수
let smoothX = 0, smoothY = 0;
let currentRate = 1.0;

// handtrack.js 모델 설정값
const modelParams = {
  flipHorizontal: false, // p5.js에서 전체 화면을 뒤집음
  maxNumBoxes: 1,        // 하나의 손만 트래킹
  iouThreshold: 0.5,
  scoreThreshold: 0.70    
};

function preload() {
  // 작업 폴더에 있는 오디오 파일 로드
  song = loadSound('Hiroshi Yoshimura - CREEK.mp3');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  
  // 카메라 캡처 생성 (성능 최적화를 위해 내부 해상도를 고정/축소)
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  // FFT 오디오 분석기 설정
  fft = new p5.FFT(0.8, 128);
  
  // LowPass 필터 (물 속에 있는 듯한 먹먹한 효과용)
  filter = new p5.LowPass();
  song.disconnect(); 
  song.connect(filter);
  
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();
  background(0);
  
  // UI 시작 버튼 연동
  let startBtn = document.getElementById('start-btn');
  let loadingText = document.getElementById('loading-text');
  
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    loadingText.style.display = 'block';
    
    // 오디오 컨텍스트 활성화 (브라우저 정책)
    userStartAudio().then(() => {
      // handtrack 모델 로드
      handTrack.load(modelParams).then(lmodel => {
        model = lmodel;
        document.getElementById('start-overlay').style.opacity = '0';
        setTimeout(() => {
          document.getElementById('start-overlay').style.display = 'none';
        }, 800);
        
        isStarted = true;
        song.loop();
        runDetection();
      });
    });
  });
}

function runDetection() {
  if (model) {
    model.detect(video.elt).then(preds => {
      predictions = preds;
      // 메인 스레드 과부하 방지를 위해 딜레이 추가 (약 30fps로 추적 제한)
      setTimeout(() => {
        requestAnimationFrame(runDetection); 
      }, 30);
    });
  }
}

function draw() {
  if (!isStarted) return;
  
  // 잔상 효과를 위한 반투명 배경
  fill(0, 0, 0, 0.15);
  rect(0, 0, width, height);

  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  
  // 1. 카메라 영상을 희미하게 거울 반전하여 깔기
  push();
  translate(width, 0);
  scale(-1, 1);
  tint(255, 0.15); 
  image(video, 0, 0, width, height);
  pop();

  // 2. 오디오 스펙트럼 배경 (소리 파동)
  push();
  noFill();
  strokeWeight(3);
  for (let i = 0; i < spectrum.length; i++) {
    let x = map(i, 0, spectrum.length, 0, width * 1.5); // 화면 가득 채우기
    let h = map(spectrum[i], 0, 255, 0, height / 2);
    let hue = map(i, 0, spectrum.length, 200, 360);
    stroke(hue, 80, 80, 0.5);
    line(x, height, x, height - h);
  }
  pop();

  // 3. 예측된 손 데이터 인터랙션
  if (predictions.length > 0) {
    let hand = predictions[0];
    let bbox = hand.bbox;
    
    // Bounding Box 비율 매핑
    let vScaleX = width / video.width;
    let vScaleY = height / video.height;
    
    let centerX = (bbox[0] + (bbox[2] / 2)) * vScaleX;
    let centerY = (bbox[1] + (bbox[3] / 2)) * vScaleY;
    
    // 좌우 반전된 X 좌표 및 스무딩(Lerp) 적용
    let targetX = width - centerX;
    
    // 부드러운 움직임을 위해 이전 좌표와 보간(Lerp)
    smoothX = lerp(smoothX, targetX, 0.15);
    smoothY = lerp(smoothY, centerY, 0.15);

    let mappedX = smoothX;
    let mappedY = smoothY;

    if (hand.label === 'closed') {
      // ===== [트리거 모드] 주먹 쥐었을 때 =====
      // 오디오 필터 주파수를 극단적으로 낮춰서 물 속에 잠긴 듯한 소리
      filter.freq(200, 0.1); 
      song.rate(0.5); // 느려지는 효과
      
      // 시각적 크래시 (파동)
      fill(0, 0, 0, 0.6);
      rect(0, 0, width, height); // 화면 어둡게
      
      let crashSize = random(100, 300) + bass;
      fill(360, 100, 100, 0.8); // 붉은색 강렬한 포인트
      ellipse(mappedX, mappedY, crashSize, crashSize);
      
      // 화면 흔들림 효과
      translate(random(-15, 15), random(-15, 15));

    } else {
      // ===== [지휘 모드] 손을 폈을 때 =====
      // Y축에 따라 필터 주파수 조절 (위로 갈수록 맑은 원음)
      let freq = map(mappedY, height, 0, 400, 15000);
      freq = constrain(freq, 100, 20000);
      filter.freq(freq, 0.2); // 0.2초에 걸쳐 부드럽게 주파수 변경
      
      // X축에 따라 재생 속도 미세 조절 (왼쪽 느리게, 오른쪽 빠르게)
      let targetRate = map(mappedX, 0, width, 0.8, 1.2);
      targetRate = constrain(targetRate, 0.5, 2.0);
      
      // 오디오 찢어짐(Glitch) 방지를 위한 재생 속도 스무딩
      currentRate = lerp(currentRate, targetRate, 0.1);
      song.rate(currentRate);
      
      // 궤적 속도 계산
      let d = dist(mappedX, mappedY, prevX, prevY);
      speed = lerp(speed, d, 0.1); 
      
      let hueValue = map(speed, 0, 100, 180, 300); // 파란색 ~ 보라색 계열
      let alphaValue = map(speed, 0, 50, 0.3, 1.0);
      
      // 손 중심 아우라 이펙트
      for(let i=0; i<3; i++) {
        fill(hueValue, 80, 100, alphaValue / (i+1));
        let size = (speed * 2 + 40) + (i * 20);
        ellipse(mappedX, mappedY, size, size);
      }
      
      // 비트에 반응하는 코어
      let coreSize = map(bass, 0, 255, 15, 50);
      fill(0, 0, 100); 
      ellipse(mappedX, mappedY, coreSize, coreSize);
    }
    
    prevX = mappedX;
    prevY = mappedY;
  } else {
    // 손이 인식되지 않으면 기본값으로 부드럽게 복귀
    filter.freq(10000, 0.1);
    song.rate(1.0);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 비디오 크기는 최적화를 위해 고정(640x480)시켰으므로 여기서 리사이즈하지 않음.
}
