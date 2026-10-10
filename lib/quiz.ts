/**
 * Turning the country dataset into a round of questions, and a score into a verdict.
 *
 * Pure functions only: `buildRound` uses randomness, so it is called from an event handler (the
 * Start button), never during render — that keeps the server render and the first client render
 * identical, and keeps every round different.
 */
import { COUNTRIES, type Country, type Region } from "@/lib/data/countries";

export const QUESTIONS_PER_ROUND = 10;
export const CHOICES_PER_QUESTION = 4;

export type Question = {
  /** The country being asked about. */
  country: string;
  region: Region;
  /** The one right answer. */
  correct: string;
  /** The correct capital plus three distractors, in a shuffled order. */
  choices: string[];
};

export type AnsweredQuestion = Question & {
  /** The choice the visitor tapped, or null when they never answered it. */
  picked: string | null;
};

/** Fisher–Yates over a copy; the input is left alone. */
export function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One question: `country`'s real capital plus three distractor capitals drawn from other countries
 * in the same dataset, so every choice on screen is a city that is a capital somewhere. Distractors
 * come from the same region when there are enough of them, which keeps the question honest without
 * making it guessable.
 */
function buildQuestion(country: Country, others: readonly Country[]): Question {
  const sameRegion = shuffled(others.filter((other) => other.region === country.region));
  const anywhere = shuffled(others.filter((other) => other.region !== country.region));
  const distractors: string[] = [];
  for (const candidate of [...sameRegion, ...anywhere]) {
    if (distractors.length >= CHOICES_PER_QUESTION - 1) break;
    if (candidate.capital !== country.capital && !distractors.includes(candidate.capital)) {
      distractors.push(candidate.capital);
    }
  }
  return {
    country: country.name,
    region: country.region,
    correct: country.capital,
    choices: shuffled([country.capital, ...distractors]),
  };
}

/** A whole round: `count` countries at random, each with its own set of choices. */
export function buildRound(
  count: number = QUESTIONS_PER_ROUND,
  pool: readonly Country[] = COUNTRIES,
): Question[] {
  const picked = shuffled(pool).slice(0, count);
  return picked.map((country) =>
    buildQuestion(country, pool.filter((other) => other.name !== country.name)),
  );
}

/** How many of the round's answers were right. */
export function scoreRound(answers: readonly (string | null)[], round: readonly Question[]): number {
  return round.reduce(
    (total, question, index) => total + (answers[index] === question.correct ? 1 : 0),
    0,
  );
}

/**
 * The verdict line under the score. Each band gets its own sentence, including the two extremes:
 * 10/10 and 0/10 are their own lines, not the ends of a middling range.
 */
export function verdictFor(score: number, total: number): string {
  if (score === total) return "Perfect round. Every capital, first try.";
  if (score >= total - 1) return "One slip away from a perfect round.";
  if (score >= Math.ceil(total * 0.7)) return "Strong round — the map holds few surprises for you.";
  if (score >= Math.ceil(total * 0.4)) return "A solid pass, with a few capitals still out there.";
  if (score >= 1) return "Rough round — a few did land, though.";
  return "Nothing landed this time. Everyone starts somewhere.";
}

/** A short summary for the share card: the score, then the verdict. */
export function scoreLabel(score: number, total: number): string {
  return `${score} / ${total}`;
}
