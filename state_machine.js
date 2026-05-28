// --- 글로벌 변수 ---
let song;
let isPlaying = false;
let currentState = -1; // -1: 시작 대기, 0: Creek, 1: Sistema Organico, ...

// 타임라인 기준점 (초 단위)
const TIME_CH0_START = 0;
const TIME_CH1_START = 190; // 3분 10초
const TIME_CH2_START = 380; // 6분 20초
const TIME_CH3_START = 625; // 10분 25초
const TIME_CH4_START = 1235; // 20분 35초
const TIME_END = 1573;       // 26분 13초

function preload() {
  // 전체 오디오 트랙 로드 (로컬 경로에 맞게 수정 필요)
  // song = loadSound('assets/full_track.mp3'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // (임시) 음악 파일이 없어도 테스트 가능하도록 설정
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(255);
}

function draw() {
  background(20); // 기본 배경
  
  if (!isPlaying) {
    // [대기 화면]
    text("Click to Start Media Art", width/2, height/2);
    return; // 음악이 재생 전이면 아래 로직을 실행하지 않음
  }

  // 1. 현재 재생 시간 확인
  // 실제 오디오 파일 사용 시: let currentTime = song.currentTime();
  // 임시 시뮬레이션용 (프레임 카운트로 초 계산):
  let currentTime = frameCount / 60; 

  // 2. 시간에 따른 상태 업데이트 (상태 머신 전환)
  updateState(currentTime);

  // 3. 현재 상태에 맞는 씬 렌더링 (Switch-Case 문)
  switch (currentState) {
    case 0:
      drawChapter0(currentTime);
      break;
    case 1:
      drawChapter1(currentTime);
      break;
    case 2:
      drawChapter2(currentTime);
      break;
    case 3:
      drawChapter3(currentTime);
      break;
    case 4:
      drawChapter4(currentTime);
      break;
    default:
      text("End of Media Art", width/2, height/2);
      break;
  }
  
  // (디버깅용) 우측 상단에 현재 시간 및 상태 표시
  fill(255);
  textSize(16);
  text(`State: ${currentState} | Time: ${currentTime.toFixed(1)}s`, width - 100, 30);
}

// === 상태 업데이트 함수 ===
function updateState(time) {
  if (time >= TIME_CH0_START && time < TIME_CH1_START) {
    if (currentState !== 0) changeState(0);
  } else if (time >= TIME_CH1_START && time < TIME_CH2_START) {
    if (currentState !== 1) changeState(1);
  } else if (time >= TIME_CH2_START && time < TIME_CH3_START) {
    if (currentState !== 2) changeState(2);
  } else if (time >= TIME_CH3_START && time < TIME_CH4_START) {
    if (currentState !== 3) changeState(3);
  } else if (time >= TIME_CH4_START && time < TIME_END) {
    if (currentState !== 4) changeState(4);
  } else if (time >= TIME_END) {
    if (currentState !== 5) changeState(5); // 종료 상태
  }
}

// 씬 전환 시 1번만 실행되는 초기화 로직
function changeState(newState) {
  console.log(`Transitioning to State: ${newState}`);
  currentState = newState;
  
  // 여기서 이전 씬의 무거운 리소스를 지우거나(메모리 관리), 
  // 새 씬에 필요한 변수들을 초기화합니다.
  background(0); 
}

// === 각 챕터별 렌더링 함수 ===

function drawChapter0(t) {
  // Theme: Creek (유기체, 물)
  fill(100, 200, 255);
  ellipse(width/2, height/2, sin(t) * 50 + 100); 
  text("Chapter 0: Creek (Organic Birth)", width/2, height/2 + 100);
}

function drawChapter1(t) {
  // Theme: Sistema Organico (문명, 불, 리듬)
  background(50, 20, 20); // 붉은 기운
  fill(255, 100, 50);
  rectMode(CENTER);
  rect(width/2, height/2, random(200, 220), random(200, 220));
  text("Chapter 1: Sistema Organico (Civilization)", width/2, height/2 + 150);
}

function drawChapter2(t) {
  // Theme: Gengis (확장, 입자 분해 시작)
  fill(200, 200, 200);
  for(let i=0; i<10; i++){
    ellipse(random(width), random(height), 5, 5);
  }
  text("Chapter 2: Gengis (Expansion & Transition)", width/2, height/2);
}

function drawChapter3(t) {
  // Theme: Digital (AI 자의식, 글리치)
  // 난수(random)를 많이 사용하여 불안정한 느낌 연출
  background(random(255) > 240 ? 255 : 0); // 가끔 흰색으로 번쩍임
  fill(0, 255, 0); // 터미널 그린
  text("WARNING: SYSTEM OVERRIDE / GLITCH", random(width), random(height));
}

function drawChapter4(t) {
  // Theme: Wish (8비트, 공진화)
  background(0, 0, 50); // 푸른 밤하늘
  fill(255, 200, 0);
  rect(width/2 - 50, height/2, 50, 50); // 나와
  rect(width/2 + 50, height/2, 50, 50); // 에이전트
  text("Chapter 4: Wish (Co-evolution)", width/2, height/2 - 50);
}

// === 마우스 클릭 시 시작 트리거 ===
function mousePressed() {
  if (!isPlaying) {
    isPlaying = true;
    // 실제 오디오 사용 시 주석 해제
    // if (!song.isPlaying()) {
    //   song.play(); 
    // }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
