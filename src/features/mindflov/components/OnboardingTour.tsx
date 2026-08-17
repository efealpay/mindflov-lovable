import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  GitBranch,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  completeOnboarding,
  fetchOnboardingState,
  markMilestone,
  saveOnboardingStep,
  skipOnboarding,
  type MilestoneKey,
} from "@/lib/onboarding";

export interface OnboardingSignals {
  hasSeed: boolean;
  hasExpanded: boolean;
  hasSynthesized: boolean;
  hasExported: boolean;
}

interface Step {
  id: string;
  title: string;
  body: string;
  icon: typeof Sparkles;
  /** When set, the step completes only once the user actually performs the action. */
  waitFor?: keyof OnboardingSignals;
  milestone?: MilestoneKey;
  cta: string;
}

const STEPS: Step[] = [
  {
    id: "seed",
    title: "Start with one idea",
    body: "Type a concept in the input at the bottom and press Seed. MindFlov plants it as the centre of your map.",
    icon: Sparkles,
    waitFor: "hasSeed",
    milestone: "firstMap",
    cta: "Seed a concept to continue",
  },
  {
    id: "expand",
    title: "Expand a node",
    body: "Click any node, then use Expand. The AI branches it into related directions you can keep exploring.",
    icon: GitBranch,
    waitFor: "hasExpanded",
    milestone: "firstExpansion",
    cta: "Expand a node to continue",
  },
  {
    id: "context",
    title: "Tune the thinking",
    body: "Pick a professional context (marketer, researcher, designer…) and a generation mode in the left panel to change how ideas are produced.",
    icon: SlidersHorizontal,
    cta: "Got it",
  },
  {
    id: "synthesize",
    title: "Synthesize the map",
    body: "When the map feels rich enough, run Synthesize to turn every branch into a structured written brief.",
    icon: FileText,
    waitFor: "hasSynthesized",
    milestone: "firstSynthesis",
    cta: "Synthesize to continue",
  },
  {
    id: "export",
    title: "Take it with you",
    body: "Export the map or the brief as PDF, Markdown or an image — then share it with your team.",
    icon: Download,
    waitFor: "hasExported",
    milestone: "firstExport",
    cta: "Finish tour",
  },
];

/**
 * Interaction-aware onboarding for the canvas. Steps that describe an action wait
 * until the user actually performs it, and progress is stored on the user's profile
 * so the tour resumes on any device.
 */
export default function OnboardingTour({
  userId,
  active,
  signals,
  onOpenUpgrade,
}: {
  userId: string | null | undefined;
  active: boolean;
  signals: OnboardingSignals;
  onOpenUpgrade?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const grantedMilestones = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) {
      setReady(false);
      setVisible(false);
      return;
    }
    let cancelled = false;
    void fetchOnboardingState(userId).then((state) => {
      if (cancelled) return;
      setStep(Math.min(STEPS.length - 1, Math.max(0, state.step)));
      setVisible(!state.completed && !state.skipped);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = STEPS[step];

  const satisfied = useMemo(() => {
    if (!current?.waitFor) return true;
    return signals[current.waitFor];
  }, [current, signals]);

  const advance = useCallback(
    async (fromStep: number) => {
      const from = STEPS[fromStep];
      if (userId && from?.milestone && !grantedMilestones.current.has(from.milestone)) {
        grantedMilestones.current.add(from.milestone);
        void markMilestone(userId, from.milestone);
      }
      if (fromStep >= STEPS.length - 1) {
        setVisible(false);
        if (userId) await completeOnboarding(userId);
        return;
      }
      const next = fromStep + 1;
      setStep(next);
      if (userId) void saveOnboardingStep(userId, next);
    },
    [userId],
  );

  // Auto-advance the moment the user performs the required action.
  useEffect(() => {
    if (!ready || !visible || !active || !current?.waitFor) return;
    if (!satisfied) return;
    const timeout = setTimeout(() => void advance(step), 900);
    return () => clearTimeout(timeout);
  }, [ready, visible, active, current, satisfied, step, advance]);

  const dismiss = async () => {
    setVisible(false);
    if (userId) await skipOnboarding(userId);
  };

  if (!ready || !visible || !active || !current) return null;

  const Icon = current.icon;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-600/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur transition-colors hover:bg-indigo-500"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Tour · step {step + 1}/{STEPS.length}
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-end p-5">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-[#0f172a]/95 p-5 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Step {step + 1} of {STEPS.length}
              </p>
              <h3 className="text-sm font-bold text-white">{current.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="rounded p-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white"
              title="Minimize the tour"
            >
              Hide
            </button>
            <button
              onClick={() => void dismiss()}
              className="rounded p-1 text-slate-400 hover:text-white"
              title="Skip the tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-300">{current.body}</p>

        <div className="mb-4 flex gap-1.5">
          {STEPS.map((entry, index) => (
            <span
              key={entry.id}
              className={`h-1 flex-1 rounded-full ${
                index < step ? "bg-indigo-500" : index === step ? "bg-indigo-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          {current.waitFor && !satisfied ? (
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              {current.cta}
            </span>
          ) : (
            <button
              onClick={() => void advance(step)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
            >
              {step === STEPS.length - 1 ? (
                <>
                  <Check className="h-4 w-4" /> Finish
                </>
              ) : (
                <>
                  {current.cta} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
          {step === STEPS.length - 1 && onOpenUpgrade && (
            <button
              onClick={onOpenUpgrade}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              See plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
