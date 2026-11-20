// Block-specific seat layouts. Rows and wheelchair IDs are listed from right to left / bottom upward.
const wheelchairIdsFromRight = (firstNumber, numberCount = 8) => Array.from({ length: numberCount }, (_, offset) => {
  const number = firstNumber + offset;
  return offset % 2 === 0 ? [`FWA-${number}`, `FW-${number}`] : [`FW-${number}`, `FWA-${number}`];
}).flat();

const createLayout = (firstSeatNumberAtRight, firstWheelchairNumber) => ({
  rowSeatCounts: [22, 22, ...Array(22).fill(24)],
  idPrefix: "F",
  firstSeatNumberAtRight,
  seatNumberDirection: "ascending",
  wheelchairIdsFromRight: wheelchairIdsFromRight(firstWheelchairNumber),
});

const createRows3to24Layout = (firstSeatNumberAtRight, firstWheelchairNumber) => ({
  rowSeatCounts: Array(22).fill(24),
  idPrefix: "F",
  firstSeatNumberAtRight,
  seatNumberDirection: "ascending",
  firstRowNumber: 3,
  totalRows: 24,
  wheelchairIdsFromRight: wheelchairIdsFromRight(firstWheelchairNumber),
  seatYOffset: 20,
  grayRectWidth: 920,
  grayRectHeight: 1082,
});

const createKjhLayout = (kRight, jRight) => ({
  rowSeatCounts: [
    ...Array(2).fill(21),
    ...Array(4).fill(22),
    23,
    17,
    ...Array(4).fill(18),
    ...Array(2).fill(24),
  ],
  rowFirstSeatNumbers: [
    ...Array(7).fill(kRight),
    ...Array(5).fill(jRight),
    ...Array(2).fill(kRight),
  ],
  idPrefix: "F",
  firstSeatNumberAtRight: kRight,
  seatNumberDirection: "ascending",
  seatWidth: 25,
  seatGap: 5,
  seatYOffset: 20,
  grayBottomY: 753,
  lowerSeatCenterX: 500,
  backgroundPath: "M122.5 55H877.5V165H790V405H877.5V753H122.5V405H210V165H122.5Z",
  hideTopExtensions: true,
  wheelchairIdsFromRight: [],
});

const layoutDefinitions = {
  "131": createLayout(191, 57),
  "134": createLayout(281, 81),
  "133": createLayout(251, 73),
  "132": createLayout(221, 65),
  "130": createLayout(161, 49),
  "129": createLayout(131, 41),
  "128": createLayout(101, 33),
  "127": {
    rowSeatCounts: [...Array(5).fill(24), ...Array(6).fill(26), ...Array(13).fill(28)],
    idPrefix: "F",
    firstSeatNumberAtRight: 71,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(23, 10),
    seatWidth: 26.5,
    seatGap: 5,
  },
  "135": {
    rowSeatCounts: [...Array(5).fill(24), ...Array(6).fill(26), ...Array(13).fill(28)],
    idPrefix: "F",
    firstSeatNumberAtRight: 311,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(89, 10),
    seatWidth: 26.5,
    seatGap: 5,
  },
  "126": {
    rowSeatCounts: [
      ...Array(4).fill(14),
      ...Array(9).fill(16),
      ...Array(9).fill(18),
      ...Array(2).fill(20),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 51,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(17, 6),
    grayRectWidth: 800,
  },
  "136": {
    rowSeatCounts: [
      ...Array(4).fill(14),
      ...Array(9).fill(16),
      ...Array(9).fill(18),
      ...Array(2).fill(20),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 341,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(99, 6),
    grayRectWidth: 800,
  },
  "125": {
    rowSeatCounts: [
      ...Array(5).fill(12),
      ...Array(6).fill(13),
      ...Array(2).fill(14),
      ...Array(11).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtLeft: 48,
    seatNumberDirection: "descending",
    wheelchairIdsFromRight: [
      "FWA-6", "FW-6", "FWA-7", "FW-7", "FW-8", "FWA-8",
      "FWA-9", "FW-9", "FW-10", "FWA-10", "FWA-11", "FW-11",
      "FW-12", "FWA-12", "FWA-13", "FW-13", "FW-14", "FWA-14",
      "FWA-15", "FW-15", "FW-16", "FWA-16",
    ],
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 13,
    narrowSeatCenterX: 270,
    narrowLeftX: 40,
    narrowWidth: 460,
    grayTransitionY: 583,
  },
  "124": {
    rowSeatCounts: Array(11).fill(14),
    idPrefix: "F",
    firstSeatNumberAtRight: 1,
    seatNumberDirection: "ascending",
    firstRowNumber: 14,
    totalRows: 24,
    seatYOffset: 20,
    grayRectWidth: 591,
    grayRectHeight: 554,
    wheelchairIdsFromRight: [
      "FWA-1", "FW-1", "FWA-2", "FW-2", "FW-3",
      "FWA-3", "FWA-4", "FW-4", "FW-5", "FWA-5",
    ],
  },
  "123": {
    rowSeatCounts: [
      ...Array(4).fill(12),
      ...Array(6).fill(13),
      ...Array(14).fill(14),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 201,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: [
      "FWA-72", "FW-72", "FWA-73", "FW-73", "FW-74",
      "FWA-74", "FWA-75", "FW-75", "FW-76", "FWA-76",
    ],
    seatYOffset: 20,
    grayRectWidth: 591,
    grayRectHeight: 1180,
  },
  "122": {
    rowSeatCounts: [
      ...Array(4).fill(24),
      ...Array(6).fill(26),
      ...Array(14).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 171,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: [
      "FWA-61", "FW-61", "FWA-62", "FW-62", "FW-63", "FWA-63",
      "FWA-64", "FW-64", "FW-65", "FWA-65", "FWA-66", "FW-66",
      "FW-67", "FWA-67", "FWA-68", "FW-68", "FW-69", "FWA-69",
      "FWA-70", "FW-70", "FW-71", "FWA-71",
    ],
    seatWidth: 26.5,
    seatGap: 5,
    seatYOffset: 20,
    grayRectHeight: 1180,
  },
  "115": {
    rowSeatCounts: Array(6).fill(14),
    idPrefix: "F",
    firstSeatNumberAtRight: 391,
    seatNumberDirection: "ascending",
    firstRowNumber: 19,
    totalRows: 24,
    wheelchairIdsFromRight: [
      "FWA-116", "FW-116", "FWA-117", "FW-117", "FW-118",
      "FWA-118", "FWA-119", "FW-119", "FW-120", "FWA-120",
    ],
    seatYOffset: 20,
    grayRectWidth: 591,
    grayRectHeight: 314,
  },
  "114": {
    rowSeatCounts: [
      ...Array(3).fill(12),
      ...Array(6).fill(13),
      ...Array(7).fill(14),
      ...Array(6).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 361,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: [
      "FWA-105", "FW-105", "FWA-106", "FW-106", "FW-107", "FWA-107",
      "FWA-108", "FW-108", "FW-109", "FWA-109", "FWA-110", "FW-110",
      "FW-111", "FWA-111", "FWA-112", "FW-112", "FW-113", "FWA-113",
      "FWA-114", "FW-114", "FW-115", "FWA-115",
    ],
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 16,
    narrowSeatCenterX: 730,
    narrowLeftX: 500,
    narrowWidth: 460,
    narrowSide: "right",
    grayTransitionY: 367,
    seatYOffset: 18,
    grayBottomY: 1135,
  },
  "111": createRows3to24Layout(281, 81),
  "110": createRows3to24Layout(251, 73),
  "109": createRows3to24Layout(221, 65),
  "107": createRows3to24Layout(161, 49),
  "106": createRows3to24Layout(131, 41),
  "105": createRows3to24Layout(101, 33),
  "113": {
    rowSeatCounts: [
      ...Array(2).fill(14),
      ...Array(9).fill(16),
      ...Array(9).fill(18),
      ...Array(2).fill(20),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 341,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(99, 6),
    seatYOffset: 20,
    grayRectWidth: 773,
    grayRectHeight: 1082,
  },
  "112": {
    rowSeatCounts: [
      ...Array(3).fill(24),
      ...Array(6).fill(26),
      ...Array(13).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 311,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(89, 10),
    seatWidth: 26.5,
    seatGap: 5,
    seatYOffset: 20,
    grayRectWidth: 917,
    grayRectHeight: 1082,
  },
  "104": {
    rowSeatCounts: [
      ...Array(3).fill(22),
      23,
      ...Array(5).fill(26),
      ...Array(13).fill(28),
    ],
    rowSlotCounts: [
      ...Array(3).fill(24),
      ...Array(6).fill(26),
      ...Array(13).fill(28),
    ],
    rowRemovedFromRight: [
      [9, 10], [9, 10], [9, 10],
      [1, 10, 11],
      ...Array(18).fill([]),
    ],
    rowFirstSeatNumbers: [
      ...Array(3).fill(73),
      74,
      ...Array(18).fill(71),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 73,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(23, 10),
    seatWidth: 26.5,
    seatGap: 5,
    seatYOffset: 20,
    grayRectWidth: 917,
    grayRectHeight: 1082,
  },
  "102": {
    rowSeatCounts: [
      ...Array(3).fill(13),
      ...Array(7).fill(14),
      ...Array(6).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtLeft: 48,
    seatNumberDirection: "descending",
    firstRowNumber: 9,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(6, 11),
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 10,
    narrowSeatCenterX: 270,
    narrowLeftX: 40,
    narrowWidth: 460,
    grayTransitionY: 357,
    grayBottomY: 849,
    seatYOffset: 20,
  },
  "103": {
    rowSeatCounts: [
      ...Array(4).fill(3),
      ...Array(2).fill(4),
      ...Array(5).fill(16),
      ...Array(9).fill(18),
      ...Array(2).fill(20),
    ],
    rowFirstSeatNumbers: [
      ...Array(4).fill(64),
      ...Array(2).fill(63),
      ...Array(5).fill(51),
      ...Array(9).fill(51),
      ...Array(2).fill(51),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 51,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(17, 6),
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 6,
    narrowSeatCenterX: 275,
    narrowSeatCenterXByRow: [...Array(4).fill(260.5), ...Array(2).fill(275)],
    narrowLeftX: 175,
    narrowWidth: 165,
    grayRectWidth: 650,
    grayTransitionY: 840,
    grayBottomY: 1120,
    seatYOffset: 20,
  },
  "108": {
    rowSeatCounts: [...Array(6).fill(12), ...Array(16).fill(24)],
    rowSlotCounts: [...Array(6).fill(24), ...Array(16).fill(24)],
    rowRemovedFromRight: [...Array(6).fill([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), ...Array(16).fill([])],
    rowSeatNumbers: Array.from({ length: 6 }, () => [214, 213, 212, 211, 210, 209, 196, 195, 194, 193, 192, 191]),
    idPrefix: "F",
    firstSeatNumberAtRight: 191,
    seatNumberDirection: "ascending",
    firstRowNumber: 3,
    totalRows: 24,
    wheelchairIdsFromRight: wheelchairIdsFromRight(57, 8),
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 6,
    narrowSeatCenterX: 500,
    grayRectWidth: 740,
    grayBottomY: 1132,
    grayTransitionY: 837,
    backgroundPath: "M130 55H870V1132H652V837H348V1132H130Z",
    seatYOffset: 20,
  },
  "237": {
    rowSeatCounts: [
      ...Array(7).fill(26),
      ...Array(5).fill(21),
      ...Array(2).fill(27),
    ],
    rowFirstSeatNumbers: [
      ...Array(7).fill(231),
      ...Array(5).fill(234),
      ...Array(2).fill(231),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 231,
    seatNumberDirection: "ascending",
    seatWidth: 25,
    seatGap: 5,
    seatYOffset: 20,
    grayBottomY: 753,
    lowerSeatCenterX: 500,
    backgroundPath: "M77.5 55H922.5V165H832.5V405H922.5V753H77.5V405H167.5V165H77.5Z",
    hideTopExtensions: true,
    wheelchairIdsFromRight: [],
  },
  "241": {
    rowSeatCounts: [
      ...Array(3).fill(20),
      ...Array(4).fill(22),
      ...Array(2).fill(16),
      ...Array(3).fill(18),
      ...Array(2).fill(24),
    ],
    rowFirstSeatNumbers: [
      ...Array(7).fill(351),
      ...Array(5).fill(354),
      ...Array(2).fill(351),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 351,
    seatNumberDirection: "ascending",
    seatWidth: 25,
    seatGap: 5,
    seatYOffset: 20,
    grayBottomY: 753,
    lowerSeatCenterX: 500,
    backgroundPath: "M122.5 55H877.5V165H790V405H877.5V753H122.5V405H210V165H122.5Z",
    hideTopExtensions: true,
    wheelchairIdsFromRight: [],
  },
  "242": createKjhLayout(381, 384),
  "244": createKjhLayout(441, 444),
  "243": createKjhLayout(411, 414),
  "232": createKjhLayout(81, 84),
  "231": createKjhLayout(51, 54),
  "230": createKjhLayout(21, 24),
  "248": createKjhLayout(51, 54),
  "249": createKjhLayout(81, 84),
  "251": createKjhLayout(141, 144),
  "252": createKjhLayout(171, 174),
  "254": createKjhLayout(231, 234),
  "255": createKjhLayout(261, 264),
  "256": createKjhLayout(291, 294),
  "218": createKjhLayout(21, 24),
  "222": createKjhLayout(141, 144),
  "223": createKjhLayout(171, 174),
  "120": {
    rowSeatCounts: [
      ...Array(4).fill(12),
      ...Array(6).fill(13),
      ...Array(8).fill(14),
      ...Array(6).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtLeft: 138,
    seatNumberDirection: "descending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(39, 11),
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 18,
    narrowSeatCenterX: 270,
    narrowLeftX: 40,
    narrowWidth: 460,
    grayTransitionY: 357,
    grayBottomY: 1233,
    seatYOffset: 20,
  },
  "119": {
    rowSeatCounts: [
      ...Array(4).fill(12),
      ...Array(6).fill(13),
      ...Array(8).fill(14),
      ...Array(6).fill(28),
    ],
    idPrefix: "F",
    firstSeatNumberAtRight: 81,
    seatNumberDirection: "ascending",
    wheelchairIdsFromRight: wheelchairIdsFromRight(28, 11),
    seatWidth: 24,
    seatGap: 5,
    narrowRows: 18,
    narrowSeatCenterX: 730,
    narrowLeftX: 500,
    narrowWidth: 460,
    narrowSide: "right",
    grayTransitionY: 357,
    grayBottomY: 1233,
    seatYOffset: 20,
  },
};

layoutDefinitions["233"] = {
  ...layoutDefinitions["241"],
  firstSeatNumberAtRight: 111,
  rowFirstSeatNumbers: [
    ...Array(7).fill(111),
    ...Array(5).fill(114),
    ...Array(2).fill(111),
  ],
};

layoutDefinitions["119"].wheelchairIdsFromRight = layoutDefinitions["122"].wheelchairIdsFromRight.map((id) => {
  const [type, number] = id.split("-");
  return `${type}-${Number(number) - 33}`;
});
layoutDefinitions["120"].wheelchairIdsFromRight = layoutDefinitions["122"].wheelchairIdsFromRight.map((id) => {
  const [type, number] = id.split("-");
  return `${type}-${Number(number) - 22}`;
});
layoutDefinitions["102"].wheelchairIdsFromRight = layoutDefinitions["122"].wheelchairIdsFromRight.map((id) => {
  const [type, number] = id.split("-");
  return `${type}-${Number(number) - 55}`;
});

layoutDefinitions["121"] = {
  ...layoutDefinitions["122"],
  firstSeatNumberAtRight: 141,
  wheelchairIdsFromRight: layoutDefinitions["122"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) - 11}`;
  }),
};

const cloneLayoutWithIds = (sourceBlock, firstSeatNumberAtRight, wheelchairNumberOffset) => ({
  ...layoutDefinitions[sourceBlock],
  firstSeatNumberAtRight,
  wheelchairIdsFromRight: layoutDefinitions[sourceBlock].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) + wheelchairNumberOffset}`;
  }),
});

layoutDefinitions["117"] = cloneLayoutWithIds("121", 21, -44);
layoutDefinitions["118"] = cloneLayoutWithIds("121", 51, -33);
layoutDefinitions["145"] = cloneLayoutWithIds("122", 171, 0);
layoutDefinitions["144"] = cloneLayoutWithIds("122", 141, -11);
layoutDefinitions["143"] = cloneLayoutWithIds("122", 111, -22);
layoutDefinitions["142"] = cloneLayoutWithIds("122", 81, -33);
layoutDefinitions["141"] = cloneLayoutWithIds("122", 51, -44);
layoutDefinitions["140"] = cloneLayoutWithIds("122", 21, -55);
layoutDefinitions["139"] = {
  ...layoutDefinitions["123"],
  firstSeatNumberAtLeft: 14,
  firstSeatNumberAtRight: undefined,
  seatNumberDirection: "descending",
  wheelchairIdsFromRight: layoutDefinitions["123"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) - 71}`;
  }),
};
layoutDefinitions["138"] = {
  ...layoutDefinitions["124"],
  firstSeatNumberAtLeft: 404,
  firstSeatNumberAtRight: undefined,
  seatNumberDirection: "descending",
  wheelchairIdsFromRight: layoutDefinitions["124"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) + 115}`;
  }),
};
layoutDefinitions["137"] = {
  ...layoutDefinitions["125"],
  firstSeatNumberAtLeft: undefined,
  firstSeatNumberAtRight: 361,
  seatNumberDirection: "ascending",
  narrowSide: "right",
  narrowSeatCenterX: 730,
  narrowLeftX: 500,
  lowerSeatCenterX: 500,
  wheelchairIdsFromRight: layoutDefinitions["125"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) + 99}`;
  }),
};
layoutDefinitions["116"] = {
  ...layoutDefinitions["123"],
  firstSeatNumberAtLeft: 14,
  seatNumberDirection: "descending",
  wheelchairIdsFromRight: layoutDefinitions["123"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) - 71}`;
  }),
};
layoutDefinitions["101"] = cloneLayoutWithIds("115", 1, -115);
layoutDefinitions["146"] = {
  ...layoutDefinitions["116"],
  firstSeatNumberAtLeft: undefined,
  firstSeatNumberAtRight: 201,
  seatNumberDirection: "ascending",
  wheelchairIdsFromRight: layoutDefinitions["116"].wheelchairIdsFromRight.map((id) => {
    const [type, number] = id.split("-");
    return `${type}-${Number(number) + 71}`;
  }),
};
const clone237WithSectionIds = (kStart, jStart, hStart) => ({
  ...layoutDefinitions["237"],
  firstSeatNumberAtRight: kStart,
  rowFirstSeatNumbers: [
    ...Array(7).fill(kStart),
    ...Array(5).fill(jStart),
    ...Array(2).fill(hStart),
  ],
});
layoutDefinitions["236"] = clone237WithSectionIds(201, 204, 201);
layoutDefinitions["240"] = clone237WithSectionIds(321, 324, 321);
layoutDefinitions["238"] = clone237WithSectionIds(261, 264, 261);
layoutDefinitions["234"] = clone237WithSectionIds(141, 144, 141);

export const seatLayouts = Object.fromEntries(
  Object.entries(layoutDefinitions).map(([blockId, layout]) => [
    blockId,
    {
      ...layout,
      wheelchairIdsFromRight: layout.wheelchairIdsFromRight.map((id) => {
        const [type, number] = id.split("-");
        return `${type.slice(1)}-${blockId}-${number}`;
      }),
    },
  ])
);
