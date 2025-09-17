import { Router } from "express";
import { prisma } from "../lib/prisma";
import { STAGES } from "../data/stages";

const router = Router();

router.get("/stages", (_req, res) => {
  res.json(STAGES);
});

router.get("/units", async (_req, res) => {
  const units = await prisma.unit.findMany({ orderBy: { rarity: "asc" } });
  res.json(units);
});

router.get("/units/:id", async (req, res) => {
  const unit = await prisma.unit.findUnique({
    where: { id: req.params.id },
  });
  if (!unit) {
    return res.status(404).json({ message: "Unit not found" });
  }
  res.json(unit);
});

export default router;
