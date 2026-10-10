"use client";

/**
 * The three screens of the app and what moves between them: home → play → results.
 *
 * The round lives in memory only. Nothing is written until the tenth answer has been revealed, so
 * a reload mid-quiz lands back on the home screen with the history and the best score untouched.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QuizHome } from "@/components/quiz/quiz-home";
import { QuizPlay } from "@/components/quiz/quiz-play";
import { QuizResults } from "@/components/quiz/quiz-results";
import { recordRound, type RoundOutcome } from "@/lib/data/quiz-records";
import { buildRound, scoreRound, type Question } from "@/lib/quiz";

type View =
  | { kind: "home" }
  | { kind: "playing"; round: Question[] }
  | { kind: "results"; round: Question[]; answers: (string | null)[] };

export function QuizApp() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Token for the round a database write belongs to, so a slow save from a round that has already
  // been left behind cannot answer the next one's "was that a record?".
  const roundToken = useRef(0);

  // Each screen starts at the top; the review list on the results screen is long.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.kind]);

  const start = useCallback(() => {
    roundToken.current += 1;
    setOutcome(null);
    setSaveError(null);
    setView({ kind: "playing", round: buildRound() });
  }, []);

  const finish = useCallback((round: Question[], answers: (string | null)[]) => {
    const score = scoreRound(answers, round);
    const token = roundToken.current;
    setView({ kind: "results", round, answers });
    recordRound(score, round.length).then(
      (recorded) => {
        if (roundToken.current === token) setOutcome(recorded);
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : "unknown error";
        if (roundToken.current !== token) return;
        setSaveError(message);
        toast.error(`Could not save this round: ${message}`);
      },
    );
  }, []);

  if (view.kind === "playing") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <QuizPlay round={view.round} onFinish={(answers) => finish(view.round, answers)} onQuit={() => setView({ kind: "home" })} />
      </main>
    );
  }

  if (view.kind === "results") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <QuizResults
          round={view.round}
          answers={view.answers}
          outcome={outcome}
          saveError={saveError}
          onPlayAgain={start}
          onHome={() => setView({ kind: "home" })}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <QuizHome onStart={start} />
    </main>
  );
}