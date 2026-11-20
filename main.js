import * as THREE from "three";
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { seatLayouts } from "./seat-layouts.js";

const MODEL_URL = "./test.glb";
const MAP_URL = "./national_stadium_seat_blocks.svg";
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
  const svg = seatMap.querySelector("svg");
  seatMap.querySelectorAll("[data-block]").forEach((block) => {
    const bounds = block.getBBox();
    const localCenter = new DOMPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    const point = localCenter.matrixTransform(
      svg.getScreenCTM().inverse().multiply(block.getScreenCTM())
    );
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "block-label");
    label.setAttribute("x", point.x);
    label.setAttribute("y", point.y);
    label.setAttribute("transform", `translate(0 ${point.y * 2}) scale(1 -1)`);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.textContent = block.dataset.block;
    svg.appendChild(label);

    const star = document.createElementNS("http://www.w3.org/2000/svg", "text");
    star.setAttribute("class", "block-star");
    star.setAttribute("x", point.x);
    star.setAttribute("y", point.y);
    star.setAttribute("transform", `translate(0 ${point.y * 2}) scale(1 -1)`);
    star.setAttribute("text-anchor", "middle");
    star.setAttribute("dominant-baseline", "central");
    star.textContent = "★";
    svg.appendChild(star);
    svg.appendChild(label);

    const showStar = () => star.classList.add("visible");
    const hideStar = () => star.classList.remove("visible");
    block.addEventListener("pointerenter", showStar);
    block.addEventListener("pointerleave", hideStar);
    block.addEventListener("focus", showStar);
    block.addEventListener("blur", hideStar);
  });
  seatMap.querySelectorAll("[data-block]").forEach((block) => {
    block.addEventListener("click", () => showBlock(block.dataset.block, block));
    block.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showBlock(block.dataset.block, block);
      }
    });
  });
  updateControlsUi();
}

function showBlock(blockId, blockElement) {
  activeBlock = blockId;
  seatMap.querySelectorAll(".block.selected").forEach((element) => element.classList.remove("selected"));
  blockElement.classList.add("selected");
  const tierId = blockElement.dataset.tier || blockId.slice(0, 2);
  const tier = tiers[tierId] || tiers.T1;
  let sectorIndex = sectors.indexOf(blockElement.dataset.sector || "");
  if (sectorIndex < 0) {
    const bounds = blockElement.getBBox();
    const svg = blockElement.ownerSVGElement;
    const viewBox = svg.viewBox.baseVal;
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const blockCenter = new DOMPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      .matrixTransform(blockElement.getCTM());
    const angle = (Math.atan2(blockCenter.x - centerX, centerY - blockCenter.y) + Math.PI * 2) % (Math.PI * 2);
    sectorIndex = Math.round(angle / (Math.PI / 4)) % sectors.length;
  }
  const seatLayout = seatLayouts[String(blockId)];
  if (seatLayout) {
    showCustomBlock(blockId, seatLayout, tier, sectorIndex);
    return;
  }
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

function showCustomBlock(blockId, layout, tier, sectorIndex) {
  const rowCount = layout.rowSeatCounts.length;
  const svgWidth = 1000;
  const grayRectY = layout.grayRectY ?? 55;
  const grayRectHeight = layout.grayRectHeight ?? 1140;
  const svgHeight = layout.svgHeight || (layout.grayRectHeight
    ? grayRectY + grayRectHeight + 55
    : layout.grayBottomY
      ? layout.grayBottomY + 55
      : 1220);
  const seatWidth = layout.seatWidth || 30;
  const seatHeight = 32;
  const colGap = layout.seatGap ?? 7;
  const rowGap = 16;
  const markers = [];
  let index = 0;

  const wheelchairIds = layout.wheelchairIdsFromRight || [];
  if (wheelchairIds.length) {
    const count = wheelchairIds.length;
    const idsLeftToRight = [...wheelchairIds].reverse();
    const wheelchairSeatSizes = idsLeftToRight.map((id) => id.startsWith("W-")
      ? { width: seatWidth * 1.5, height: seatHeight * 1.5 }
      : { width: seatWidth, height: seatHeight });
    const totalWidth = wheelchairSeatSizes.reduce((sum, size) => sum + size.width, 0) + (count - 1) * colGap;
    const startX = (svgWidth - totalWidth) / 2;
    let nextX = startX;
    for (let col = 0; col < count; col++) {
      const id = idsLeftToRight[col];
      const size = wheelchairSeatSizes[col];
      const x = nextX;
      const y = 29 - size.height / 2;
      const theta = seatTheta(sectorIndex, col, count);
      const radii = seatRadii(tier, 0.9);
      const wheelchairClass = id.startsWith("WA-") ? "wheelchair-seat wheelchair-seat-fwa" : "wheelchair-seat";
      const sizeClass = id.startsWith("W-") ? " wheelchair-seat-fw" : "";
      markers.push(`<g class="seat-choice ${wheelchairClass}${sizeClass}" data-seat-index="${index}" tabindex="0" role="button" aria-label="車椅子席 ${id}"><rect x="${x}" y="${y}" width="${size.width}" height="${size.height}" rx="3"/><text x="${x + size.width / 2}" y="29">${id}</text><title>車椅子席 ${id}</title></g>`);
      seatPositions[index] = new THREE.Vector3(
        radii.x * Math.sin(theta),
        tier.y + rowCount * tier.rise * 0.12,
        -radii.z * Math.cos(theta)
      );
      index++;
      nextX += size.width + colGap;
    }
    const wheelchairIconY = 29;
    const wheelchairIconX = startX - 34;
    const wheelchairIconRightX = startX + totalWidth + 34;
    const wheelchairIcon = (x) => `<g class="wheelchair-icon" transform="translate(${x - 16} ${wheelchairIconY - 16}) scale(0.32)" aria-hidden="true"><rect width="100" height="100" fill="#084b9a"/><circle cx="38" cy="17" r="8" fill="#fff"/><path d="M34 29l3 27h32l14 25 14-6M38 41h25M37 43C17 50 12 72 25 87c14 16 42 11 45-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    markers.push(wheelchairIcon(wheelchairIconX), wheelchairIcon(wheelchairIconRightX));
  }

  for (let row = 1; row <= rowCount; row++) {
    const count = layout.rowSeatCounts[row - 1];
    const rowNumber = layout.firstRowNumber ? layout.firstRowNumber + row - 1 : row;
    const totalRows = layout.totalRows || rowCount;
    const slotCount = layout.rowSlotCounts?.[row - 1] || count;
    const removedSlotNumbers = layout.rowRemovedFromRight?.[row - 1] || [];
    const removedSlotIndexes = new Set(removedSlotNumbers.map((number) => slotCount - number));
    const visibleSlotIndexes = Array.from({ length: slotCount }, (_, slot) => slot)
      .filter((slot) => !removedSlotIndexes.has(slot));
    const totalWidth = slotCount * seatWidth + (slotCount - 1) * colGap;
    const rowCenterX = layout.narrowRows && row <= layout.narrowRows
      ? (layout.narrowSeatCenterXByRow?.[row - 1] ?? layout.narrowSeatCenterX)
      : layout.lowerSeatCenterX || svgWidth / 2;
    const startX = rowCenterX - totalWidth / 2;
    const y = 57 + (totalRows - rowNumber) * (seatHeight + rowGap) + (layout.seatYOffset || 0);
    for (let col = 0; col < count; col++) {
      const x = startX + visibleSlotIndexes[col] * (seatWidth + colGap);
      const theta = seatTheta(sectorIndex, col, count);
      const t = 0.2 + ((rowNumber - 1) / Math.max(totalRows - 1, 1)) * 0.65;
      const radii = seatRadii(tier, t);
      const position = new THREE.Vector3(
        radii.x * Math.sin(theta),
        tier.y + (rowNumber - 1) * tier.rise * 0.12,
        -radii.z * Math.cos(theta)
      );
      const idNumber = layout.rowSeatNumbers?.[row - 1]?.[col]
        ?? (layout.firstSeatNumberAtLeft !== undefined
          ? layout.firstSeatNumberAtLeft - col
          : layout.seatNumberDirection === "ascending"
            ? (layout.rowFirstSeatNumbers?.[row - 1] ?? layout.firstSeatNumberAtRight) + (count - 1 - col)
            : layout.firstSeatNumberAtRight - (count - 1 - col));
      const id = `${blockId}-${rowNumber}-${idNumber}`;
      markers.push(`<g class="seat-choice" data-seat-index="${index}" tabindex="0" role="button" aria-label="${id}"><rect x="${x}" y="${y}" width="${seatWidth}" height="${seatHeight}" rx="3"/><text x="${x + seatWidth / 2}" y="${y + seatHeight / 2}">${id}</text><title>${id}</title></g>`);
      seatPositions[index] = position;
      index++;
    }
  }

  seatMap.classList.add("is-detail");
  const seatCounts = [...new Set(layout.rowSeatCounts)].sort((a, b) => a - b).join("〜");
  const wheelchairSummary = wheelchairIds.length ? `・車椅子席${wheelchairIds.length}席` : "";
  const grayRectWidth = layout.grayRectWidth || 920;
  const grayRectX = (svgWidth - grayRectWidth) / 2;
  const grayRectRight = grayRectX + grayRectWidth;
  const grayShape = layout.backgroundPath
    ? `<path d="${layout.backgroundPath}" fill="#b0b0b0" stroke="#17394c" stroke-width="4"/>`
    : layout.narrowRows
    ? layout.narrowSide === "right"
      ? `<path d="M${grayRectX} 55H${grayRectRight}V${layout.grayBottomY || 1195}H${layout.narrowLeftX}V${layout.grayTransitionY}H${grayRectX}Z" fill="#b0b0b0" stroke="#17394c" stroke-width="4"/>`
      : `<path d="M${grayRectX} 55H${grayRectRight}V${layout.grayTransitionY}H${layout.narrowLeftX + layout.narrowWidth}V${layout.grayBottomY || 1195}H${layout.narrowLeftX}V${layout.grayTransitionY}H${grayRectX}Z" fill="#b0b0b0" stroke="#17394c" stroke-width="4"/>`
    : `<rect x="${grayRectX}" y="${grayRectY}" width="${grayRectWidth}" height="${grayRectHeight}" fill="#b0b0b0" stroke="#17394c" stroke-width="4"/>`;
  const fieldSideX = layout.narrowRows ? layout.narrowSeatCenterX : layout.lowerSeatCenterX || svgWidth / 2;
  const fieldSideY = layout.grayRectHeight
    ? grayRectY + grayRectHeight + 25
    : layout.grayBottomY
      ? layout.grayBottomY + 25
      : 1210;
  const topExtensions = layout.hideTopExtensions ? "" : `<path d="M${grayRectX} 55V20h22v35M${grayRectRight} 55V20h-22v35" fill="#d8d8d8" stroke="#17394c" stroke-width="4"/>`;
  seatMap.innerHTML = `<div class="seat-map-header"><button class="map-back" type="button">ブロック図へ戻る</button><strong>${blockId} の座席</strong><span>${rowCount}行・${seatCounts}席${wheelchairSummary}</span></div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" role="group" aria-label="${blockId} 座席図"><style>.seat-choice rect{fill:#9ec5e8;stroke:#315878;stroke-width:1.5;cursor:pointer}.wheelchair-seat rect{fill:#ffe08a;stroke:#8a6820}.wheelchair-seat-fwa rect{fill:#f3a6c8;stroke:#983d68}.seat-choice:hover rect,.seat-choice:focus rect{fill:#f39b52}.seat-choice text{font:600 6.5px system-ui,sans-serif;fill:#20384c;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.wheelchair-seat-fw text{font-size:9.75px}</style>${grayShape}${topExtensions}${markers.join("")}<text x="${fieldSideX}" y="${fieldSideY}" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="14">フィールド側</text></svg>`;
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
