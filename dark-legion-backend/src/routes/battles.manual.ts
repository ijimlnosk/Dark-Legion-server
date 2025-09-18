import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { getEffectiveStats } from "../lib/stats";
import {
  BattleSession,
  saveSession,
  getSession,
  deleteSession,
} from "../battle/store";
import { performAction, Action } from "../battle/engine";
import { STAGES } from "../data/stages";

const router = Router();

router.post("/manual/start", async (req, res) => {
  const userId = (req as any).userId!;
  const { stageId, waveIdx } = z
    .object({
      stageId: z.string().min(1),
      waveIdx: z.number().int().min(0).default(0),
    })
    .parse(req.body ?? {});

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return res.status(400).json({ message: "unknown stageId" });
  const wave = stage.waves[waveIdx] ?? stage.waves[0];

  // 아군: 현재 파티의 인벤토리 → 유닛 정보 및 레벨 스탯 반영
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      party: true,
      inventory: { include: { unit: true } },
    },
  });
  if (!user) return res.status(404).json({ message: "user not found" });
  const partyIds: string[] = (user.party?.slots as any) ?? [];
  const invById = new Map(user.inventory.map((i) => [i.id, i] as const));
  const allies = partyIds
    .map((id) => invById.get(id))
    .filter(Boolean)
    .slice(0, 3)
    .map((i) => {
      const eff = getEffectiveStats(
        { hpMax: i!.unit.hpMax, atk: i!.unit.atk, speed: i!.unit.speed },
        i!.level
      );
      return {
        id: `A_${i!.id}`,
        name: i!.unit.name,
        side: "ALLY" as const,
        hpMax: eff.hpMax,
        hp: eff.hpMax,
        atk: eff.atk,
        speed: eff.speed,
        alive: true,
      };
    });

  // 적: 스테이지 웨이브는 유닛 ID 배열이므로, DB에서 스탯을 조회해 생성
  const enemyIds: string[] = wave as unknown as string[];
  const enemyRows = await prisma.unit.findMany({
    where: { id: { in: enemyIds } },
    select: { id: true, name: true, hpMax: true, atk: true, speed: true },
  });
  const rowById = new Map(enemyRows.map((r) => [r.id, r] as const));
  const enemies = enemyIds.map((unitId, idx) => {
    const r = rowById.get(unitId);
    return {
      id: `E_${idx}_${unitId}`,
      name: r?.name ?? unitId,
      side: "ENEMY" as const,
      hpMax: r?.hpMax ?? 1,
      hp: r?.hpMax ?? 1,
      atk: r?.atk ?? 1,
      speed: r?.speed ?? 1,
      alive: true,
    };
  });

  const units = [...allies, ...enemies];
  if (units.length === 0)
    return res.status(400).json({ message: "empty party" });
  const order = units
    .map((u) => u.id)
    .sort((a, b) => {
      const ua = units.find((u) => u.id === a)!;
      const ub = units.find((u) => u.id === b)!;
      return ub.speed - ua.speed;
    });

  const session: BattleSession = {
    id: `S_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    stageId,
    waveIdx,
    order,
    turnIdx: 0,
    units: Object.fromEntries(units.map((u) => [u.id, u])),
    createdAt: Date.now(),
  };
  saveSession(session);

  res.status(201).json({ sessionId: session.id, order, units });
});

router.post("/manual/act", async (req, res) => {
  const userId = (req as any).userId!;
  const { sessionId, action } = z
    .object({
      sessionId: z.string().min(1),
      action: z.object({
        type: z.enum(["ATTACK", "ULT"]),
        actorId: z.string().min(1),
        targetId: z.string().min(1),
      }),
    })
    .parse(req.body);

  const session = getSession(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(404).json({ message: "session_not_found" });
  }

  const result = performAction(session, action as Action);

  if (result.finished) {
    // 보상/로그 처리: 기존 finish 라우트 로직과 동일 계산
    const didWinBattle = result.winner === "ALLY";
    const stage = STAGES.find((s) => s.id === session.stageId)!;
    const hasWaves = stage.waves.length > 0;
    const lastWaveIdx = hasWaves ? stage.waves.length - 1 : 0;
    const stageCleared = hasWaves
      ? didWinBattle && session.waveIdx >= lastWaveIdx
      : didWinBattle;
    const crystalsAwarded = stageCleared ? stage.rewardCrystals : 0;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { crystal: { increment: crystalsAwarded } },
      }),
      prisma.battleLog.create({
        data: {
          userId,
          stageId: session.stageId,
          waveIdx: session.waveIdx,
          result: didWinBattle ? "WIN" : "LOSE",
          crystals: crystalsAwarded,
        },
      }),
    ]);
    deleteSession(session.id);
  }

  res.json({
    logs: result.logs,
    deadIds: result.deadIds,
    nextTurnIdx: result.nextTurnIdx,
    finished: result.finished,
    winner: result.winner,
    units: session.units,
    order: session.order.filter((id) => session.units[id]?.alive),
  });
});

export default router;
