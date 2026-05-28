import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let features;
let audio;
let currentVolume = 0;
let clock;

let plants = [];
let brainModel;

init();
animate();

function init() {
  // 1. 씬 구성
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // 하늘색 배경

  // 2. 카메라 설정
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 0, 1000);

  // 3. 렌더러 설정
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // 4. 컨트롤 설정
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 5. 조명 설정
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xaaddff, 0.5);
  backLight.position.set(-1, -1, -1).normalize();
  scene.add(backLight);

  // 6. 바닥 (푸른 초원)
  const floorGeo = new THREE.PlaneGeometry(5000, 5000);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x228B22, 
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -300;
  scene.add(floor);

  // 7. 정원 식물들
  const plantsGroup = new THREE.Group();
  scene.add(plantsGroup);

  const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
  const numPlants = 50;

  for (let i = 0; i < numPlants; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 100 + Math.random() * 1400;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = -290;

    const color = new THREE.Color(
      (100 + Math.random() * 155) / 255,
      1.0,
      (100 + Math.random() * 155) / 255
    );

    const mat = new THREE.MeshStandardMaterial({ 
      color: color, 
      transparent: true, 
      opacity: 0.8,
      roughness: 0.5
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.set(x, y, z);
    
    const sizeOffset = Math.random() * 100;
    const baseScale = 10 + Math.random() * 20;
    mesh.scale.set(baseScale, baseScale, baseScale);

    plantsGroup.add(mesh);
    plants.push({ mesh, sizeOffset, baseScale });
  }

  // 8. 뇌 모델 로드
  const loader = new GLTFLoader();
  loader.load('human-brain.glb', (gltf) => {
    brainModel = gltf.scene;
    scene.add(brainModel);
    
    // 모델 중심을 원점으로 맞추기
    const box = new THREE.Box3().setFromObject(brainModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    brainModel.position.x += (brainModel.position.x - center.x);
    brainModel.position.y += (brainModel.position.y - center.y);
    brainModel.position.z += (brainModel.position.z - center.z);
    
    // 뇌 위치를 살짝 위로
    brainModel.position.y += 50;

    // 투명도 설정
    brainModel.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = 0.6;
          child.material.depthWrite = false;
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    // 카메라 거리 조절
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 2.5;
  }, undefined, (error) => {
    console.error('모델 로딩 실패:', error);
  });

  // 9. 오디오 및 피처 로드
  fetch('music_features.json')
    .then(r => r.json())
    .then(data => {
      features = data;
    })
    .catch(err => console.error('피처 로드 실패:', err));

  audio = new Audio('Hiroshi Yoshimura - CREEK.mp3');
  
  const playBtn = document.getElementById('playBtn');
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.innerText = '⏸ Pause Music';
    } else {
      audio.pause();
      playBtn.innerText = '▶ Play Music';
    }
  });

  clock = new THREE.Clock();

  // 윈도우 리사이즈
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // 오디오 볼륨 계산
  if (!audio.paused && features && features.volume) {
    const t = audio.currentTime;
    const times = features.volume.times;
    const values = features.volume.values;
    for (let i = 0; i < times.length; i++) {
      if (times[i] >= t) {
        currentVolume = values[Math.max(0, i - 1)]; 
        break;
      }
    }
  }

  // 식물 애니메이션
  plants.forEach(p => {
    p.mesh.position.y = -290 + Math.sin(time * 2 + p.sizeOffset) * 10;
    const scale = p.baseScale * (1 + currentVolume * 2);
    p.mesh.scale.set(scale, scale, scale);
  });

  // 뇌 모델 회전 및 반응
  if (brainModel) {
    brainModel.rotation.y = time * 0.1;
    const scale = 1 + currentVolume * 0.5;
    brainModel.scale.set(scale, scale, scale);
  }

  controls.update();
  renderer.render(scene, camera);
}
