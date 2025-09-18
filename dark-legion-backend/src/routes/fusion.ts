import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { MAX_INVENTORY_LEVEL } from "../lib/stats";

const router = Router();

// POST /fusion/merge
// body: { targetInventoryId: string, materialInventoryIds: string[] }
router.post("/merge", async (req, res) => {
  const userId = (req as any).userId!;
  const { targetInventoryId, materialInventoryIds } = z
    .object({
      targetInventoryId: z.string().min(1),
      materialInventoryIds: z.array(z.string().min(1)).min(1),
    })
    .parse(req.body);

  // 재료와 대상이 중복되지 않도록
  if (materialInventoryIds.includes(targetInventoryId)) {
    return res
      .status(400)
      .json({ message: "target cannot be part of materials" });
  }

  // 소유권/동일 유닛 여부 검사 후 레벨업 처리
  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.inventory.findFirst({
        where: { id: targetInventoryId, userId },
        include: { unit: true },
      });
      if (!target) throw new Error("target_not_found");

      const materials = await tx.inventory.findMany({
        where: { id: { in: materialInventoryIds }, userId },
        include: { unit: true },
      });
      if (materials.length !== materialInventoryIds.length) {
        throw new Error("materials_not_found");
      }

      // 규칙: 동일한 unitId만 재료로 허용 (동종 합성)
      const isSameUnit = materials.every((m) => m.unitId === target.unitId);
      if (!isSameUnit) throw new Error("materials_must_match_target_unit");

      // 레벨업: 재료 n개 → level + n
      const increment = materials.length;
      const newLevel = Math.min(MAX_INVENTORY_LEVEL, target.level + increment);

      const updated = await tx.inventory.update({
        where: { id: target.id },
        data: { level: newLevel },
        include: { unit: true },
      });

      // 재료 소모: 삭제
      await tx.inventory.deleteMany({
        where: { id: { in: materials.map((m) => m.id) }, userId },
      });

      // 파티에서 제거: 소모된 인벤토리 ID를 모두 파티 슬롯에서 빼기
      const party = await tx.party.findUnique({ where: { userId } });
      if (party) {
        const slots = (party.slots as unknown as string[]) || [];
        const matIds = new Set(materials.map((m) => m.id));
        const filtered = slots.filter((id) => !matIds.has(id));
        if (filtered.length !== slots.length) {
          await tx.party.update({
            where: { userId },
            data: { slots: filtered as unknown as any },
          });
        }
      }

      return updated;
    });

    res.status(200).json({
      targetInventoryId: result.id,
      unitId: result.unitId,
      level: result.level,
    });
  } catch (e: any) {
    const code = String(e?.message || "unknown_error");
    const map: Record<string, number> = {
      target_not_found: 404,
      materials_not_found: 400,
      materials_must_match_target_unit: 400,
    };
    const status = map[code] ?? 500;
    return res.status(status).json({ message: code });
  }
});

export default router;
