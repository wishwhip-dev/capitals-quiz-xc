"use client";

/**
 * The home screen: the Start button, the best score, and the history of the last ten rounds.
 *
 * Nothing here reads the clock or storage during render — the queries run through `useStoredQuery`,
 * which stays pending on the server and until the database is open, so the empty state can never
 * flash before the rows arrive.
 */
import { useDatabaseTransfer, useStoredQuery, useStorageStatus } from "@/lib/storage/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDrop } from "@/components/file-drop";
import { database } from "@/lib/db";
import { getBestScore, listRecentRounds } from "@/lib/data/quiz-records";
import { COUNTRY_COUNT } from "@/lib/data/countries";
import { QUESTIONS_PER_ROUND } from "@/lib/quiz";
import { readAsJson } from "@/lib/files";

export type QuizHomeProps = {
  onStart: () => void;
};

function formatDate(playedAt: number): string {
  return new Date(playedAt).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function QuizHome({ onStart }: QuizHomeProps) {
  const status = useStorageStatus(database);
  const { data: best, isLoading: bestLoading } = useStoredQuery(database, getBestScore);
  const { data: rounds, isLoading: roundsLoading } = useStoredQuery(database, () => listRecentRounds(10));
  const transfer = useDatabaseTransfer(database);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          {COUNTRY_COUNT} countries
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Capital cities quiz
        </h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {QUESTIONS_PER_ROUND} capitals, four choices each, one round at a time. Your best score and
          your last ten rounds are kept in this browser.
        </p>
        <Button type="button" size="lg" onClick={onStart} className="mt-1 min-h-11 w-full text-base sm:w-auto sm:self-start">
          Start quiz
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {bestLoading
            ? "Loading your best score…"
            : best
              ? `Best score: ${best.score}/${best.total}`
              : "No best score yet — finish a round to set one."}
        </p>
      </div>

      {status === "memory" ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          This browser will not keep your data. Your scores last only for this visit — export them to a file below.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent rounds</CardTitle>
          <CardDescription>The last ten rounds you finished.</CardDescription>
        </CardHeader>
        <CardContent>
          {roundsLoading ? (
            <p className="text-sm text-muted-foreground">Loading rounds…</p>
          ) : !rounds || rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rounds yet — finish a round and it shows up here.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rounds.map((round) => (
                <li key={round.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm font-semibold">
                    {round.score} / {round.total}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDate(round.playedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your data</CardTitle>
          <CardDescription>Scores live in this browser only. A file is the way to carry them elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={transfer.exportToFile} className="min-h-11">
              Export scores
            </Button>
            {transfer.state.kind === "working" ? <p className="text-sm text-muted-foreground">Working…</p> : null}
            {transfer.state.kind === "error" ? (
              <p role="alert" className="text-sm text-destructive">
                {transfer.state.message}
              </p>
            ) : null}
            {transfer.state.kind === "imported" ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Loaded: {transfer.state.result.added} table{transfer.state.result.added === 1 ? "" : "s"} of data.
              </p>
            ) : null}
          </div>
          <FileDrop
            accept="application/json,.json"
            maxBytes={2_000_000}
            label="Load a backup file"
            onFiles={(files, rejected) => {
              for (const { file, reason } of rejected) {
                console.warn(`Not loaded: ${file.name} — ${reason}.`);
              }
              const file = files[0];
              if (!file) return;
              void (async () => {
                try {
                  await readAsJson(file);
                } catch (error) {
                  console.warn(`Could not read ${file.name}: ${error instanceof Error ? error.message : "unreadable file"}.`);
                }
                await transfer.importFromFile(file, "replace");
              })();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}