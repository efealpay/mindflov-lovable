/**
 * Onboarding + milestone state, stored on the user's profile row so the
 * walkthrough follows the account across devices instead of living in
 * localStorage.
 */
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  step: number;
  milestones: {
    firstMap: boolean;
    firstExpansion: boolean;
    firstSynthesis: boolean;
    firstExport: boolean;
  };
}

export const EMPTY_ONBOARDING: OnboardingState = {
  completed: false,
  skipped: false,
  step: 0,
  milestones: {
    firstMap: false,
    firstExpansion: false,
    firstSynthesis: false,
    firstExport: false,
  },
};

export type MilestoneKey = keyof OnboardingState["milestones"];

const MILESTONE_COLUMN: Record<MilestoneKey, string> = {
  firstMap: "milestone_first_map",
  firstExpansion: "milestone_first_expansion",
  firstSynthesis: "milestone_first_synthesis",
  firstExport: "milestone_first_export",
};

export async function fetchOnboardingState(userId: string): Promise<OnboardingState> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed, onboarding_skipped, onboarding_step, milestone_first_map, milestone_first_expansion, milestone_first_synthesis, milestone_first_export",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return EMPTY_ONBOARDING;

  return {
    completed: Boolean(data.onboarding_completed),
    skipped: Boolean(data.onboarding_skipped),
    step: Number(data.onboarding_step ?? 0),
    milestones: {
      firstMap: Boolean(data.milestone_first_map),
      firstExpansion: Boolean(data.milestone_first_expansion),
      firstSynthesis: Boolean(data.milestone_first_synthesis),
      firstExport: Boolean(data.milestone_first_export),
    },
  };
}

/** Persists the step the user is currently on (so an interrupted tour resumes). */
export async function saveOnboardingStep(userId: string, step: number) {
  await supabase.from("profiles").update({ onboarding_step: step }).eq("id", userId);
}

export async function completeOnboarding(userId: string) {
  await supabase
    .from("profiles")
    .update({ onboarding_completed: true, onboarding_skipped: false })
    .eq("id", userId);
}

export async function skipOnboarding(userId: string) {
  await supabase.from("profiles").update({ onboarding_skipped: true }).eq("id", userId);
}

/** Clears completion so the tour can be replayed on demand. */
export async function restartOnboarding(userId: string) {
  await supabase
    .from("profiles")
    .update({ onboarding_completed: false, onboarding_skipped: false, onboarding_step: 0 })
    .eq("id", userId);
}

export async function markMilestone(userId: string, milestone: MilestoneKey) {
  const column = MILESTONE_COLUMN[milestone];
  await supabase
    .from("profiles")
    .update({ [column]: true })
    .eq("id", userId);
}
