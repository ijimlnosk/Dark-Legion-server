export type BaseStats = {
  hpMax: number;
  atk: number;
  speed: number;
};

// 합성(레벨업)에 따른 능력치 스케일링 규칙
// - 레벨 1은 본래 스탯 그대로
// - 레벨이 1 오를 때마다 hp/atk는 7% 증가, speed는 0 또는 1씩 보정 가능
// - 과도한 성장 방지를 위해 소수점은 내림 처리
const HP_ATK_GROWTH_PER_LEVEL = 0.07; // 7%
const SPEED_GROWTH_EVERY_LEVELS = 5; // 5레벨마다 속도 +1

export function getEffectiveStats(base: BaseStats, level: number): BaseStats {
  const lvl = Math.max(1, Math.floor(level || 1));
  const growthMultiplier = 1 + (lvl - 1) * HP_ATK_GROWTH_PER_LEVEL;

  const hpMax = Math.floor(base.hpMax * growthMultiplier);
  const atk = Math.floor(base.atk * growthMultiplier);
  const speedBonus = Math.floor((lvl - 1) / SPEED_GROWTH_EVERY_LEVELS);
  const speed = base.speed + speedBonus;

  return { hpMax, atk, speed };
}

// 합성 규칙: 재료 1개당 레벨 +1, 최대 레벨 제한
export const MAX_INVENTORY_LEVEL = 20;
