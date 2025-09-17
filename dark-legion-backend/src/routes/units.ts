import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /units?ids=a,b,c
 * 반환: UnitBase[]
 */
router.get("/", async (req, res) => {
  const ids = String(req.query.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return res.status(400).json({ message: "ids query is required" });
  }

  // Unit 테이블에서 id in (...) 조회
  const rows = await prisma.unit.findMany({
    where: { id: { in: ids } },
    // 필요한 필드만 선택 (프론트의 UnitBase와 동일하게)
    select: {
      id: true,
      name: true,
      emoji: true,
      tribe: true,
      role: true,
      rarity: true,
      hpMax: true,
      atk: true,
      speed: true,
      ultName: true,
      ultDesc: true,
      img: true, // e.g. "/units/skel_soldier.png"
    },
  });

  return res.json(rows);
});

export default router;
