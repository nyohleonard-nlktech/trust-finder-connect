import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, AlertCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { smartMatchWorkers, type SmartMatchResult } from "@/lib/smart-match.functions";
import { fetchVerifiedWorkers, type WorkerRow } from "@/lib/workers";
import { WorkerCard } from "@/components/WorkerCard";

const EXAMPLES = [
  "I need someone to fix a leaking bathroom pipe urgently in Nkwen",
  "My generator won't start, I'm in Bonamoussadi",
  "Looking for a hairdresser for a wedding in Bamenda",
];

export function SmartMatch() {
  const [prompt, setPrompt] = useState("");
  const runMatch = useServerFn(smartMatchWorkers);

  const mutation = useMutation<{ result: SmartMatchResult; workers: WorkerRow[] }, Error, string>({
    mutationFn: async (text: string) => {
      const workers = await fetchVerifiedWorkers();
      const result = await runMatch({
        data: {
          prompt: text,
          candidates: workers.slice(0, 80).map((w) => ({
            user_id: w.user_id,
            name: w.profiles?.full_name ?? "Worker",
            service_category: w.service_category,
            neighborhood: w.neighborhood,
            bio: w.bio,
            is_available: w.is_available,
          })),
        },
      });
      return { result, workers };
    },
  });

  const submit = (text: string) => {
    const value = text.trim();
    if (value.length < 3 || mutation.isPending) return;
    mutation.mutate(value);
  };

  const data = mutation.data;
  const matched = data
    ? data.result.matches
        .map((m) => ({ reason: m.reason, worker: data.workers.find((w) => w.user_id === m.user_id) }))
        .filter((m): m is { reason: string; worker: WorkerRow } => Boolean(m.worker))
    : [];

  return (
    <section id="smart-match" className="py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="glass rounded-3xl p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#BC542A]/15 px-3 py-1.5 text-xs font-semibold text-[#FF9A6B]">
            <Sparkles className="h-3.5 w-3.5" /> AI Smart Match
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold font-display">
            Describe the problem. <span className="text-gradient-orange">We find the artisan.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Type what you need in your own words — our AI reads every verified profile and picks the best matches for you.
          </p>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(prompt);
            }}
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. I need someone to fix a leaking bathroom pipe urgently in Nkwen"
              className="bg-white/[0.03] border-white/10 text-base resize-none rounded-xl"
              aria-label="Describe what you need"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setPrompt(ex);
                      submit(ex);
                    }}
                    className="text-xs rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors"
                  >
                    {ex.length > 42 ? `${ex.slice(0, 42)}…` : ex}
                  </button>
                ))}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || prompt.trim().length < 3}
                className="h-12 px-6 rounded-xl font-semibold gap-2 shrink-0"
                style={{ background: "var(--gradient-primary)", color: "#fff" }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Matching…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Find my match
                  </>
                )}
              </Button>
            </div>
          </form>

          {mutation.isPending && (
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          )}

          {mutation.isError && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-foreground">Smart Match couldn&apos;t finish.</p>
                <p className="text-muted-foreground">{mutation.error.message}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => submit(prompt)}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {data && !mutation.isPending && (
            <div className="mt-8">
              {data.result.summary && (
                <p className="text-sm text-foreground/90 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-[#FF7043] shrink-0" />
                  {data.result.summary}
                </p>
              )}
              {matched.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No verified artisan matched that request yet — try describing the trade you need, or browse all workers below.
                </p>
              ) : (
                <div className="mt-5 grid sm:grid-cols-2 gap-5">
                  {matched.map(({ worker, reason }) => (
                    <div key={worker.user_id} className="space-y-2">
                      <WorkerCard w={worker} />
                      <p className="text-xs text-muted-foreground px-1 flex items-start gap-1.5">
                        <Sparkles className="h-3 w-3 mt-0.5 text-[#FF7043] shrink-0" /> {reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
