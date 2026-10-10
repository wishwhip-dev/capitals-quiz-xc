/**
 * This app's queries over the quiz database. Components call these, never Dexie directly.
 *
 * Every write is awaited by its caller and reports failure — a round that cannot be recorded tells
 * the person so, rather than vanishing.
 */
import { database, newId, type BestScore, type Round } from "@/lib/db";

const rounds = async () => (await database.ready()).rounds;
const stats = async () => (await database.ready()).stats;

/** The stored best score, or null before the first finished round. */
export async function getBestScore(): Promise<BestScore | null> {
  const row = await (await stats()).get("best");
  return row ?? null;
}

/** The last `limit` finished rounds, newest first. */
export async function listRecentRounds(limit = 10): Promise<Round[]> {
  const table = await rounds();
  const all = await table.orderBy("playedAt").reverse().toArray();
  return all.slice(0, limit);
}

/** How a finished round landed against the stored best. */
export type RoundOutcome = {
  best: BestScore | null;
  /** True when this round beat the previous best (or is the first). */
  isNewBest: boolean;
  /** True when the round equalled an existing best that was left unchanged. */
  matchedBest: boolean;
};

/**
 * Record a finished round and update the best score, both in one transaction so a crash between
 * them cannot leave the history and the best disagreeing.
 *
 * A score equal to the existing best does not rewrite the row: the best is unchanged, and the
 * caller tells the visitor they matched it.
 */
export async function recordRound(score: number, total: number): Promise<RoundOutcome> {
  const db = await database.ready();
  const round: Round = { id: newId(), score, total, playedAt: Date.now() };
  return db.transaction("rw", db.rounds, db.stats, async () => {
    await db.rounds.add(round);
    const current = (await db.stats.get("best")) ?? null;
    if (!current || score > current.score) {
      const best: BestScore = { id: "best", score, total, updatedAt: Date.now() };
      await db.stats.put(best);
      return { best, isNewBest: true, matchedBest: false };
    }
    return { best: current, isNewBest: false, matchedBest: score === current.score };
  });
}
