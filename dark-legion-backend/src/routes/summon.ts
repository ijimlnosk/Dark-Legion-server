// src/routes/summon.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// 기본 확률(합=100)
const RATES: Record<number, number> = { 1: 40, 2: 30, 3: 15, 4: 10, 5: 5 };

// ENEMY(왕국군) 제외 필터 — 스키마에 isPlayable 없을 때 사용
const playableWhereBase = { isPlayable: true } as const;

function weightedPick(weights: Record<number, number>) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (const [rarStr, w] of Object.entries(weights)) {
    acc += w;
    if (roll < acc) return Number(rarStr);
  }
  return Number(Object.keys(weights)[0]!);
}

router.post("/one", async (req, res) => {
  const userId = req.userId!;

  // 1) 결정 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { crystal: true },
  });
  if (!user) return res.status(404).json({ message: "user not found" });
  if (user.crystal < 100)
    return res.status(400).json({ message: "not enough crystal" });

  // 2) 현재 DB에 실제로 존재하는 희귀도만으로 확률 테이블 재구성
  const groups = await prisma.unit.groupBy({
    by: ["rarity"],
    _count: { _all: true },
    where: playableWhereBase,
  });
  if (groups.length === 0) {
    return res.status(500).json({ message: "no playable units available" });
  }
  const availableRarities = new Set(
    groups.filter((g) => g._count._all > 0).map((g) => g.rarity)
  );
  // 존재하지 않는 희귀도는 제거
  const liveRates: Record<number, number> = {};
  for (const [rarStr, rate] of Object.entries(RATES)) {
    const rar = Number(rarStr);
    if (availableRarities.has(rar)) liveRates[rar] = rate;
  }
  // 그래도 비면(시드 문제), 모든 플레이어블에서 균등 추첨
  const fallbackAll = Object.keys(liveRates).length === 0;

  // 3) 추첨 & 후보 조회
  let pickedUnitId: string | null = null;

  if (!fallbackAll) {
    const rarity = weightedPick(liveRates);
    let candidates = await prisma.unit.findMany({
      where: { rarity, ...playableWhereBase },
    });
    // 해당 희귀도에 없으면 인접 희귀도로 완화 (위→아래→위…)
    if (candidates.length === 0) {
      const order = [
        rarity - 1,
        rarity + 1,
        rarity - 2,
        rarity + 2,
        1,
        2,
        3,
        4,
        5,
      ].filter((r, i, self) => r >= 1 && r <= 5 && self.indexOf(r) === i);
      for (const r of order) {
        candidates = await prisma.unit.findMany({
          where: { rarity: r, ...playableWhereBase },
        });
        if (candidates.length) break;
      }
    }
    if (candidates.length) {
      const u = candidates[Math.floor(Math.random() * candidates.length)];
      pickedUnitId = u.id;
    }
  }

  // 4) 최후의 보루: 모든 플레이어블에서 랜덤
  if (!pickedUnitId) {
    const any = await prisma.unit.findMany({ where: playableWhereBase });
    if (any.length === 0) {
      return res.status(500).json({ message: "no candidates" });
    }
    pickedUnitId = any[Math.floor(Math.random() * any.length)].id;
  }

  // 5) 결정 차감 & 인벤토리 지급
  const picked = await prisma.unit.findUnique({ where: { id: pickedUnitId } });
  if (!picked)
    return res.status(500).json({ message: "picked unit not found" });

  const [updatedUser, inv] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { crystal: { decrement: 100 } },
    }),
    prisma.inventory.create({ data: { userId, unitId: picked.id } }),
  ]);

  res.status(201).json({
    crystal: updatedUser.crystal,
    unit: {
      id: picked.id,
      name: picked.name,
      emoji: picked.emoji,
      tribe: picked.tribe,
      role: picked.role,
      rarity: picked.rarity,
      img: picked.img,
      hpMax: picked.hpMax,
      atk: picked.atk,
      speed: picked.speed,
      ultName: picked.ultName ?? null,
      ultDesc: picked.ultDesc ?? null,
      inventoryId: inv.id,
      level: inv.level,
    },
  });
});

export default router;
