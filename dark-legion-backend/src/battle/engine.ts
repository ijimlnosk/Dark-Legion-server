import { BattleSession, Combatant } from "./store";

export type Action =
  | { type: "ATTACK"; actorId: string; targetId: string }
  | { type: "ULT"; actorId: string; targetId: string };

export type ActionResult = {
  logs: string[];
  deadIds: string[];
  nextTurnIdx: number;
  finished: boolean;
  winner: "ALLY" | "ENEMY" | null;
};

export function isAlive(u: Combatant) {
  return u.alive && u.hp > 0;
}

function basicDamage(attacker: Combatant, defender: Combatant) {
  return Math.max(1, attacker.atk);
}

function ultDamage(attacker: Combatant, defender: Combatant) {
  return Math.max(2, Math.floor(attacker.atk * 1.6));
}

export function performAction(
  session: BattleSession,
  action: Action
): ActionResult {
  const logs: string[] = [];
  const { units } = session;
  const actor = units[action.actorId];
  if (!actor || !isAlive(actor)) {
    return {
      logs: ["invalid actor"],
      deadIds: [],
      nextTurnIdx: session.turnIdx,
      finished: false,
      winner: null,
    };
  }
  const target = units[(action as any).targetId];
  if (!target || !isAlive(target)) {
    return {
      logs: ["invalid target"],
      deadIds: [],
      nextTurnIdx: session.turnIdx,
      finished: false,
      winner: null,
    };
  }

  let dmg = 0;
  if (action.type === "ATTACK") {
    dmg = basicDamage(actor, target);
    logs.push(`${actor.name}의 공격! ${target.name}에게 ${dmg} 데미지`);
  } else if (action.type === "ULT") {
    dmg = ultDamage(actor, target);
    logs.push(`${actor.name}의 궁극기! ${target.name}에게 ${dmg} 데미지`);
  }

  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) {
    target.alive = false;
    logs.push(`${target.name} 전투불능`);
  }

  // 다음 턴으로
  const aliveOrder = session.order.filter((id) => isAlive(units[id]));
  const currentId = session.order[session.turnIdx];
  const currentIdxInAlive = aliveOrder.indexOf(currentId);
  const nextTurnIdxInAlive = (currentIdxInAlive + 1) % aliveOrder.length;
  const nextTurnId = aliveOrder[nextTurnIdxInAlive];
  const nextTurnIdx = session.order.indexOf(nextTurnId);

  // 종료 판정
  const allyAlive = aliveOrder.some((id) => units[id].side === "ALLY");
  const enemyAlive = aliveOrder.some((id) => units[id].side === "ENEMY");
  const finished = !allyAlive || !enemyAlive;
  const winner = finished ? (allyAlive ? "ALLY" : "ENEMY") : null;

  session.turnIdx = nextTurnIdx;

  return {
    logs,
    deadIds: Object.values(units)
      .filter((u) => !isAlive(u))
      .map((u) => u.id),
    nextTurnIdx,
    finished,
    winner,
  };
}
