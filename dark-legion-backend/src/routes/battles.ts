import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { STAGES } from "../data/stages";

const router = Router();

router.post("/finish", async (req, res) => {
  const userId = req.userId!;
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

  const isLastWave = waveIdx >= stage.waves.length - 1;
  const crystalsAwarded = win && isLastWave ? stage.rewardCrystals : 0;

  const [user, log] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { crystal: { increment: crystalsAwarded || 0 } },
    }),
    prisma.battleLog.create({
      data: {
        userId,
        stageId,
        waveIdx,
        result: win ? "WIN" : "LOSE",
        drops,
        crystals: crystalsAwarded,
      },
    }),
  ]);

  res.status(201).json({ crystal: user.crystal, crystalsAwarded, log });
});

router.get("/log", async (req, res) => {
  const userId = req.userId!;
  const logs = await prisma.battleLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(logs);
});

export default router;
