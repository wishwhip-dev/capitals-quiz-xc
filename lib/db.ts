/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, how the schema has changed over
 * time. This is the app's first schema, so it ships as version 1 — the starter's example tables
 * were replaced, not migrated away from.
 *
 * Tables:
 * - `rounds` — one row per finished quiz round, newest first by `playedAt`. A round is recorded
 *   only when it is finished; a reload mid-quiz writes nothing.
 * - `stats` — single-row key/value store holding the best score. Kept separately from the rounds
 *   so "beating your best" stays true even if history were ever trimmed.
 */
import { defineDatabase } from "@/lib/storage/database";

/** One finished round of the quiz. */
export type Round = {
  id: string;
  /** Right answers out of `total`. */
  score: number;
  total: number;
  /** Epoch millis. Indexed, because the history list is ordered by it. */
  playedAt: number;
};

/** The single row holding the visitor's best score. */
export type BestScore = {
  id: "best";
  score: number;
  total: number;
  updatedAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ rounds: Round; stats: BestScore }>({
  // Part of the origin's storage identity. Renamed for this app's first release, which points it
  // at its own empty database rather than the starter example's.
  name: "capital-cities-quiz",
  versions: [
    // Only the primary key and the properties queried on. `score` and `total` are stored but never
    // filtered or sorted by, so indexing them would cost writes and buy nothing.
    {
      version: 1,
      stores: {
        rounds: "id, playedAt",
        stats: "id",
      },
    },
  ],
  // No seed on purpose: an empty history is a real state the home screen draws ("No rounds yet"),
  // not a gap to fill with example content.
});
