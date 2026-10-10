"use client";

/**
 * The end of a round: the score as a large readout, a verdict that speaks to every band including
 * the two extremes, the full review of what was asked, and the share card.
 */
import { useCallback } from "react";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { identity } from "@/app/identity";
import type { RoundOutcome } from "@/lib/data/quiz-records";
import { QUESTIONS_PER_ROUND, verdictFor, scoreRound, type Question } from "@/lib/quiz";
import { renderShareCard } from "@/lib/share";
import { cn } from "@/lib/utils";

export type QuizResultsProps = {
  round: Question[];
  answers: (string | null)[];
  /** The database's answer to "was that a record?", once the round has been recorded. */
  outcome: RoundOutcome | null;
  /** Set when the round could not be recorded — the score still shows, the save did not happen. */
  saveError: string | null;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function QuizResults({ round, answers, outcome, saveError, onPlayAgain, onHome }: QuizResultsProps) {
  const score = scoreRound(answers, round);
  const total = round.length;
  const verdict = verdictFor(score, total);
  const best = outcome?.best ?? null;

  const makeImage = useCallback(
    () =>
      renderShareCard({
        title: `${score} / ${total}`,
        subtitle: verdict,
        lines: [
          `${QUESTIONS_PER_ROUND} capitals, one round`,
          best === null ? "First round played" : `Best score: ${best}/${total}`,
        ],
        footer: identity.name,
        format: "story",
      }),
    [score, total, verdict, best],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Round finished</p>
          <p className="text-6xl font-bold tracking-tight text-balance sm:text-7xl" aria-label={`Score ${score} out of ${total}`}>
            {score}&thinsp;/&thinsp;{total}
          </p>
          <p className="max-w-sm text-lg text-muted-foreground text-pretty">{verdict}</p>
          {saveError ? (
            <p role="alert" className="mt-1 text-sm text-destructive">
              This round could not be saved: {saveError}
            </p>
          ) : outcome === null ? (
            <p className="mt-1 text-sm text-muted-foreground">Saving round…</p>
          ) : outcome.isNewBest ? (
            <p className="mt-1 text-sm font-semibold text-emerald-700" aria-live="polite">
              New best score!
            </p>
          ) : outcome.matchedBest ? (
            <p className="mt-1 text-sm font-medium" aria-live="polite">
              You matched your best: {best?.score}/{best?.total}. The record stands.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              Best score: {best?.score}/{best?.total}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <ShareButton
          label="Share result"
          cacheKey={`${score}/${total}/${best?.score ?? "none"}`}
          title={`I scored ${score} / ${total} on ${identity.name}`}
          text={`${verdict} — ${score} out of ${total} on ${identity.name}.`}
          filename="capital-cities-score.png"
          makeImage={makeImage}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onPlayAgain} className="min-h-11 flex-1">
            Play again
          </Button>
          <Button type="button" variant="outline" onClick={onHome} className="min-h-11 flex-1">
            Back to home
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {round.map((question, index) => {
            const picked = answers[index];
            const right = picked === question.correct;
            return (
              <div
                key={question.country}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border p-3",
                  right ? "border-emerald-600/40 bg-emerald-50" : "border-border bg-muted/40",
                )}
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {index + 1}. {question.country}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    Capital: <span className="font-medium text-foreground">{question.correct}</span>
                  </p>
                  {!right ? (
                    <p className="mt-0.5 text-muted-foreground">
                      Your answer:{" "}
                      <span className={cn("font-medium", picked ? "text-destructive" : "text-muted-foreground")}>
                        {picked ?? "no answer"}
                      </span>
                    </p>
                  ) : null}
                </div>
                <span
                  aria-label={right ? "Correct" : "Incorrect"}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    right ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground",
                  )}
                >
                  {right ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/** The share card: score, verdict, app name. Drawn ahead of the press, works for 0/10 too. */
async function renderShareCardFor({ score, total, verdict, best }: { score: number; total: number; verdict: string; best: number | null }) {
  const { renderShareCard } = await import("@/lib/share");
  return renderShareCard({
    title: `${score} / ${total}`,
    subtitle: verdict,
    lines: [
      `${QUESTIONS_PER_ROUND} capitals, one round`,
      best === null ? "First round played" : `Best score: ${best}/${total}`,
    ],
    footer: identity.name,
    format: "story",
  });
}