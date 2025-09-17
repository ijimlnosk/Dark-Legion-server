import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

router.get("/state", async (req, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      party: true,
      inventory: { include: { unit: true } },
    },
  });
  if (!user) return res.status(404).json({ message: "user not found" });

  res.json({
    crystal: user.crystal,
    party: (user.party?.slots as string[]) ?? [],
    collection: user.inventory.map((i) => ({
      id: i.unitId,
      name: i.unit.name,
      emoji: i.unit.emoji,
      tribe: i.unit.tribe,
      role: i.unit.role,
      rarity: i.unit.rarity,
      img: i.unit.img,
      hpMax: i.unit.hpMax,
      atk: i.unit.atk,
      speed: i.unit.speed,
      ultName: i.unit.ultName ?? null,
      ultDesc: i.unit.ultDesc ?? null,
      inventoryId: i.id,
      level: i.level,
    })),
  });
});

router.put("/party", async (req, res) => {
  const userId = req.userId!;
  const body = z.object({ slots: z.array(z.string()).max(3) }).parse(req.body);

  const inv = await prisma.inventory.findMany({
    where: { userId },
    select: { id: true },
  });
  const myIds = new Set(inv.map((i) => i.id));
  if (!body.slots.every((id) => myIds.has(id)))
    return res.status(400).json({ message: "invalid inventory id" });

  const party = await prisma.party.upsert({
    where: { userId },
    create: { userId, slots: body.slots as unknown as any },
    update: { slots: body.slots as unknown as any },
  });
  res.json(party);
});

router.put("/crystal", async (req, res) => {
  const userId = req.userId!;
  const { delta } = z.object({ delta: z.number().int() }).parse(req.body);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { crystal: { increment: delta } },
    select: { crystal: true },
  });
  res.json(updated);
});

export default router;
