/**
 * AI client for the MindFlov canvas.
 *
 * Replaces the old direct-to-Google client. All generation now goes through
 * this app's own authenticated `/api/ai/generate` endpoint, so no AI key ever
 * reaches the browser and usage stays tied to the signed-in account.
 */
import { supabase } from "@/integrations/supabase/client";

/** Schema type tokens, kept identical to the previous SDK's `Type` enum. */
export const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
} as const;

/** Analytics metadata recorded server-side for every generation. */
export interface GenerateTelemetry {
  actionType?: string;
  contextRole?: string;
  modeKey?: string;
  modeLabel?: string;
  mapId?: string;
}

export interface GenerateParams {
  model?: string;
  contents: string;
  telemetry?: GenerateTelemetry;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: unknown;
    temperature?: number;
  };
}


export interface GenerateResult {
  text: string;
  tokens: number;
}

export async function generateWithAi(
  params: GenerateParams,
  signal?: AbortSignal | null,
): Promise<GenerateResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.status === 429) {
      throw new Error(errorBody.error ?? "AI is busy right now. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error(errorBody.error ?? "AI credits are exhausted for this workspace.");
    }
    throw new Error(errorBody.error ?? `AI request failed (${response.status})`);
  }

  return (await response.json()) as GenerateResult;
}
