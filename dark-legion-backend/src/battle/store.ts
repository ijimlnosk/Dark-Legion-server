export type Combatant = {
  id: string; // runtime id
  name: string;
  side: "ALLY" | "ENEMY";
  hpMax: number;
  hp: number;
  atk: number;
  speed: number;
  alive: boolean;
};

export type BattleSession = {
  id: string;
  userId: string;
  stageId: string;
  waveIdx: number;
  order: string[]; // runtime ids in turn order
  turnIdx: number; // index into order
  units: Record<string, Combatant>;
  createdAt: number;
};

const sessions = new Map<string, BattleSession>();

export function saveSession(session: BattleSession) {
  sessions.set(session.id, session);
}

export function getSession(sessionId: string): BattleSession | undefined {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}
