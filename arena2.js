
import * as THREE from "three";

export function createArena(scene) {

  // =====================================
  // Arena Root
  // =====================================

  const arena = new THREE.Group();
  arena.name = "NOVA_ARENA";

  // Materials
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333b46
  });

  const courtMaterial = new THREE.MeshStandardMaterial({
    color: 0xc99a65
  });

  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x526b86
  });

  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x263f60
  });

  // =====================================
  // Main Floor
  // =====================================

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.5, 42),
    floorMaterial
  );

  floor.position.y = -0.3;
  arena.add(floor);

  // =====================================
  // Basketball Court
  // =====================================

  const court = new THREE.Mesh(
    new THREE.BoxGeometry(15, 0.15, 28),
    courtMaterial
  );

  court.position.y = 0.05;
  arena.add(court);

  // =====================================
  // Court Lines
  // =====================================

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff
  });

  function addLine(points) {
    const geometry = new THREE.BufferGeometry()
      .setFromPoints(points);

    const line = new THREE.Line(
      geometry,
      lineMaterial
    );

    arena.add(line);
  }

  // Outer boundary
  addLine([
    new THREE.Vector3(-7.5, 0.14, -14),
    new THREE.Vector3(7.5, 0.14, -14),
    new THREE.Vector3(7.5, 0.14, 14),
    new THREE.Vector3(-7.5, 0.14, 14),
    new THREE.Vector3(-7.5, 0.14, -14)
  ]);

  // Center line
  addLine([
    new THREE.Vector3(-7.5, 0.15, 0),
    new THREE.Vector3(7.5, 0.15, 0)
  ]);

  // =====================================
  // Hoop positions
  // =====================================

  function addHoop(z) {

    const hoopMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6633
    });

    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2.5, 0.15),
      floorMaterial
    );

    pole.position.set(0, 1.4, z);
    arena.add(pole);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.06, 8, 24),
      hoopMaterial
    );

    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 3, z);
    arena.add(ring);
  }

  addHoop(-13);
  addHoop(13);

  // =====================================
  // Seat Block Creator
  // =====================================

  function createBlock(config) {

    const {
      id,
      mapOutline,
      mapX,
      mapY,
      side,
      width,
      depth,
      centerX,
      centerZ
    } = config;

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.6, depth),
      blockMaterial
    );

    block.name = `BLOCK_${id}`;

    block.position.set(
      centerX,
      0.65,
      centerZ
    );

    // =================================
    // Seat Data
    // =================================

    const seats = [];

    const seatGeometry = new THREE.BoxGeometry(
      0.8,
      0.5,
      0.8
    );

    const instances = [];

    const dummy = new THREE.Object3D();

    const cameraTarget = new THREE.Vector3(
      0,
      1.5,
      0
    );

    // 3 rows x 5 columns
    for (let row = 0; row < 3; row++) {

      for (let col = 0; col < 5; col++) {

        let x, z;
        let mapPositionX, mapPositionY;

        if (side === "north") {

          x = -4 + col * 2;
          z = -10.5 - row * 1.2;

          mapPositionX = mapX[col];
          mapPositionY = mapY[row];

        } else if (side === "south") {

          x = -4 + col * 2;
          z = 10.5 + row * 1.2;

          mapPositionX = mapX[col];
          mapPositionY = mapY[row];

        } else if (side === "west") {

          x = -10.5 - row * 1.2;
          z = -4 + col * 2;

          mapPositionX = mapX[row];
          mapPositionY = mapY[col];

        } else {

          x = 10.5 + row * 1.2;
          z = -4 + col * 2;

          mapPositionX = mapX[row];
          mapPositionY = mapY[col];
        }

        const worldPosition = new THREE.Vector3(
          x,
          1.2,
          z
        );

        // Camera position
        const cameraPosition = worldPosition.clone();

        if (side === "north") {
          cameraPosition.z -= 1.8;
        } else if (side === "south") {
          cameraPosition.z += 1.8;
        } else if (side === "west") {
          cameraPosition.x -= 1.8;
        } else {
          cameraPosition.x += 1.8;
        }

        cameraPosition.y = 2.2;

        // Individual seat data
        seats.push({

          seatId: `${id}-${String(
            row * 5 + col + 1
          ).padStart(3, "0")}`,

          mapX: mapPositionX,
          mapY: mapPositionY,

          cameraPosition: cameraPosition,

          cameraTarget: cameraTarget.clone()

        });

        // Instance position
        dummy.position.copy(worldPosition);

        dummy.rotation.set(0, 0, 0);

        dummy.updateMatrix();

        instances.push(dummy.matrix.clone());

      }
    }

    // =================================
    // Instanced Seats
    // =================================

    const seatMesh = new THREE.InstancedMesh(
      seatGeometry,
      seatMaterial,
      instances.length
    );

    for (let i = 0; i < instances.length; i++) {
      seatMesh.setMatrixAt(i, instances[i]);
    }

    seatMesh.instanceMatrix.needsUpdate = true;

    arena.add(seatMesh);

    // =================================
    // Block UserData
    // =================================

    block.userData.blockId = id;

    block.userData.mapOutline = mapOutline;

    block.userData.seats = seats;

    // Add block
    arena.add(block);

    return block;
  }

  // =====================================
  // A1 - North Block
  // =====================================

  createBlock({

    id: "A1",

    mapOutline:
      "180,35 520,35 520,125 180,125",

    mapX: [215, 275, 335, 395, 455],

    mapY: [58, 85, 112],

    side: "north",

    width: 15,
    depth: 4,

    centerX: 0,
    centerZ: -12

  });

  // =====================================
  // A2 - South Block
  // =====================================

  createBlock({

    id: "A2",

    mapOutline:
      "180,415 520,415 520,505 180,505",

    mapX: [215, 275, 335, 395, 455],

    mapY: [428, 455, 482],

    side: "south",

    width: 15,
    depth: 4,

    centerX: 0,
    centerZ: 12

  });

  // =====================================
  // B1 - West Block
  // =====================================

  createBlock({

    id: "B1",

    mapOutline:
      "25,180 145,180 145,360 25,360",

    mapX: [45, 85, 125],

    mapY: [210, 270, 330],

    side: "west",

    width: 4,
    depth: 15,

    centerX: -12,
    centerZ: 0

  });

  // =====================================
  // B2 - East Block
  // =====================================

  createBlock({

    id: "B2",

    mapOutline:
      "555,180 675,180 675,360 555,360",

    mapX: [575, 615, 655],

    mapY: [210, 270, 330],

    side: "east",

    width: 4,
    depth: 15,

    centerX: 12,
    centerZ: 0

  });

  // =====================================
  // Add Arena to Scene
  // =====================================

  scene.add(arena);

  return arena;
}
