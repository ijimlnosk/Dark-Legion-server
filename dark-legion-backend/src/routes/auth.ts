import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * POST /auth/login
 * body: { name: string }
 * - 없으면 유저 생성(crystal 기본값 300), 있으면 그대로 반환
 */
router.post("/login", async (req, res) => {
  const { name } = z
    .object({ name: z.string().min(1).max(30) })
    .parse(req.body);

  const user = await prisma.user.upsert({
    where: { name },
    update: {},
    create: { name, crystal: 300 },
  });

  res.json({ id: user.id, name: user.name, crystal: user.crystal });
});

export default router;
