// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { UNITS, ENEMIES } from "../src/data/units";

const prisma = new PrismaClient();

async function upsertUnits() {
  for (const u of UNITS) {
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
        ultName: u.ultName,
        ultDesc: u.ultDesc,
        isPlayable: true, // ✅ 플레이어가 뽑을 수 있는 유닛
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
        ultName: u.ultName,
        ultDesc: u.ultDesc,
        isPlayable: true, // ✅
      },
    });
  }

  for (const e of ENEMIES) {
    await prisma.unit.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        emoji: e.emoji,
        tribe: e.tribe,
        role: e.role,
        rarity: e.rarity,
        img: e.img,
        hpMax: e.hpMax,
        atk: e.atk,
        speed: e.speed,
        ultName: null,
        ultDesc: null,
        isPlayable: false, // ✅ 적 유닛 → 소환 불가
      },
      create: {
        id: e.id,
        name: e.name,
        emoji: e.emoji,
        tribe: e.tribe,
        role: e.role,
        rarity: e.rarity,
        img: e.img,
        hpMax: e.hpMax,
        atk: e.atk,
        speed: e.speed,
        isPlayable: false, // ✅
      },
    });
  }
}

async function upsertDevUserWithStarterParty() {
  const user = await prisma.user.upsert({
    where: { name: "dev" },
    update: {},
    create: { name: "dev", crystal: 300 },
  });

  // dev 계정 스타터 유닛
  const inv1 = await prisma.inventory.create({
    data: { userId: user.id, unitId: "skel_soldier" },
  });
  const inv2 = await prisma.inventory.create({
    data: { userId: user.id, unitId: "orc_brute" },
  });

  await prisma.party.upsert({
    where: { userId: user.id },
    update: { slots: [inv1.id, inv2.id] },
    create: { userId: user.id, slots: [inv1.id, inv2.id] },
  });
}

async function main() {
  await upsertUnits();
  await upsertDevUserWithStarterParty();
  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
