import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { STAGES } from "../data/stages";

const router = Router();

router.post("/finish", async (req, res) => {
  const userId = (req as any).userId!;
  const { stageId, waveIdx, win, drops } = z
    .object({
      stageId: z.string().min(1),
      waveIdx: z.number().int().min(0),
      win: z.boolean(),
      drops: z.any().optional(),
    })
    .parse(req.body);

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return res.status(400).json({ message: "unknown stageId" });

  const hasWaves = stage.waves.length > 0;
  const lastWaveIdx = hasWaves ? stage.waves.length - 1 : 0;
  const progressedPastWave = hasWaves ? waveIdx > lastWaveIdx : true;
  const normalizedWaveIdx = hasWaves
    ? Math.min(Math.max(waveIdx, 0), lastWaveIdx)
    : 0;
  const didWinBattle = win || progressedPastWave;
  const stageCleared = hasWaves
    ? didWinBattle && normalizedWaveIdx >= lastWaveIdx
    : didWinBattle;

  const crystalsAwarded = stageCleared ? stage.rewardCrystals : 0;
  const battleResult = didWinBattle ? "WIN" : "LOSE";

  const [user, log] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { crystal: { increment: crystalsAwarded } },
    }),
    prisma.battleLog.create({
      data: {
        userId,
        stageId,
        waveIdx: normalizedWaveIdx,
        result: battleResult,
        drops,
        crystals: crystalsAwarded,
      },
    }),
  ]);

  res.status(201).json({
    crystal: user.crystal,
    crystalsAwarded,
    stageCleared,
    result: battleResult,
    log,
  });
});

router.get("/log", async (req, res) => {
  const userId = (req as any).userId!;
  const logs = await prisma.battleLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(logs);
});

export default router;
