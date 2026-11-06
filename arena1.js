import * as THREE from "three";

/**
 * Create the arena layout represented by seat.svg.
 * The court is mapped to 28 x 15 metres on the X/Z plane. Seating blocks
 * are raised two metres above the court and filled with individually
 * selectable, regularly spaced seats.
 */
export function createArena(scene) {
  const arena = new THREE.Group();
  arena.name = "arena1";

  const layout = {
    width: 700,
    depth: 540,
    courtCenterX: 350,
    courtCenterY: 237.5,
    scaleX: 28 / 390,
    scaleZ: 15 / 225
  };
  const floorY = 0;
  const blockY = 0;
  const blockHeight = 2;
  const cornerRadius = 0.16;

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0xe9edf1, roughness: 0.95 }),
    block: new THREE.MeshStandardMaterial({ color: 0x9ec5e8, roughness: 0.8 }),
    blockEdge: new THREE.MeshStandardMaterial({ color: 0x315878, roughness: 0.8 }),
    court: new THREE.MeshStandardMaterial({ color: 0xd9b47c, roughness: 0.9 }),
    courtLine: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x315878, roughness: 0.7 }),
    seatAccent: new THREE.MeshStandardMaterial({ color: 0xf5c66b, roughness: 0.7 })
  };

  // Convert SVG coordinates (origin at upper-left) to centered X/Z coordinates.
  const toWorld = (x, y) => new THREE.Vector3(
    (x - layout.courtCenterX) * layout.scaleX,
    0,
    (y - layout.courtCenterY) * layout.scaleZ
  );

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(layout.width * layout.scaleX, layout.depth * layout.scaleZ),
    materials.floor
  );
  floor.name = "arena-floor";
  floor.rotation.x = -Math.PI / 2;
  const floorCenter = toWorld(layout.width / 2, layout.depth / 2);
  floor.position.set(floorCenter.x, floorY - 0.015, floorCenter.z);
  floor.receiveShadow = true;
  arena.add(floor);

  // SVG rects for the twelve blocks, kept in the same order as the diagram.
  const blocks = [
    { id: "A1", x: 65, y: 35, w: 125, h: 65 },
    { id: "A2", x: 205, y: 35, w: 125, h: 65 },
    { id: "A3", x: 370, y: 35, w: 125, h: 65 },
    { id: "A4", x: 510, y: 35, w: 125, h: 65 },
    { id: "B1", x: 15, y: 125, w: 100, h: 105 },
    { id: "B2", x: 15, y: 245, w: 100, h: 105 },
    { id: "C1", x: 585, y: 125, w: 100, h: 105 },
    { id: "C2", x: 585, y: 245, w: 100, h: 105 },
    { id: "D1", x: 65, y: 390, w: 125, h: 65 },
    { id: "D2", x: 205, y: 390, w: 125, h: 65 },
    { id: "D3", x: 370, y: 390, w: 125, h: 65 },
    { id: "D4", x: 510, y: 390, w: 125, h: 65 }
  ];
  const cornerBlocks = new Set(["A1", "A4", "D1", "D4"]);
  const cornerBounds = {
    A1: { x: 35, y: 35, w: 155, h: 90 },
    A4: { x: 510, y: 35, w: 155, h: 90 },
    D1: { x: 35, y: 365, w: 155, h: 90 },
    D4: { x: 510, y: 365, w: 155, h: 90 }
  };

  function addRoundedBlockShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const left = -width / 2;
    const right = width / 2;
    const top = -depth / 2;
    const bottom = depth / 2;
    const r = Math.min(radius, width / 2, depth / 2);
    shape.moveTo(left + r, top);
    shape.lineTo(right - r, top);
    shape.quadraticCurveTo(right, top, right, top + r);
    shape.lineTo(right, bottom - r);
    shape.quadraticCurveTo(right, bottom, right - r, bottom);
    shape.lineTo(left + r, bottom);
    shape.quadraticCurveTo(left, bottom, left, bottom - r);
    shape.lineTo(left, top + r);
    shape.quadraticCurveTo(left, top, left + r, top);
    return shape;
  }

  function addCurvedCornerShape(blockId, center) {
    const shape = new THREE.Shape();
    const p = (x, y) => {
      const point = toWorld(x, y);
      return [point.x - center.x, -(point.z - center.z)];
    };
    const moveTo = (x, y) => shape.moveTo(...p(x, y));
    const lineTo = (x, y) => shape.lineTo(...p(x, y));
    const curveTo = (cx, cy, x, y) => shape.quadraticCurveTo(...p(cx, cy), ...p(x, y));

    // Each path makes an L that follows the outer arena corner with a smooth bend.
    if (blockId === "A1") {
      moveTo(65, 35); curveTo(35, 35, 35, 65); lineTo(35, 125);
      lineTo(100, 125); curveTo(100, 100, 125, 100); lineTo(190, 100);
      lineTo(190, 35); shape.closePath();
    } else if (blockId === "A4") {
      moveTo(635, 35); curveTo(665, 35, 665, 65); lineTo(665, 125);
      lineTo(600, 125); curveTo(600, 100, 575, 100); lineTo(510, 100);
      lineTo(510, 35); shape.closePath();
    } else if (blockId === "D1") {
      moveTo(65, 455); curveTo(35, 455, 35, 425); lineTo(35, 365);
      lineTo(100, 365); curveTo(100, 390, 125, 390); lineTo(190, 390);
      lineTo(190, 455); shape.closePath();
    } else {
      moveTo(635, 455); curveTo(665, 455, 665, 425); lineTo(665, 365);
      lineTo(600, 365); curveTo(600, 390, 575, 390); lineTo(510, 390);
      lineTo(510, 455); shape.closePath();
    }
    return shape;
  }

  function pointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i];
      const b = polygon[j];
      const crosses = (a.y > y) !== (b.y > y) &&
        x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function makeSeatRecords(block, shape, center) {
    const polygon = shape.getPoints(24);
    const toLocal = (mapX, mapY) => {
      const point = toWorld(mapX, mapY);
      return new THREE.Vector2(point.x - center.x, -(point.z - center.z));
    };
    const allMapPoints = polygon.map((point) => ({
      x: layout.courtCenterX + (center.x + point.x) / layout.scaleX,
      y: layout.courtCenterY + (center.z - point.y) / layout.scaleZ
    }));
    const bounds = cornerBounds[block.id] ?? block;
    const minX = Math.min(...allMapPoints.map((point) => point.x));
    const maxX = Math.max(...allMapPoints.map((point) => point.x));
    const minY = Math.min(...allMapPoints.map((point) => point.y));
    const maxY = Math.max(...allMapPoints.map((point) => point.y));
    const spacingX = 0.58 / layout.scaleX;
    const spacingY = 0.78 / layout.scaleZ;
    const edgeMargin = 3.5;
    const records = [];

    // Keep each block's rows aligned to its diagram bounds while clipping
    // candidates to the actual rounded or L-shaped block outline.
    const startX = bounds.x + edgeMargin;
    const startY = bounds.y + edgeMargin;
    for (let mapY = startY; mapY <= maxY - edgeMargin; mapY += spacingY) {
      for (let mapX = startX; mapX <= maxX - edgeMargin; mapX += spacingX) {
        if (mapX > maxX || mapY > maxY) continue;
        let fits = true;
        for (const dx of [-3.2, 0, 3.2]) {
          for (const dy of [-3.5, 0, 3.5]) {
            const local = toLocal(mapX + dx, mapY + dy);
            if (!pointInPolygon(local.x, local.y, polygon)) fits = false;
          }
        }
        if (!fits) continue;

        const position = toWorld(mapX, mapY);
        const facing = new THREE.Vector3(-position.x, 0, -position.z).normalize();
        const cameraPosition = position.clone().addScaledVector(facing, 0.22);
        cameraPosition.y = blockY + blockHeight + 0.45 + 0.65 + 0.15;
        const cameraTarget = cameraPosition.clone()
          .addScaledVector(facing, 4)
          .add(new THREE.Vector3(0, -0.2, 0));
        records.push({
          blockId: block.id,
          seatId: `${block.id}-${String(records.length + 1).padStart(3, "0")}`,
          mapX,
          mapY,
          position,
          angle: Math.atan2(facing.x, facing.z),
          cameraPosition,
          cameraTarget
        });
      }
    }
    return records;
  }

  function addInstancedSeatPart(parent, records, geometry, material, offset) {
    if (!records.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, records.length);
    mesh.name = "arena-seats";
    const dummy = new THREE.Object3D();
    const localOffset = new THREE.Vector3(...offset);
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    records.forEach((record, index) => {
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), record.angle);
      const rotatedOffset = localOffset.clone().applyQuaternion(rotation);
      dummy.position.set(
        record.position.x + rotatedOffset.x,
        blockY + blockHeight + rotatedOffset.y,
        record.position.z + rotatedOffset.z
      );
      dummy.quaternion.copy(rotation);
      dummy.scale.copy(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.userData.seatRecords = records;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
  }

  for (const block of blocks) {
    const width = block.w * layout.scaleX;
    const depth = block.h * layout.scaleZ;
    const center = toWorld(block.x + block.w / 2, block.y + block.h / 2);
    const shape = cornerBlocks.has(block.id)
      ? addCurvedCornerShape(block.id, center)
      : addRoundedBlockShape(width, depth, cornerRadius);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: blockHeight,
      bevelEnabled: false,
      curveSegments: 6
    });
    // ExtrudeGeometry extrudes along local +Z; rotate it so the extrusion is vertical.
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, blockY, 0);

    const mesh = new THREE.Mesh(geometry, materials.block);
    mesh.name = `block-${block.id}`;
    mesh.position.set(center.x, 0, center.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.blockId = block.id;
    arena.add(mesh);

    // A thin outline keeps the seating zones visually distinct from above.
    const shapePoints = shape.getPoints(32);
    const outlinePoints = shapePoints.map((point) =>
      new THREE.Vector3(point.x, blockY + blockHeight + 0.006, -point.y)
    );
    outlinePoints.push(outlinePoints[0].clone());
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      new THREE.LineBasicMaterial({ color: 0x315878 })
    );
    outline.position.set(center.x, 0, center.z);
    arena.add(outline);

    const seatRecords = makeSeatRecords(block, shape, center);
    mesh.userData.seats = seatRecords;
    const mapOutline = shapePoints.map((point) => {
      const mapX = layout.courtCenterX + (center.x + point.x) / layout.scaleX;
      const mapY = layout.courtCenterY + (center.z - point.y) / layout.scaleZ;
      return `${mapX.toFixed(2)},${mapY.toFixed(2)}`;
    }).join(" ");
    mesh.userData.mapOutline = mapOutline;

    const supportGeometry = new THREE.BoxGeometry(0.09, 0.35, 0.09);
    const cushionGeometry = new THREE.BoxGeometry(0.44, 0.10, 0.44);
    const backGeometry = new THREE.BoxGeometry(0.44, 0.45, 0.08);
    addInstancedSeatPart(arena, seatRecords, supportGeometry, materials.seat, [0, 0.175, 0]);
    addInstancedSeatPart(arena, seatRecords, cushionGeometry, materials.seatAccent, [0, 0.40, 0]);
    addInstancedSeatPart(arena, seatRecords, backGeometry, materials.seat, [0, 0.625, -0.17]);
  }

  // Court: SVG rectangle at x=155, y=125, w=390, h=225.
  const courtWidth = 28;
  const courtDepth = 15;
  const courtCenter = toWorld(layout.courtCenterX, layout.courtCenterY);
  const court = new THREE.Mesh(
    new THREE.BoxGeometry(courtWidth, 0.035, courtDepth),
    materials.court
  );
  court.name = "court";
  court.position.set(courtCenter.x, floorY + 0.01, courtCenter.z);
  court.receiveShadow = true;
  arena.add(court);

  const courtY = floorY + 0.029;
  function addCourtLine(x1, y1, x2, y2, thickness = 0.025) {
    const start = toWorld(x1, y1);
    const end = toWorld(x2, y2);
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(Math.hypot(dx, dz), thickness, 0.018),
      materials.courtLine
    );
    line.position.set((start.x + end.x) / 2, courtY, (start.z + end.z) / 2);
    line.rotation.y = -Math.atan2(dz, dx);
    arena.add(line);
  }

  // Midcourt line.
  addCourtLine(350, 125, 350, 350, 0.018);

  // Center circle, drawn as a thin ring on the court surface.
  const centerCircle = new THREE.Mesh(
    new THREE.TorusGeometry(1.83, 0.025, 6, 64),
    materials.courtLine
  );
  centerCircle.rotation.x = Math.PI / 2;
  centerCircle.position.set(courtCenter.x, courtY + 0.01, courtCenter.z);
  arena.add(centerCircle);

  // Key rectangles from the SVG.
  function addCourtRect(x, y, width, height) {
    addCourtLine(x, y, x + width, y, 0.018);
    addCourtLine(x + width, y, x + width, y + height, 0.018);
    addCourtLine(x + width, y + height, x, y + height, 0.018);
    addCourtLine(x, y + height, x, y, 0.018);
  }
  addCourtRect(155, 190, 65, 95);
  addCourtRect(480, 190, 65, 95);

  scene.add(arena);
  return arena;
}

export default createArena;
