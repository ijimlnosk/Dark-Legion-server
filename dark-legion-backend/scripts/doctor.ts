import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UNITS = [
  {
    id: "skel_soldier",
    name: "스켈레톤 전사",
    emoji: "☠️",
    tribe: "언데드",
    role: "탱커",
    rarity: 1,
    hpMax: 420,
    atk: 58,
    speed: 88,
    img: "/units/skel_soldier.png",
    ultName: "뼈의 벽",
    ultDesc: "보호막 획득",
    isPlayable: true,
  },
  {
    id: "gob_rogue",
    name: "고블린 도적",
    emoji: "🗡️",
    tribe: "야수",
    role: "딜러",
    rarity: 1,
    hpMax: 300,
    atk: 90,
    speed: 115,
    img: "/units/gob_rogue.png",
    ultName: "암습 연타",
    ultDesc: "2연타",
    isPlayable: true,
  },
  {
    id: "wisp_mage",
    name: "공포의 위습",
    emoji: "🜏",
    tribe: "악마",
    role: "마법사",
    rarity: 2,
    hpMax: 280,
    atk: 110,
    speed: 100,
    img: "/units/wisp_mage.png",
    ultName: "심연의 폭발",
    ultDesc: "광역 피해",
    isPlayable: true,
  },
  {
    id: "orc_brute",
    name: "오크 분쇄자",
    emoji: "💢",
    tribe: "야수",
    role: "딜러",
    rarity: 2,
    hpMax: 520,
    atk: 140,
    speed: 85,
    img: "/units/orc_brute.png",
    ultName: "분쇄 강타",
    ultDesc: "강한 일격",
    isPlayable: true,
  },
  {
    id: "lich_apprentice",
    name: "리치 견습",
    emoji: "🧙‍♂️",
    tribe: "언데드",
    role: "마법사",
    rarity: 3,
    hpMax: 360,
    atk: 140,
    speed: 102,
    img: "/units/lich_apprentice.png",
    ultName: "영혼 흡수",
    ultDesc: "광역+치유",
    isPlayable: true,
  },
  {
    id: "succubus",
    name: "황혼의 서큐버스",
    emoji: "🦇",
    tribe: "악마",
    role: "딜러",
    rarity: 4,
    hpMax: 380,
    atk: 165,
    speed: 120,
    img: "/units/succubus.png",
    ultName: "파멸의 입맞춤",
    ultDesc: "강력 일격",
    isPlayable: true,
  },
  {
    id: "dread_knight",
    name: "공포의 기사",
    emoji: "🛡️",
    tribe: "언데드",
    role: "탱커",
    rarity: 5,
    hpMax: 720,
    atk: 150,
    speed: 95,
    img: "/units/dread_knight.png",
    ultName: "무덤의 서약",
    ultDesc: "전체 보호막",
    isPlayable: true,
  },
] as const;

const ENEMIES = [
  {
    id: "royal_soldier",
    name: "왕국 병사",
    emoji: "🛡️",
    tribe: "인간",
    role: "탱커",
    rarity: 1,
    img: "/units/royal_soldier.png",
    hpMax: 600,
    atk: 70,
    speed: 90,
    isPlayable: false,
  },
  {
    id: "royal_archer",
    name: "왕국 궁수",
    emoji: "🏹",
    tribe: "인간",
    role: "딜러",
    rarity: 1,
    img: "/units/royal_archer.png",
    hpMax: 500,
    atk: 95,
    speed: 105,
    isPlayable: false,
  },
  {
    id: "temple_wizard",
    name: "성전 마법사",
    emoji: "✨",
    tribe: "인간",
    role: "마법사",
    rarity: 2,
    img: "/units/temple_wizard.png",
    hpMax: 480,
    atk: 110,
    speed: 98,
    isPlayable: false,
  },
] as const;

async function ensureUnits() {
  // upsert 모든 유닛
  for (const u of [...UNITS, ...ENEMIES]) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        emoji: u.emoji,
        tribe: u.tribe,
        role: u.role,
        rarity: u.rarity,
        img: u.img,
        hpMax: u.hpMax,
        atk: u.atk,
        speed: u.speed,
        ultName: (u as any).ultName ?? null,
        ultDesc: (u as any).ultDesc ?? null,
        isPlayable: u.isPlayable,
      },
      create: {
        id: u.id,
        name: u.name,
        emoji: u.emoji,
        tribe: u.tribe,
        role: u.role,
        rarity: u.rarity,
        img: u.img,
        hpMax: u.hpMax,
        atk: u.atk,
        speed: u.speed,
        ultName: (u as any).ultName ?? null,
        ultDesc: (u as any).ultDesc ?? null,
        isPlayable: u.isPlayable,
      },
    });
  }
  const count = await prisma.unit.count();
  console.log(`✅ Unit upsert complete. count=${count}`);
}

async function ensureDevUserAndParty() {
  const user = await prisma.user.upsert({
    where: { name: "dev" },
    update: {},
    create: { name: "dev", crystal: 300 },
  });

  // dev 인벤토리에 같은 유닛이 이미 있으면 재사용
  const existing = await prisma.inventory.findMany({
    where: { userId: user.id, unitId: { in: ["skel_soldier", "orc_brute"] } },
  });

  const needSkel = !existing.find((e) => e.unitId === "skel_soldier");
  const needOrc = !existing.find((e) => e.unitId === "orc_brute");

  const created: string[] = [];
  if (needSkel) {
    const inv = await prisma.inventory.create({
      data: { userId: user.id, unitId: "skel_soldier" },
    });
    created.push(inv.id);
  } else {
    created.push(existing.find((e) => e.unitId === "skel_soldier")!.id);
  }
  if (needOrc) {
    const inv = await prisma.inventory.create({
      data: { userId: user.id, unitId: "orc_brute" },
    });
    created.push(inv.id);
  } else {
    created.push(existing.find((e) => e.unitId === "orc_brute")!.id);
  }

  await prisma.party.upsert({
    where: { userId: user.id },
    update: { slots: created },
    create: { userId: user.id, slots: created },
  });

  const invCount = await prisma.inventory.count({ where: { userId: user.id } });
  console.log(
    `✅ dev ready. inventory=${invCount}, partySlots=${created.length}`
  );
}

async function main() {
  await ensureUnits();
  await ensureDevUserAndParty();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
