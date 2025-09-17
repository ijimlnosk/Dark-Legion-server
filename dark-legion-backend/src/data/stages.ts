// src/data/stages.ts
export const STAGES = [
  {
    id: "village",
    name: "스테이지 1 — 순례자의 촌락",
    waves: [
      ["royal_soldier", "royal_archer"],
      ["royal_soldier", "temple_wizard"],
      ["royal_soldier", "royal_archer", "temple_wizard"],
    ],
    rewardCrystals: 120,
  },
  {
    id: "rampart",
    name: "스테이지 2 — 오래된 성벽",
    waves: [
      ["royal_soldier", "royal_soldier", "royal_archer"],
      ["temple_wizard", "royal_archer", "royal_archer"],
      ["royal_soldier", "royal_soldier", "temple_wizard"],
    ],
    rewardCrystals: 180,
  },
  {
    id: "moor",
    name: "스테이지 3 — 안개 낀 이탄습지",
    waves: [
      ["royal_archer", "royal_archer"],
      ["royal_soldier", "royal_archer", "temple_wizard"],
      ["royal_soldier", "royal_soldier", "royal_archer"],
    ],
    rewardCrystals: 220,
  },
  {
    id: "crypt",
    name: "스테이지 4 — 봉인된 지하 납골당",
    waves: [
      ["royal_soldier", "royal_archer", "royal_archer"],
      ["royal_soldier", "temple_wizard", "royal_archer"],
      ["royal_soldier", "royal_soldier", "royal_archer", "temple_wizard"],
    ],
    rewardCrystals: 260,
  },
  {
    id: "foundry",
    name: "스테이지 5 — 버려진 제철소",
    waves: [
      ["royal_soldier", "royal_soldier", "royal_archer"],
      ["royal_archer", "royal_archer", "temple_wizard"],
      ["royal_soldier", "royal_soldier", "royal_archer", "royal_archer"],
    ],
    rewardCrystals: 300,
  },
  {
    id: "canals",
    name: "스테이지 6 — 죄수들의 수로",
    waves: [
      ["royal_soldier", "royal_archer", "temple_wizard"],
      ["royal_soldier", "royal_soldier", "royal_archer", "temple_wizard"],
      ["royal_archer", "royal_archer", "royal_archer", "temple_wizard"],
    ],
    rewardCrystals: 340,
  },
  {
    id: "observatory",
    name: "스테이지 7 — 무너진 관측소",
    waves: [
      ["royal_soldier", "royal_soldier", "royal_archer"],
      ["royal_soldier", "royal_archer", "royal_archer", "temple_wizard"],
      [
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "royal_archer",
        "temple_wizard",
      ],
    ],
    rewardCrystals: 380,
  },
  {
    id: "outer_palace",
    name: "스테이지 8 — 궁성 외곽",
    waves: [
      ["royal_soldier", "royal_archer", "royal_archer", "temple_wizard"],
      ["royal_soldier", "royal_soldier", "royal_archer", "temple_wizard"],
      [
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "royal_archer",
        "temple_wizard",
      ],
    ],
    rewardCrystals: 420,
  },
  {
    id: "inner_keep",
    name: "스테이지 9 — 성채 심부",
    waves: [
      ["royal_soldier", "royal_soldier", "royal_archer", "temple_wizard"],
      ["royal_archer", "royal_archer", "royal_archer", "temple_wizard"],
      [
        "royal_soldier",
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "temple_wizard",
      ],
    ],
    rewardCrystals: 460,
  },
  {
    id: "throne_room",
    name: "스테이지 10 — 공허의 옥좌",
    waves: [
      [
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "royal_archer",
        "temple_wizard",
      ],
      [
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "royal_archer",
        "temple_wizard",
      ],
      [
        "royal_soldier",
        "royal_soldier",
        "royal_soldier",
        "royal_archer",
        "royal_archer",
        "temple_wizard",
      ],
    ],
    rewardCrystals: 520,
  },
] as const;
