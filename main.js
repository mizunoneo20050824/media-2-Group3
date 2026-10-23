import * as THREE from "three";
 // 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

import { OrbitControls } from
  'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

import { createArena } from "./arena.js";

// 1. 3D空間を作る
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f3f7);

// 2. カメラを作る
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 4, 7);
camera.lookAt(0, 0, 0);

// 3. 描画するための仕組みを作る
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);
controls.update();

// 4. 直方体を作る
createArena(scene);

// 5. 光を当てる
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(5, 8, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 1));

// 6. 画面サイズが変わったときに対応する
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. 画面に描画する
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();