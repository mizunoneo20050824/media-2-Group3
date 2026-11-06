import * as THREE from "three";
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const ARENA_CONFIG_URL = "./arena-config.json";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f3f7);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const orbitToggle = document.querySelector("#orbit-toggle");
const orbitHint = document.querySelector("#orbit-hint");
const seatMap = document.querySelector("#seat-map-container");
const seatViewBack = document.querySelector("#seat-view-back");

const cameraGoal = new THREE.Vector3();
const targetGoal = new THREE.Vector3();
const cameraStart = new THREE.Vector3();
const targetStart = new THREE.Vector3();
let model = null;
let arenaMetadata = null;
let initialCameraPosition = null;
let initialCameraTarget = null;
let moveStartedAt = 0;
let movingToSeat = false;
let orbitMode = true;
let seatView = false;
let arenaReady = false;
let lookDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let lookYaw = 0;
let lookPitch = 0;
let originalSeatMapSvg = "";
let currentBlockId = null;
let enforcingFloorLimit = false;
let requestedArenaName = "アリーナ";

controls.addEventListener("change", () => {
  const floorHeight = arenaMetadata && arenaMetadata.floorTopY;
  if (!orbitMode || seatView || enforcingFloorLimit ||
      !Number.isFinite(floorHeight)) return;

  const targetBelowFloor = Math.max(0, floorHeight - controls.target.y);
  const cameraBelowFloor = Math.max(0, floorHeight - camera.position.y);
  if (targetBelowFloor === 0 && cameraBelowFloor === 0) return;

  enforcingFloorLimit = true;
  controls.target.y += targetBelowFloor;
  camera.position.y += targetBelowFloor;
  camera.position.y = Math.max(camera.position.y, floorHeight);
  camera.lookAt(controls.target);
  controls.update();
  enforcingFloorLimit = false;
});

function updateOrbitButton() {
  orbitToggle.textContent = "周回モード：" + (orbitMode ? "ON" : "OFF");
  orbitToggle.setAttribute("aria-pressed", String(orbitMode));
  orbitToggle.disabled = !arenaReady;
  orbitHint.hidden = !orbitMode;
  seatViewBack.disabled = movingToSeat;
  controls.enabled = arenaReady && orbitMode && !movingToSeat && !seatView;
}

orbitToggle.addEventListener("click", () => {
  const shouldReturnToOverview = !orbitMode;
  orbitMode = true;
  if (shouldReturnToOverview && initialCameraPosition && initialCameraTarget) {
    currentBlockId = null;
    showOverview();
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialCameraTarget);
    camera.lookAt(controls.target);
    controls.update();
  }
  updateOrbitButton();
});

function syncLookAngles() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  lookYaw = Math.atan2(direction.x, direction.z);
  lookPitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
}

function applyLookDirection() {
  const direction = new THREE.Vector3(
    Math.sin(lookYaw) * Math.cos(lookPitch),
    Math.sin(lookPitch),
    Math.cos(lookYaw) * Math.cos(lookPitch)
  );
  camera.lookAt(camera.position.clone().add(direction));
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (!seatView || movingToSeat || event.button !== 0) return;
  lookDragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (!lookDragging || !seatView || movingToSeat) return;
  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  lookYaw += deltaX * 0.004;
  lookPitch = THREE.MathUtils.clamp(
    lookPitch - deltaY * 0.004,
    -Math.PI / 2 + 0.05,
    Math.PI / 2 - 0.05
  );
  applyLookDirection();
});

function endLookDrag(event) {
  lookDragging = false;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
}
renderer.domElement.addEventListener("pointerup", endLookDrag);
renderer.domElement.addEventListener("pointercancel", endLookDrag);

function findBlock(blockId) {
  let result = null;
  if (model) {
    model.traverse((object) => {
      if (object.userData.blockId === blockId) result = object;
    });
  }
  return result;
}

function showOverview() {
  seatView = false;
  orbitMode = true;
  currentBlockId = null;
  seatMap.hidden = false;
  seatMap.classList.remove("is-detail");
  seatViewBack.hidden = true;
  seatMap.innerHTML = originalSeatMapSvg;
  seatMap.querySelectorAll("[data-block]").forEach((blockElement) => {
    blockElement.addEventListener("click", () => {
      const blockId = blockElement.dataset.block;
      seatMap.querySelectorAll(".block.selected").forEach((selected) => {
        selected.classList.remove("selected");
      });
      blockElement.classList.add("selected");
      showBlockDetail(blockId);
    });
  });
  updateOrbitButton();
}

function showBlockDetail(blockId) {
  const block = findBlock(blockId);
  const seats = block && block.userData.seats;
  if (!block || !Array.isArray(seats) || seats.length === 0 ||
      typeof block.userData.mapOutline !== "string") {
    console.error('Arena block "' + blockId + '" has invalid seat data.');
    return;
  }

  currentBlockId = blockId;
  seatView = false;
  orbitMode = false;
  seatViewBack.hidden = true;
  seatMap.hidden = false;
  seatMap.classList.add("is-detail");

  const outline = block.userData.mapOutline;
  const outlinePoints = outline.split(" ").map((point) => point.split(",").map(Number));
  const allX = [...outlinePoints.map((point) => point[0]), ...seats.map((seat) => seat.mapX)];
  const allY = [...outlinePoints.map((point) => point[1]), ...seats.map((seat) => seat.mapY)];
  const blockMinX = Math.min(...allX);
  const blockMaxX = Math.max(...allX);
  const blockMinY = Math.min(...allY);
  const blockMaxY = Math.max(...allY);
  const padding = 50;
  const minX = blockMinX - padding;
  const minY = blockMinY - padding;
  const width = blockMaxX - blockMinX + padding * 2;
  const height = blockMaxY - blockMinY + padding * 2;
  const courtSide = block.userData.courtSide;
  const centerX = (blockMinX + blockMaxX) / 2;
  const centerY = (blockMinY + blockMaxY) / 2;
  let courtSideLabel;
  if (courtSide === "bottom") {
    courtSideLabel = '<text class="court-side-label" x="' + centerX + '" y="' +
      (blockMaxY + 12) + '">コート側 ↓</text>';
  } else if (courtSide === "top") {
    courtSideLabel = '<text class="court-side-label" x="' + centerX + '" y="' +
      (blockMinY - 9) + '">↑ コート側</text>';
  } else if (courtSide === "right") {
    courtSideLabel = '<text class="court-side-label" x="' + (blockMaxX + 12) + '" y="' +
      centerY + '">コート側 →</text>';
  } else {
    courtSideLabel = '<text class="court-side-label" x="' + (blockMinX - 12) + '" y="' +
      centerY + '">← コート側</text>';
  }
  const seatDots = seats.map((seat, index) =>
    '<circle class="seat-marker" data-seat-index="' + index + '" cx="' + seat.mapX +
    '" cy="' + seat.mapY + '" r="2.5"><title>' + seat.seatId + '</title></circle>'
  ).join("");

  seatMap.innerHTML =
    '<div class="seat-map-header">' +
      '<button class="map-back" type="button">← ブロック図</button>' +
      '<strong>' + blockId + ' の座席</strong>' +
      '<span>' + seats.length + '席</span>' +
    '</div>' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + minX + " " + minY + " " +
      width + " " + height + '" role="group" aria-label="' +
      blockId + 'の座席一覧。コート側を表示">' +
      '<polygon class="detail-block" points="' + outline + '" />' +
      '<g>' + seatDots + '</g>' +
      courtSideLabel +
    '</svg>';

  seatMap.querySelector(".map-back").addEventListener("click", showOverview);
  seatMap.querySelectorAll("[data-seat-index]").forEach((seatElement) => {
    seatElement.addEventListener("click", () => {
      const seat = seats[Number(seatElement.dataset.seatIndex)];
      showSeatView(seat);
    });
  });
  updateOrbitButton();
}

function showSeatView(seat) {
  if (!seat || !seat.cameraPosition || !seat.cameraPosition.isVector3 ||
      !seat.cameraTarget || !seat.cameraTarget.isVector3) {
    console.error('Seat "' + (seat && seat.seatId || "unknown") +
      '" has invalid camera vectors.');
    return;
  }

  seatView = true;
  seatMap.hidden = true;
  seatViewBack.hidden = false;
  orbitMode = false;
  cameraGoal.copy(seat.cameraPosition);
  targetGoal.copy(seat.cameraTarget);
  cameraStart.copy(camera.position);
  targetStart.copy(controls.target);
  moveStartedAt = performance.now();
  movingToSeat = true;
  updateOrbitButton();
}

seatViewBack.addEventListener("click", () => {
  if (currentBlockId) showBlockDetail(currentBlockId);
  else showOverview();
  updateOrbitButton();
});

function readVector3(value, label) {
  if (!Array.isArray(value) || value.length !== 3 ||
      !value.every(Number.isFinite)) {
    throw new Error('Arena metadata "' + label +
      '" must be an array of three finite numbers.');
  }
  return new THREE.Vector3(...value);
}

function validateArenaAndMap(arenaRoot, metadata, svgText) {
  if (!metadata || metadata.formatVersion !== 1) {
    throw new Error("The arena module must provide userData.arena with formatVersion 1.");
  }
  if (!Number.isFinite(metadata.floorTopY)) {
    throw new Error("Arena metadata must provide a finite floorTopY.");
  }
  const isFiniteArray = (value, length) =>
    Array.isArray(value) && value.length === length && value.every(Number.isFinite);
  if (!metadata.court || !isFiniteArray(metadata.court.center, 3) ||
      !isFiniteArray(metadata.court.size, 2) ||
      metadata.court.size.some((value) => value <= 0) ||
      !Number.isFinite(metadata.court.surfaceY) || !metadata.map ||
      !isFiniteArray(metadata.map.viewBox, 4) ||
      metadata.map.viewBox[2] <= 0 || metadata.map.viewBox[3] <= 0 ||
      !isFiniteArray(metadata.map.svgCenter, 2) ||
      !isFiniteArray(metadata.map.worldCenter, 2) ||
      !Number.isFinite(metadata.map.unitsPerMetre) ||
      metadata.map.unitsPerMetre <= 0) {
    throw new Error("Arena metadata must provide court and map dimensions.");
  }

  const initialPosition = readVector3(metadata.initialView && metadata.initialView.position,
    "initialView.position");
  const initialTarget = readVector3(metadata.initialView && metadata.initialView.target,
    "initialView.target");
  const modelBlocks = new Map();
  arenaRoot.traverse((object) => {
    const id = object.userData.blockId;
    if (typeof id !== "string") return;
    if (modelBlocks.has(id)) throw new Error('Duplicate 3D block ID "' + id + '".');
    const outlinePoints = typeof object.userData.mapOutline === "string"
      ? object.userData.mapOutline.trim().split(/\s+/)
        .map((point) => point.split(",").map(Number))
      : [];
    if (outlinePoints.length < 3 ||
        outlinePoints.some((point) => point.length !== 2 || !point.every(Number.isFinite)) ||
        !["top", "right", "bottom", "left"].includes(object.userData.courtSide) ||
        !Array.isArray(object.userData.seats) || object.userData.seats.length === 0) {
      throw new Error('3D block "' + id + '" is missing required block data.');
    }
    const seatIds = new Set();
    for (const seat of object.userData.seats) {
      if (typeof seat.seatId !== "string" ||
          !Number.isFinite(seat.mapX) || !Number.isFinite(seat.mapY) ||
          !seat.cameraPosition || !seat.cameraPosition.isVector3 ||
          !seat.cameraTarget || !seat.cameraTarget.isVector3 ||
          !seat.cameraPosition.toArray().every(Number.isFinite) ||
          !seat.cameraTarget.toArray().every(Number.isFinite) ||
          seatIds.has(seat.seatId)) {
        throw new Error('3D block "' + id + '" contains an invalid seat.');
      }
      seatIds.add(seat.seatId);
    }
    modelBlocks.set(id, object);
  });
  if (modelBlocks.size === 0) throw new Error("The arena module contains no selectable blocks.");

  const svgDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (svgDocument.querySelector("parsererror")) throw new Error("The seat map is not valid SVG.");
  const svgRoot = svgDocument.documentElement;
  if (svgRoot.localName !== "svg") throw new Error("The seat map root element must be <svg>.");
  const viewBox = (svgRoot.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) ||
      viewBox.some((value, index) => value !== metadata.map.viewBox[index])) {
    throw new Error("The SVG viewBox must match arena metadata map.viewBox.");
  }

  const svgBlocks = [...svgRoot.querySelectorAll("[data-block]")];
  const svgIds = svgBlocks.map((element) => element.getAttribute("data-block"));
  if (svgIds.some((id) => !id) || new Set(svgIds).size !== svgIds.length) {
    throw new Error("Every SVG block must have a unique data-block ID.");
  }
  if (svgIds.length !== modelBlocks.size || svgIds.some((id) => !modelBlocks.has(id))) {
    throw new Error("SVG data-block IDs must match 3D block IDs exactly.");
  }
  return { initialPosition, initialTarget };
}

async function loadArena() {
  try {
    const configUrl = new URL(ARENA_CONFIG_URL, window.location.href);
    const configResponse = await fetch(configUrl);
    if (!configResponse.ok) {
      throw new Error("Arena config load failed: " + configResponse.status);
    }
    const config = await configResponse.json();
    if (config.formatVersion !== 1 || typeof config.arenaId !== "string" ||
        typeof config.name !== "string" || typeof config.module !== "string" ||
        typeof config.seatMap !== "string") {
      throw new Error("Arena config must provide formatVersion, arenaId, name, module, and seatMap.");
    }
    requestedArenaName = config.name;

    const moduleUrl = new URL(config.module, configUrl);
    const seatMapUrl = new URL(config.seatMap, configUrl);
    const arenaModule = await import(moduleUrl.href);
    if (typeof arenaModule.createArena !== "function") {
      throw new Error("Arena module must export createArena(scene).");
    }
    model = arenaModule.createArena(scene);
    if (!model || !model.isObject3D) {
      throw new Error("createArena(scene) must return a Three.js Object3D.");
    }
    arenaMetadata = model.userData.arena;

    const svgResponse = await fetch(seatMapUrl);
    if (!svgResponse.ok) throw new Error("Seat map load failed: " + svgResponse.status);
    originalSeatMapSvg = await svgResponse.text();

    const view = validateArenaAndMap(model, arenaMetadata, originalSeatMapSvg);
    initialCameraPosition = view.initialPosition;
    initialCameraTarget = view.initialTarget;
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialCameraTarget);
    camera.lookAt(controls.target);
    controls.update();
    if (typeof config.name === "string") {
      document.title = config.name + " - 座席からの見え方";
    }

    arenaReady = true;
    showOverview();
  } catch (error) {
    console.error("アリーナを読み込めませんでした。", error);
    seatMap.hidden = false;
    seatMap.textContent = requestedArenaName + "を読み込めませんでした: " + error.message;
    updateOrbitButton();
  }
}

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(5, 8, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 1));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  if (movingToSeat) {
    const progress = Math.min((performance.now() - moveStartedAt) / 900, 1);
    const eased = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(cameraStart, cameraGoal, eased);
    controls.target.lerpVectors(targetStart, targetGoal, eased);
    if (progress === 1) {
      movingToSeat = false;
      updateOrbitButton();
      camera.lookAt(controls.target);
      if (seatView) syncLookAngles();
      else controls.update();
    }
  }
  renderer.render(scene, camera);
}

updateOrbitButton();
animate();
loadArena();
