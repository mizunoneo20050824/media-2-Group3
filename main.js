import * as THREE from "three";
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "./test.glb";
const MAP_URL = "./seat-map.svg";
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f3f7);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 500;
controls.zoomSpeed = 1.5;
const seatMap = document.querySelector("#seat-map-container");
const seatViewBack = document.querySelector("#seat-view-back");
const orbitControls = document.querySelector("#orbit-controls");
const orbitToggle = document.querySelector("#orbit-toggle");
const orbitHint = document.querySelector("#orbit-hint");
let model = null;
let mapSvg = "";
let arenaReady = false;
let seatView = false;
let orbitMode = true;
let pointerDown = false;
let lastPointerX = 0;
let lastPointerY = 0;
let yaw = 0;
let pitch = 0;
let activeBlock = null;
let moveStartPosition = new THREE.Vector3();
let moveStartTarget = new THREE.Vector3();
let seatPosition = new THREE.Vector3();
let seatTarget = new THREE.Vector3();
let moveStartedAt = 0;
let movingToSeat = false;

const tiers = {
  T1: { label: "下段", innerX: 55, innerZ: 90, outerX: 76, outerZ: 112, y: 2.5, rise: 1.1 },
  T2: { label: "中段", innerX: 66, innerZ: 100, outerX: 87, outerZ: 123, y: 12, rise: 1.45 },
  T3: { label: "上段", innerX: 82, innerZ: 115, outerX: 105, outerZ: 137, y: 23, rise: 2.7 }
};
const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

scene.add(new THREE.HemisphereLight(0xffffff, 0x88909a, 2));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(-80, 120, 90);
scene.add(keyLight);

function updateControlsUi() {
  orbitToggle.textContent = `回転操作: ${orbitMode ? "ON" : "OFF"}`;
  orbitToggle.setAttribute("aria-pressed", String(orbitMode));
  orbitToggle.disabled = !arenaReady || seatView;
  orbitHint.hidden = !orbitMode || seatView;
  controls.enabled = arenaReady && orbitMode && !seatView && !movingToSeat;
}

function loadMap() {
  fetch(MAP_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`座席図の読み込みに失敗しました: ${response.status}`);
      return response.text();
    })
    .then((svg) => {
      mapSvg = svg;
      showOverview();
    })
    .catch((error) => showMapError(error));
}

function showMapError(error) {
  console.error(error);
  seatMap.hidden = false;
  seatMap.textContent = error.message;
}

function showOverview() {
  seatView = false;
  movingToSeat = false;
  activeBlock = null;
  seatMap.classList.remove("is-detail");
  seatMap.hidden = false;
  seatViewBack.hidden = true;
  seatMap.innerHTML = mapSvg;
  seatMap.querySelectorAll("[data-block]").forEach((block) => {
    block.addEventListener("click", () => showBlock(block.dataset.block, block));
  });
  updateControlsUi();
}

function showBlock(blockId, blockElement) {
  if (!arenaReady) return;
  activeBlock = blockId;
  seatMap.querySelectorAll(".block.selected").forEach((element) => element.classList.remove("selected"));
  blockElement.classList.add("selected");
  const tierId = blockId.slice(0, 2);
  const sectorIndex = sectors.indexOf(blockId.slice(3));
  if (!tiers[tierId] || sectorIndex < 0) return;
  const tier = tiers[tierId];
  const rowCount = 5;
  const seatCount = 8;
  const markers = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < seatCount; col++) {
      const index = row * seatCount + col;
      const x = 90 + col * 74;
      const y = 100 + row * 82;
      const theta = seatTheta(sectorIndex, col, seatCount);
      const t = 0.2 + row * 0.15;
      const radii = seatRadii(tier, t);
      const position = new THREE.Vector3(radii.x * Math.sin(theta), tier.y + row * tier.rise, -radii.z * Math.cos(theta));
      markers.push(`<g class="seat-choice" data-seat-index="${index}" tabindex="0" role="button" aria-label="${row + 1}列 ${col + 1}番"><circle cx="${x}" cy="${y}" r="18"/><text x="${x}" y="${y + 1}">${col + 1}</text><title>${row + 1}列 ${col + 1}番</title></g>`);
      seatPositions[index] = position;
    }
  }
  seatMap.classList.add("is-detail");
  seatMap.innerHTML = `<div class="seat-map-header"><button class="map-back" type="button">ブロック図へ戻る</button><strong>${blockId} の座席</strong><span>${rowCount}列・${seatCount}席（試作）</span></div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 540" role="group" aria-label="${blockId} 座席図"><style>.seat-choice circle{fill:#9ec5e8;stroke:#315878;stroke-width:2;cursor:pointer}.seat-choice:hover circle,.seat-choice:focus circle{fill:#f39b52}.seat-choice text{font:700 12px system-ui,sans-serif;fill:#20384c;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.row-label{font:14px system-ui,sans-serif;fill:#586b7b;text-anchor:end;dominant-baseline:middle}</style><text x="350" y="38" text-anchor="middle" font-family="system-ui" font-weight="700">フィールド側</text>${Array.from({ length: rowCount }, (_, row) => `<text class="row-label" x="62" y="${101 + row * 82}">${row + 1}列</text>`).join("")}${markers.join("")}</svg>`;
  seatMap.querySelector(".map-back").addEventListener("click", showOverview);
  seatMap.querySelectorAll("[data-seat-index]").forEach((seat) => {
    seat.addEventListener("click", () => enterSeat(Number(seat.dataset.seatIndex)));
    seat.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") enterSeat(Number(seat.dataset.seatIndex));
    });
  });
  updateControlsUi();
}

const seatPositions = [];
function seatTheta(sectorIndex, col, count) {
  const center = sectorIndex * Math.PI / 4;
  const spread = Math.PI / 4 * 0.72;
  return center - spread / 2 + spread * col / (count - 1);
}
function seatRadii(tier, t) {
  return { x: tier.innerX + (tier.outerX - tier.innerX) * t, z: tier.innerZ + (tier.outerZ - tier.innerZ) * t };
}

function enterSeat(index) {
  if (!model || !seatPositions[index]) return;
  seatPosition.copy(seatPositions[index]);
  seatTarget.set(0, 3, 0);
  moveStartPosition.copy(camera.position);
  moveStartTarget.copy(controls.target);
  moveStartedAt = performance.now();
  movingToSeat = true;
  seatView = true;
  seatMap.hidden = true;
  seatViewBack.hidden = false;
  seatViewBack.textContent = "座席図に戻る";
  updateControlsUi();
}

seatViewBack.addEventListener("click", () => {
  seatView = false;
  movingToSeat = false;
  seatMap.hidden = false;
  seatViewBack.hidden = true;
  updateControlsUi();
});

orbitToggle.addEventListener("click", () => {
  orbitMode = !orbitMode;
  updateControlsUi();
});

function syncLookAngles() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  yaw = Math.atan2(direction.x, direction.z);
  pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
}
function applyLookDirection() {
  const direction = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(camera.position.clone().add(direction));
}
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (!seatView || movingToSeat || event.button !== 0) return;
  pointerDown = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  syncLookAngles();
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("pointermove", (event) => {
  if (!pointerDown || !seatView || movingToSeat) return;
  yaw += (event.clientX - lastPointerX) * 0.004;
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lastPointerY) * 0.004, -1.1, 1.1);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  applyLookDirection();
});
function stopLook(event) {
  pointerDown = false;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
}
renderer.domElement.addEventListener("pointerup", stopLook);
renderer.domElement.addEventListener("pointercancel", stopLook);

function loadModel() {
  new GLTFLoader().load(MODEL_URL, (gltf) => {
    model = gltf.scene;
    scene.add(model);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const distance = Math.max(size.x, size.z) * 0.9;
    controls.target.copy(center);
    camera.position.set(center.x + distance, center.y + distance * 0.45, center.z + distance);
    camera.far = Math.max(size.length() * 4, 1000);
    camera.updateProjectionMatrix();
    camera.lookAt(center);
    controls.update();
    arenaReady = true;
    updateControlsUi();
  }, undefined, (error) => showMapError(new Error(`test.glb の読み込みに失敗しました: ${error.message || error}`)));
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
function animate() {
  requestAnimationFrame(animate);
  if (movingToSeat) {
    const t = Math.min((performance.now() - moveStartedAt) / 800, 1);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(moveStartPosition, seatPosition, eased);
    controls.target.lerpVectors(moveStartTarget, seatTarget, eased);
    camera.lookAt(controls.target);
    if (t >= 1) {
      movingToSeat = false;
      controls.enabled = false;
      syncLookAngles();
      updateControlsUi();
    }
  }
  if (controls.enabled) controls.update();
  renderer.render(scene, camera);
}

loadMap();
loadModel();
updateControlsUi();
animate();
