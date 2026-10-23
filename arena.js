import * as THREE from "three";

// アリーナの3Dオブジェクトをつくる
export function createArena(scene) {
  const geometry = new THREE.BoxGeometry(4, 2, 3);

  const material = new THREE.MeshStandardMaterial({
    color: 0x44aa88
  });

  const box = new THREE.Mesh(geometry, material);

  scene.add(box);


  // 🐰 うさぎさんをつくる
  const bunny = new THREE.Group();

  const white = new THREE.MeshStandardMaterial({
    color: 0xfff8f0,
    roughness: 0.9
  });

  const pink = new THREE.MeshStandardMaterial({
    color: 0xff91ad
  });

  const black = new THREE.MeshStandardMaterial({
    color: 0x25202a
  });

  // 球体を使って体のパーツを作る関数
  function bunnyPart(material, position, scale) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      material
    );

    mesh.position.set(...position);
    mesh.scale.set(...scale);
    bunny.add(mesh);

    return mesh;
  }

  // 体
  bunnyPart(white, [0, 0.28, 0], [0.24, 0.31, 0.20]);

  // しっぽ
  bunnyPart(white, [0, 0.17, -0.19], [0.10, 0.10, 0.10]);

  // 頭
  bunnyPart(white, [0, 0.68, 0.02], [0.25, 0.24, 0.23]);

  // 左右の長いお耳
  const earL = bunnyPart(
    white, [-0.13, 1.02, 0], [0.085, 0.29, 0.075]
  );
  earL.rotation.z = 0.15;

  const earR = bunnyPart(
    white, [0.13, 1.02, 0], [0.085, 0.29, 0.075]
  );
  earR.rotation.z = -0.15;

  // 耳の内側のピンク
  const innerL = bunnyPart(
    pink, [-0.13, 1.03, 0.064], [0.043, 0.21, 0.018]
  );
  innerL.rotation.z = 0.15;

  const innerR = bunnyPart(
    pink, [0.13, 1.03, 0.064], [0.043, 0.21, 0.018]
  );
  innerR.rotation.z = -0.15;

  // おめめ
  bunnyPart(black, [-0.09, 0.72, 0.224], [0.035, 0.042, 0.022]);
  bunnyPart(black, [0.09, 0.72, 0.224], [0.035, 0.042, 0.022]);

  // お鼻
  bunnyPart(pink, [0, 0.62, 0.248], [0.04, 0.027, 0.022]);

  // ほっぺ
  bunnyPart(pink, [-0.15, 0.62, 0.20], [0.045, 0.03, 0.015]);
  bunnyPart(pink, [0.15, 0.62, 0.20], [0.045, 0.03, 0.015]);

  // 前足
  bunnyPart(white, [-0.15, 0.12, 0.12], [0.10, 0.09, 0.12]);
  bunnyPart(white, [0.15, 0.12, 0.12], [0.10, 0.09, 0.12]);

  // 直方体の上に配置
  bunny.position.set(1.15, 1, 0);
  scene.add(bunny);

  // 🐱 まるい猫ちゃんを作る
  const cat = new THREE.Group();

  const catFur = new THREE.MeshStandardMaterial({
    color: 0xffe5bd,
    roughness: 0.95
  });

  const catPink = new THREE.MeshStandardMaterial({
    color: 0xf58eaa
  });

  const catDark = new THREE.MeshStandardMaterial({
    color: 0x49372f
  });

  const catEye = new THREE.MeshStandardMaterial({
    color: 0x25202a
  });

  function catPart(material, position, scale) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      material
    );

    mesh.position.set(...position);
    mesh.scale.set(...scale);
    cat.add(mesh);
    return mesh;
  }

  // まるい体
  catPart(catFur, [0, 0.28, 0], [0.27, 0.29, 0.22]);

  // 顔
  catPart(catFur, [0, 0.67, 0.02], [0.29, 0.25, 0.23]);

  // とんがった耳
  const earGeometry = new THREE.ConeGeometry(0.10, 0.25, 4);

  const leftEar = new THREE.Mesh(earGeometry, catFur);
  leftEar.position.set(-0.18, 0.91, 0.02);
  leftEar.rotation.z = 0.20;
  cat.add(leftEar);

  const rightEar = new THREE.Mesh(earGeometry, catFur);
  rightEar.position.set(0.18, 0.91, 0.02);
  rightEar.rotation.z = -0.20;
  cat.add(rightEar);

  // 耳の内側
  catPart(catPink, [-0.18, 0.91, 0.09], [0.045, 0.09, 0.015]);
  catPart(catPink, [0.18, 0.91, 0.09], [0.045, 0.09, 0.015]);

  // 目
  catPart(catEye, [-0.105, 0.70, 0.235], [0.035, 0.045, 0.018]);
  catPart(catEye, [0.105, 0.70, 0.235], [0.035, 0.045, 0.018]);

  // 鼻
  catPart(catPink, [0, 0.625, 0.255], [0.035, 0.025, 0.018]);

  // ほっぺ
  catPart(catPink, [-0.18, 0.62, 0.20], [0.045, 0.025, 0.012]);
  catPart(catPink, [0.18, 0.62, 0.20], [0.045, 0.025, 0.012]);

  // ひげ
  const whiskerMaterial = new THREE.LineBasicMaterial({
    color: 0x66564b
  });

  function addWhisker(x1, y1, x2, y2) {
    const points = [
      new THREE.Vector3(x1, y1, 0.23),
      new THREE.Vector3(x2, y2, 0.23)
    ];

    const geometry = new THREE.BufferGeometry()
      .setFromPoints(points);

    cat.add(new THREE.Line(geometry, whiskerMaterial));
  }

  addWhisker(-0.16, 0.64, -0.34, 0.68);
  addWhisker(-0.16, 0.61, -0.34, 0.59);
  addWhisker(0.16, 0.64, 0.34, 0.68);
  addWhisker(0.16, 0.61, 0.34, 0.59);

  

  // 猫ちゃんを配置
  cat.position.set(0, 1, 0);
  scene.add(cat);

  // 🐑 もこもこ羊さん
  const sheep = new THREE.Group();

  const wool = new THREE.MeshStandardMaterial({
    color: 0xfff4df,
    roughness: 1
  });

  const faceMat = new THREE.MeshStandardMaterial({
    color: 0x9b7059,
    roughness: 0.9
  });

  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x49372f
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x211914
  });

  function sheepPart(material, position, scale) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16),
      material
    );

    mesh.position.set(...position);
    mesh.scale.set(...scale);
    sheep.add(mesh);
    return mesh;
  }

  // 体の中心
  sheepPart(wool, [0, 0.35, 0], [0.27, 0.29, 0.22]);

  // 体のもこもこ
  sheepPart(wool, [-0.18, 0.43, 0], [0.15, 0.17, 0.16]);
  sheepPart(wool, [0.18, 0.43, 0], [0.15, 0.17, 0.16]);
  sheepPart(wool, [0, 0.52, 0], [0.17, 0.17, 0.17]);
  sheepPart(wool, [-0.12, 0.27, 0.13], [0.13, 0.14, 0.13]);
  sheepPart(wool, [0.12, 0.27, 0.13], [0.13, 0.14, 0.13]);

  // 頭と顔
  sheepPart(faceMat, [0, 0.69, 0.13], [0.19, 0.22, 0.17]);

  // 頭のてっぺんの毛
  sheepPart(wool, [0, 0.86, 0.12], [0.12, 0.10, 0.12]);
  sheepPart(wool, [-0.08, 0.82, 0.13], [0.08, 0.08, 0.09]);
  sheepPart(wool, [0.08, 0.82, 0.13], [0.08, 0.08, 0.09]);

  // 耳
  sheepPart(faceMat, [-0.22, 0.72, 0.10], [0.10, 0.045, 0.055]);
  sheepPart(faceMat, [0.22, 0.72, 0.10], [0.10, 0.045, 0.055]);

  // 目
  sheepPart(eyeMat, [-0.07, 0.72, 0.28], [0.022, 0.03, 0.015]);
  sheepPart(eyeMat, [0.07, 0.72, 0.28], [0.022, 0.03, 0.015]);

  // 鼻先
  sheepPart(faceMat, [0, 0.63, 0.285], [0.065, 0.05, 0.035]);

  // 足を4本
  sheepPart(faceMat, [-0.15, 0.10, 0.10], [0.045, 0.12, 0.045]);
  sheepPart(faceMat, [0.15, 0.10, 0.10], [0.045, 0.12, 0.045]);
  sheepPart(faceMat, [-0.15, 0.10, -0.12], [0.045, 0.12, 0.045]);
  sheepPart(faceMat, [0.15, 0.10, -0.12], [0.045, 0.12, 0.045]);

  // 足先
  sheepPart(hoofMat, [-0.15, 0.035, 0.10], [0.05, 0.035, 0.05]);
  sheepPart(hoofMat, [0.15, 0.035, 0.10], [0.05, 0.035, 0.05]);
  sheepPart(hoofMat, [-0.15, 0.035, -0.12], [0.05, 0.035, 0.05]);
  sheepPart(hoofMat, [0.15, 0.035, -0.12], [0.05, 0.035, 0.05]);

  // 猫ちゃんのさらに横に配置
  sheep.position.set(-1.15, 1, 0);
  scene.add(sheep);
  
  return box;
}