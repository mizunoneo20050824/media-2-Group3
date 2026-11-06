
import * as THREE from 'three';

export function createArena(scene) {

  // ==========================================
  // NOVA ARENA
  // ==========================================

  const arena = new THREE.Group();
  arena.name = 'NOVA_ARENA';

  // Shared plan-view transform: SVG center (750, 750) is arena world (0, 0),
  // and 12 SVG units represent one metre on both the X and Z axes.
  const mapCenterX = 750;
  const mapCenterY = 750;
  const mapUnitsPerMetre = 12;
  const worldToMap = (x, z) => ({
    x: mapCenterX + x * mapUnitsPerMetre,
    y: mapCenterY + z * mapUnitsPerMetre
  });

  // ---------- Materials ----------

  const makeMat = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const concrete = makeMat(0x44464b);
  const floorMat = makeMat(0x292b30);
  const courtMat = makeMat(0xc99a65);
  const white = makeMat(0xf5f0e5);
  const red = makeMat(0xc92730);
  const metal = makeMat(0x777b80);

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85
  });

  // ---------- Box ----------

  function box(w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );

    mesh.position.set(x, y, z);
    arena.add(mesh);

    return mesh;
  }

  // ==========================================
  // FLOOR
  // ==========================================

  box(140, 1, 90, 0, -0.5, 0, concrete);
  box(78, 0.25, 62, 0, 0.1, 0, floorMat);

  // ==========================================
  // BASKETBALL COURT
  // ==========================================

  box(28, 0.12, 15, 0, 0.3, 0, courtMat);

  function line(x1, z1, x2, z2) {

    const dx = x2 - x1;
    const dz = z2 - z1;

    const mesh = box(
      Math.hypot(dx, dz),
      0.025,
      0.09,
      (x1 + x2) / 2,
      0.37,
      (z1 + z2) / 2,
      white
    );

    mesh.rotation.y = -Math.atan2(dz, dx);
  }

  // Court boundary
  line(-14, -7.5, 14, -7.5);
  line(-14, 7.5, 14, 7.5);
  line(-14, -7.5, -14, 7.5);
  line(14, -7.5, 14, 7.5);

  // Center line
  line(0, -7.5, 0, 7.5);

  // Center circle
  const centerCircle = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.055, 8, 48),
    white
  );

  centerCircle.rotation.x = Math.PI / 2;
  centerCircle.position.set(0, 0.38, 0);
  arena.add(centerCircle);

  // ==========================================
  // BASKETBALL GOALS
  // ==========================================

  for (const side of [-1, 1]) {

    const x = side * 14;

    // Pole
    box(
      0.15, 2.7, 0.15,
      x + side * 1.0, 1.8, 0,
      metal
    );

    // Backboard
    box(
      0.12, 0.9, 1.8,
      x + side * 0.55, 3.0, 0,
      white
    );

    // Rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.055, 8, 32),
      red
    );

    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 2.65, 0);

    arena.add(rim);
  }

  // ==========================================
  // SEAT BLOCK SYSTEM
  // ==========================================

  const seatWidth = 0.43;
  const seatDepth = 0.42;
  const seatSpacing = 0.53;
  const aisleWidth = 1.5;

  // Seat geometries
  const cushionGeometry = new THREE.BoxGeometry(
    seatWidth, 0.16, seatDepth
  );

  const backGeometry = new THREE.BoxGeometry(
    seatWidth, 0.34, 0.09
  );

  const alternateColor = new THREE.Color(0x24272d);
  const normalColor = new THREE.Color(0x111318);

  // Invisible block collider
  const colliderMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false
  });

  // All generated blocks
  const blocks = {};

  // ==========================================
  // CREATE ONE BLOCK
  // ==========================================

  function createBlock(config) {

    const {
      id,
      axis,
      side,
      blockIndex,
      blockCount,
      rows,
      seatsPerRow,
      rowDepth,
      rise,
      baseY,
      innerEdge,
      span
    } = config;

    const courtSide = axis === 'x'
      ? (side < 0 ? 'bottom' : 'top')
      : (side < 0 ? 'right' : 'left');

    const blockWidth = seatsPerRow * seatSpacing;

    const totalWidth =
      blockCount * blockWidth +
      (blockCount - 1) * aisleWidth;

    const availableWidth = Math.min(span, totalWidth);

    const start = -availableWidth / 2;

    // Position of this block along the stand
    const blockStart =
      start +
      blockIndex * (blockWidth + aisleWidth);

    const blockCenter = blockStart + blockWidth / 2;

    // ======================================
    // Block collider
    // ======================================

    const totalDepth = rows * rowDepth;

    const xEdges = axis === 'x'
      ? [blockStart, blockStart + blockWidth]
      : [side * innerEdge, side * (innerEdge + totalDepth)];
    const zEdges = axis === 'x'
      ? [side * innerEdge, side * (innerEdge + totalDepth)]
      : [blockStart, blockStart + blockWidth];
    const minX = Math.min(...xEdges);
    const maxX = Math.max(...xEdges);
    const minZ = Math.min(...zEdges);
    const maxZ = Math.max(...zEdges);
    const topLeft = worldToMap(minX, minZ);
    const bottomRight = worldToMap(maxX, maxZ);
    const mapRect = {
      x: topLeft.x,
      y: topLeft.y,
      w: bottomRight.x - topLeft.x,
      h: bottomRight.y - topLeft.y
    };
    const mapOutline = [
      `${mapRect.x},${mapRect.y}`,
      `${mapRect.x + mapRect.w},${mapRect.y}`,
      `${mapRect.x + mapRect.w},${mapRect.y + mapRect.h}`,
      `${mapRect.x},${mapRect.y + mapRect.h}`
    ].join(' ');

    const colliderGeometry =
      axis === 'x'
        ? new THREE.BoxGeometry(
            blockWidth, 0.2, totalDepth
          )
        : new THREE.BoxGeometry(
            totalDepth, 0.2, blockWidth
          );

    const block = new THREE.Mesh(
      colliderGeometry,
      colliderMaterial
    );

    block.name = `BLOCK_${id}`;

    if (axis === 'x') {

      block.position.set(
        blockCenter,
        baseY - 0.12,
        side * (innerEdge + totalDepth / 2)
      );

    } else {

      block.position.set(
        side * (innerEdge + totalDepth / 2),
        baseY - 0.12,
        blockCenter
      );

    }

    // ======================================
    // Seat data
    // ======================================

    const seats = [];

    const seatCount = rows * seatsPerRow;

    const cushionMesh = new THREE.InstancedMesh(
      cushionGeometry,
      seatMat,
      seatCount
    );

    const backMesh = new THREE.InstancedMesh(
      backGeometry,
      seatMat,
      seatCount
    );

    const dummy = new THREE.Object3D();

    const target = new THREE.Vector3(0, 1.5, 0);

    let instanceIndex = 0;

    // ======================================
    // Generate seats
    // ======================================

    for (let row = 0; row < rows; row++) {

      const distance =
        innerEdge + (row + 0.5) * rowDepth;

      const y = baseY + row * rise;

      for (let col = 0; col < seatsPerRow; col++) {

        let x, z, rotation;

        if (axis === 'x') {

          x = blockStart + (col + 0.5) * seatSpacing;
          z = side * distance;

          rotation = side === -1 ? 0 : Math.PI;

        } else {

          x = side * distance;
          z = blockStart + (col + 0.5) * seatSpacing;

          rotation = side === -1
            ? Math.PI / 2
            : -Math.PI / 2;

        }

        // World position
        const position = new THREE.Vector3(
          x,
          y,
          z
        );

        // ==================================
        // Map position
        // ==================================

        const mapPosition = worldToMap(x, z);
        const mapX = mapPosition.x;
        const mapY = mapPosition.y;

        // ==================================
        // Camera position
        // ==================================

        const cameraPosition = new THREE.Vector3(
          x,
          y + 1.35,
          z
        );

        // ==================================
        // Seat data
        // ==================================

        const seatId =
          `${id}-${String(instanceIndex + 1).padStart(3, '0')}`;

        seats.push({

          seatId,

          mapX,
          mapY,

          cameraPosition,

          cameraTarget: target.clone(),

          instanceId: instanceIndex

        });

        // ==================================
        // Seat rotation and position
        // ==================================

        dummy.position.copy(position);
        dummy.rotation.set(0, rotation, 0);

        // Cushion
        dummy.translateY(0.18);
        dummy.updateMatrix();

        cushionMesh.setMatrixAt(
          instanceIndex,
          dummy.matrix
        );

        // Backrest
        dummy.position.copy(position);
        dummy.rotation.set(0, rotation, 0);

        dummy.translateY(0.39);
        dummy.translateZ(-0.16);

        dummy.updateMatrix();

        backMesh.setMatrixAt(
          instanceIndex,
          dummy.matrix
        );

        // Alternate seat colors
        const color =
          (row + col + blockIndex) % 7 === 0
            ? alternateColor
            : normalColor;

        cushionMesh.setColorAt(instanceIndex, color);
        backMesh.setColorAt(instanceIndex, color);

        instanceIndex++;
      }
    }

    // ======================================
    // Finish InstancedMesh
    // ======================================

    cushionMesh.instanceMatrix.needsUpdate = true;
    backMesh.instanceMatrix.needsUpdate = true;

    cushionMesh.instanceColor.needsUpdate = true;
    backMesh.instanceColor.needsUpdate = true;

    cushionMesh.name = `SEATS_${id}`;
    backMesh.name = `BACKRESTS_${id}`;

    arena.add(cushionMesh);
    arena.add(backMesh);

    // ======================================
    // UserData
    // ======================================

    block.userData.blockId = id;
    block.userData.mapOutline = mapOutline;
    block.userData.courtSide = courtSide;
    block.userData.seats = seats;

    block.userData.seatMesh = cushionMesh;
    block.userData.backMesh = backMesh;

    block.userData.seatCount = seats.length;

    arena.add(block);

    blocks[id] = block;

    return block;
  }

  // ==========================================
  // CREATE STAND
  // ==========================================

  function createStand(config) {

    const {
      prefix,
      axis,
      side,
      blockCount,
      rows,
      seatsPerRow,
      rowDepth,
      rise,
      baseY,
      supportBaseY,
      innerEdge,
      span
    } = config;

    // Build the stand as solid stepped tiers. The top of each tread aligns
    // with the bottom of the seats, so the chairs rest on the steps instead
    // of appearing to float. Keep the existing seat and block coordinates.
    const stepBaseY = supportBaseY ?? 0.225;
    const standWidth = Math.min(
      span,
      blockCount * seatsPerRow * seatSpacing + (blockCount - 1) * aisleWidth
    );
    const standDepth = rows * rowDepth;

    // Give the upper tier a solid substructure down to the arena floor.
    // Its stepped seating remains at the configured height above this base.
    if (stepBaseY > 0.225) {
      const foundationHeight = stepBaseY - 0.225;
      if (axis === 'x') {
        box(
          standWidth, foundationHeight, standDepth,
          0, 0.225 + foundationHeight / 2,
          side * (innerEdge + standDepth / 2),
          concrete
        );
      } else {
        box(
          standDepth, foundationHeight, standWidth,
          side * (innerEdge + standDepth / 2),
          0.225 + foundationHeight / 2, 0,
          concrete
        );
      }
    }

    for (let row = 0; row < rows; row++) {
      const treadTop = baseY + row * rise + 0.1;
      const stepHeight = treadTop - stepBaseY;
      const distance = innerEdge + (row + 0.5) * rowDepth;
      if (stepHeight <= 0) continue;

      if (axis === 'x') {
        box(
          standWidth, stepHeight, rowDepth,
          0, stepBaseY + stepHeight / 2, side * distance,
          concrete
        );
      } else {
        box(
          rowDepth, stepHeight, standWidth,
          side * distance, stepBaseY + stepHeight / 2, 0,
          concrete
        );
      }
    }

    for (let i = 0; i < blockCount; i++) {

      createBlock({

        id: `${prefix}${i + 1}`,

        axis,
        side,

        blockIndex: i,
        blockCount,

        rows,
        seatsPerRow,

        rowDepth,
        rise,
        baseY,
        innerEdge,
        span

      });
    }
  }

  // ==========================================
  // NORTH AND SOUTH STANDS
  // ==========================================

  for (const side of [-1, 1]) {

    const prefix = side === -1 ? 'N' : 'S';
    const name = side === -1 ? 'north' : 'south';

    // Lower tier
    createStand({

      prefix: `${prefix}-L`,

      axis: 'x',
      side,
      tier: 'lower',

      blockCount: 3,

      rows: 15,
      seatsPerRow: 21,

      rowDepth: 0.9,
      rise: 0.32,

      baseY: 0.6,
      supportBaseY: 0.225,
      innerEdge: 11.65,

      span: 62

    });

    const lowerOuterEdge = 11.65 + 15 * 0.9;
    const upperInnerEdge = 26.65;
    const northSouthUpperWidth = Math.min(66, 3 * 22 * seatSpacing + 2 * aisleWidth);
    box(
      northSouthUpperWidth,
      0.2,
      upperInnerEdge - lowerOuterEdge,
      0,
      5.18 - 0.1,
      side * (lowerOuterEdge + upperInnerEdge) / 2,
      concrete
    );

    // Upper tier
    createStand({

      prefix: `${prefix}-U`,

      axis: 'x',
      side,
      tier: 'upper',

      blockCount: 3,

      rows: 13,
      seatsPerRow: 22,

      rowDepth: 1.0,
      rise: 0.42,

      baseY: 7.0,
      supportBaseY: 5.18,
      innerEdge: 26.65,

      span: 66

    });
  }

  // ==========================================
  // EAST AND WEST STANDS
  // ==========================================

  for (const side of [-1, 1]) {

    const prefix = side === -1 ? 'W' : 'E';
    const name = side === -1 ? 'west' : 'east';

    // Lower tier
    createStand({

      prefix: `${prefix}-L`,

      axis: 'z',
      side,
      tier: 'lower',

      blockCount: 2,

      rows: 12,
      seatsPerRow: 20,

      rowDepth: 1.0,
      rise: 0.34,

      baseY: 0.6,
      supportBaseY: 0.225,
      innerEdge: 18.3,

      span: 36

    });

    const lowerOuterEdge = 18.3 + 12 * 1.0;
    const upperInnerEdge = 30.4;
    const eastWestUpperWidth = Math.min(42, 2 * 24 * seatSpacing + aisleWidth);
    box(
      upperInnerEdge - lowerOuterEdge,
      0.2,
      eastWestUpperWidth,
      side * (lowerOuterEdge + upperInnerEdge) / 2,
      4.44 - 0.1,
      0,
      concrete
    );

    // Upper tier
    createStand({

      prefix: `${prefix}-U`,

      axis: 'z',
      side,
      tier: 'upper',

      blockCount: 2,

      rows: 13,
      seatsPerRow: 24,

      rowDepth: 1.05,
      rise: 0.43,

      baseY: 5.8,
      supportBaseY: 4.44,
      innerEdge: 30.4,

      span: 42

    });
  }

  // ==========================================
  // RAILINGS
  // ==========================================

  box(0.12, 0.8, 55, -37, 2.0, 0, metal);
  box(0.12, 0.8, 55, 37, 2.0, 0, metal);

  // ==========================================
  // RED COURT ACCENTS
  // ==========================================

  box(1.2, 0.04, 15, -15.2, 0.38, 0, red);
  box(1.2, 0.04, 15, 15.2, 0.38, 0, red);

  // ==========================================
  // RETURN ARENA
  // ==========================================

  arena.userData.arena = {
    formatVersion: 1,
    name: 'NOVA ARENA',
    units: 'm',
    floorTopY: 0.225,
    court: {
      center: [0, 0.3, 0],
      size: [28, 15],
      surfaceY: 0.36
    },
    map: {
      viewBox: [0, 0, 1500, 1500],
      svgCenter: [750, 750],
      worldCenter: [0, 0],
      unitsPerMetre: 12
    },
    initialView: {
      position: [30, 21, 30],
      target: [0, 2, 0]
    }
  };
  arena.userData.blocks = blocks;

  scene.add(arena);

  return arena;
}
