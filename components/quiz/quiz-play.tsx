"use client";

/**
 * One question at a time: four tappable answers, keyboard play, and no way to score twice.
 *
 * Keys 1–4 pick an answer, Enter or Space moves on once a question has been answered, and an
 * unanswered tap does nothing until the round is over. Choosing an answer marks it right or wrong,
 * shows the right capital for a moment, then advances on its own — the wait can be cut short with
 * Enter or Space.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { scoreRound, type Question } from "@/lib/quiz";
import { cn } from "@/lib/utils";

/** How long the right answer stays on screen before the round moves on. */
const REVEAL_MS = 1400;

export type QuizPlayProps = {
  round: Question[];
  /** Called exactly once, when the last question's answer has been revealed. */
  onFinish: (answers: (string | null)[]) => void;
  onQuit: () => void;
};

export function QuizPlay({ round, onFinish, onQuit }: QuizPlayProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => round.map(() => null));
  const finished = useRef(false);

  const question = round[index];
  const picked = answers[index];
  const answered = picked !== null;
  const score = scoreRound(answers, round);

  const choose = useCallback(
    (choice: string) => {
      // A question already answered never scores again, however it is pressed.
      setAnswers((previous) => {
        if (previous[index] !== null) return previous;
        const next = [...previous];
        next[index] = choice;
        return next;
      });
    },
    [index],
  );

  const advance = useCallback(() => {
    if (finished.current) return;
    if (index >= round.length - 1) {
      finished.current = true;
      onFinish(answersRef.current);
      return;
    }
    setIndex(index + 1);
  }, [index, round.length, onFinish]);

  // The reveal is brief: the right capital shows, then the next question arrives on its own.
  useEffect(() => {
    if (!answered) return;
    const timer = window.setTimeout(advance, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [answered, advance]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const choiceIndex = ["1", "2", "3", "4"].indexOf(event.key);
      if (choiceIndex >= 0) {
        const choice = question.choices[choiceIndex];
        if (choice) {
          event.preventDefault();
          choose(choice);
        }
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && answered) {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answered, choose, advance]);

  const progress = ((index + (answered ? 1 : 0)) / round.length) * 100;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Question {index + 1} of {round.length}
        </p>
        <p className="text-sm font-semibold text-foreground" aria-live="polite">
          Score: {score}
        </p>
      </header>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={index + (answered ? 1 : 0)}
        aria-valuemin={0}
        aria-valuemax={round.length}
        aria-label="Round progress"
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          What is the capital of {question.country}?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {answered
            ? picked === question.correct
              ? "Correct."
              : `The capital of ${question.country} is ${question.correct}.`
            : "Pick an answer, or press 1–4."}
        </p>
      </div>

      <div className="flex flex-col gap-2.5" role="group" aria-label="Answer choices">
        {question.choices.map((choice, choiceIndex) => {
          const isPicked = answered && picked === choice;
          const isCorrect = answered && choice === question.correct;
          const reveal = answered && isCorrect && !isPicked;
          return (
            <Button
              key={choice}
              type="button"
              variant="outline"
              onClick={() => choose(choice)}
              className={cn(
                "h-auto min-h-11 justify-between gap-3 px-4 py-3 text-left text-base",
                answered && "pointer-events-none opacity-60",
                isCorrect && "pointer-events-auto border-emerald-600 bg-emerald-50 text-emerald-950 opacity-100 hover:bg-emerald-50",
                isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive opacity-100",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted-foreground"
                >
                  {choiceIndex + 1}
                </span>
                <span className="truncate">{choice}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-sm font-semibold">
                {isPicked && isCorrect ? "✓" : isPicked ? "✗" : reveal ? "✓" : ""}
              </span>
              <span className="sr-only">
                {isCorrect ? " — the right answer" : isPicked ? " — your answer, not correct" : ""}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={onQuit} className="min-h-11">
          Quit round
        </Button>
        {answered ? (
          <Button type="button" variant="secondary" size="sm" onClick={advance} className="min-h-11">
            Next question
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Enter moves on after answering.</p>
        )}
      </div>
    </div>
  );
}