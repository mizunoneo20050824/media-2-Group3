# アリーナデータ形式

この仕様に沿った設定JSON、Three.jsモジュール、SVGを用意すると、共通の画面処理で
「ブロック選択 → 席選択 → 着席視点」を表示できます。アリーナごとに変わる寸法や
ファイル名を `main.js` に書かず、設定とアリーナデータから読み込みます。

この仕様が決めるのは、生成器から表示側へ渡す完成ファイルの形式です。元画像の解析方法、
ブロックや席の配置方法、段差や高さの計算方法は生成器側で決めます。

この文書が定義する形式のバージョンは **1** です。

## ファイル構成

各アリーナは、同じフォルダーに次のファイルを置くことを基本とします。

```text
arenas/
  nova-arena/
    arena.json
    arena.js
    seat.svg
```

`arena.json` はアリーナ名とアセットの場所を示します。

```json
{
  "formatVersion": 1,
  "arenaId": "nova-arena",
  "name": "NOVA ARENA",
  "module": "./arena.js",
  "seatMap": "./seat.svg"
}
```

- `formatVersion` はこの文書の形式バージョンです。
- `arenaId` はアリーナを識別する一意な文字列です。
- `name` は画面や一覧に表示する名前です。
- `module` と `seatMap` は `arena.json` からの相対URLです。
- ファイル名は固定ではありません。設定に書いたパスから読み込みます。

現在は `arena-config.json` が読み込み対象の設定です。将来の選択画面では、選ばれた
アリーナの `arena.json` を読み込むように接続します。

## 座標と単位

- 3Dワールドの長さの単位はメートルです。
- Three.jsの `x,y,z` は、`y` が上方向です。
- 平面図は `x,z` 平面を使います。
- SVG座標は左上が原点で、右が `+X`、下が `+Z` です。
- SVGと3Dの縮尺・原点は、下記のアリーナメタデータの `map` に定義します。
- 固定の `1500 × 1500` や `12 SVG units/m` を `main.js` 側で仮定しません。

`map` の変換は次の式です。

```text
svgX = svgCenter[0] + (worldX - worldCenter[0]) * unitsPerMetre
svgY = svgCenter[1] + (worldZ - worldCenter[1]) * unitsPerMetre
```

3Dモジュールが作る各席の `mapX`・`mapY`、ブロックの `mapOutline` とSVG上の
ブロック外形は、この変換と同じ平面位置を示してください。SVGの `viewBox` は
メタデータの `map.viewBox` と一致させます。

## Three.jsモジュール

`module` のファイルは `three` を読み込み、次の関数を名前付きexportします。

```js
export function createArena(scene) {
  const arena = new THREE.Group();
  // アリーナの床、コート、ブロック、椅子などを作成する
  scene.add(arena);
  return arena;
}
```

- `createArena(scene)` はアリーナ全体を作り、ルートの `THREE.Object3D` を返します。
- 関数は返すルートを `scene` に一度だけ追加します。
- 選択処理で参照するデータは、ルートとブロックの `userData` に設定します。
- 各席の椅子を3D表示します。大量の同形状の椅子には `THREE.InstancedMesh` を使えます。

### ルートのメタデータ

ルートの `userData.arena` に次の情報を設定します。

```js
arena.userData.arena = {
  formatVersion: 1,
  name: "NOVA ARENA",
  units: "m",
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
```

- `floorTopY` は周回カメラが下へ入らない床面の高さです。床メッシュの上面と一致させます。
- `court.center` はコートの中心位置 `[x,y,z]`、`court.size` は `[x,z]` 方向の寸法です。
- `court.surfaceY` はコート表面の高さです。床面より高い場合もあります。
- `map.viewBox` はSVGの `viewBox` を数値配列 `[x,y,width,height]` で表します。
- `map.svgCenter` は3D上の `worldCenter` を写すSVG座標です。
- `map.unitsPerMetre` はSVG上の1メートルあたりの単位数です。
- `initialView.position` と `initialView.target` は初期カメラの位置と注視点です。
- 3要素の座標はすべて `[x,y,z]` のメートル単位です。

### ブロックと席

選択可能な各ブロックは、ルート以下の `THREE.Object3D` として存在し、次の
`userData` を持ちます。

```js
block.userData.blockId = "A1";
block.userData.mapOutline = "20,20 120,20 120,80 20,80";
block.userData.courtSide = "bottom";
block.userData.seats = [{
  seatId: "A1-001",
  mapX: 70,
  mapY: 70,
  cameraPosition: new THREE.Vector3(0, 3, 4),
  cameraTarget: new THREE.Vector3(0, 3, 0)
}];
```

- `blockId` はアリーナ内で一意にし、SVGの `data-block` と完全一致させます。
- `mapOutline` はSVG座標上のブロック外形を表す `"x,y x,y ..."` の点列です。
- `courtSide` はブロック拡大図で「コート側」を示す方向で、`top`、`right`、
  `bottom`、`left` のいずれかです。ブロックIDの文字から方向を推測させません。
- `seats` は空でない配列にし、そのブロックで選択できる全席を1席ずつ含めます。
- 各席の3D椅子もモデル内に配置し、席データと対応させます。列・段の規則から生成するか、
  個別に配置するかは自由です。
- `seatId` はブロック内で一意な文字列です。
- `mapX`・`mapY` はSVG座標上の席位置で、拡大図のクリック位置に使います。
- `cameraPosition`・`cameraTarget` はThree.jsの `THREE.Vector3` です。
  着席時のカメラ位置と、向いている先を表します。
- マップ上の席マーカー、3D椅子、カメラデータは、同じ `seatId` の席を表します。
- 3Dの椅子と床・段は重ならないように配置し、別ブロックの椅子・構造物とも
  干渉させません。

## 座席図SVG

- 有効なXML/SVGで、ルート要素は `<svg>`、`viewBox` はメタデータと一致させます。
- 初期画面にはブロック図を表示します。個別席マーカーは、選択後に3Dモジュールの
  `seats` から画面が描画します。
- 選択可能なブロックごとに `data-block` を一つ設定します。値は3D側の
  `blockId` と一致させ、一意にします。
- 推奨形式は `<g class="block" data-block="A1">...</g>` です。
- ブロック外形と席マーカーの座標は、同じSVG座標系で表します。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1500">
  <g class="block" data-block="A1">
    <polygon points="20,20 120,20 120,80 20,80" />
    <text x="70" y="50">A1</text>
  </g>
</svg>
```

## 読み込み時の検証

読み込み側は、少なくとも次を検証してから画面を表示します。

1. 設定JSONの形式バージョンと `module`・`seatMap` のパス。
2. モジュールが `createArena(scene)` をexportし、ルートObject3Dを返すこと。
3. ルートメタデータ、床高、コート寸法、マップ範囲、初期カメラ値。
4. SVGが有効で、`viewBox` がメタデータと一致すること。
5. SVGと3DのブロックIDが重複なく完全一致すること。
6. 各ブロックに外形、コート側の方向、1席以上の有効な席データがあること。
7. ブロック内の席ID重複、座標の不正、カメラベクトルの不正がないこと。

席やブロックの物理的な干渉は、読み込み時の形式検証だけでは完全には判定できません。
生成側で重なり検査を行い、プレビューで確認します。

形式違反がある場合は、設定のアリーナ名と問題箇所を表示して読み込みを止めます。

## 画面の流れ

1. 現在は `arena-config.json`、将来は選択したアリーナの設定JSONを読み込みます。
2. 設定からThree.jsモジュールとSVGを読み込み、上記の形式検証をします。
3. SVGのブロックを選ぶと、同じIDを持つ3Dブロックの席一覧を表示します。
4. 席を選ぶと席データのカメラ位置へ移動します。着席中は位置を固定し、向きだけを
   マウスで変えられます。

設定JSONはアリーナ名とファイル参照先を指定するもので、座席データ自体は3Dモジュールの
ブロックごとの `seats` 配列に含めます。個別の席を別のJSONやSVGに重複して持つ必要は
ありません。

現在は `arena-config.json` の参照先を変えることで、別アリーナファイルに切り替えます。
将来のアリーナ選択画面は、選択されたアリーナの設定JSONをこの読み込み処理に渡します。
