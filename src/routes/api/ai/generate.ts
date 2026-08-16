import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/** Requested model name -> gateway model id. */
const MODEL_MAP: Record<string, string> = {
  "gemini-3-flash-preview": "google/gemini-3-flash-preview",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite",
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-3.5-flash": "google/gemini-3.5-flash",
};
const DEFAULT_MODEL = "google/gemini-3.5-flash";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/ai/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json({ error: "Please sign in to generate ideas." }, 401);

        const supabase = createClient(
          process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"]!,
          process.env["SUPABASE_ANON_KEY"] ?? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!,
          {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return json({ error: "Your session expired. Please sign in again." }, 401);
        }

        const body = (await request.json().catch(() => null)) as
          | {
              model?: string;
              contents?: string;
              config?: {
                systemInstruction?: string;
                responseMimeType?: string;
                responseSchema?: unknown;
                temperature?: number;
              };
            }
          | null;

        if (!body?.contents || typeof body.contents !== "string") {
          return json({ error: "Nothing to generate." }, 400);
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json({ error: "AI is not configured for this project." }, 500);

        const modelId = (body.model && MODEL_MAP[body.model]) || DEFAULT_MODEL;
        const wantsJson = body.config?.responseMimeType === "application/json";

        const systemParts: string[] = [];
        if (body.config?.systemInstruction) systemParts.push(body.config.systemInstruction);
        if (wantsJson) {
          systemParts.push(
            "Respond with valid minified JSON only. No markdown fences, no commentary.",
          );
          if (body.config?.responseSchema) {
            systemParts.push(
              `The JSON must match this schema (types are uppercase JSON types):\n${JSON.stringify(
                body.config.responseSchema,
              )}`,
            );
          }
        }

        try {
          const gateway = createLovableAiGatewayProvider(apiKey);
          const result = streamText({
            model: gateway(modelId),
            ...(systemParts.length > 0 ? { system: systemParts.join("\n\n") } : {}),
            prompt: body.contents,
            ...(typeof body.config?.temperature === "number"
              ? { temperature: body.config.temperature }
              : {}),
            abortSignal: request.signal,
          });

          const text = await result.text;
          const usage = await result.usage;

          return json({ text, tokens: usage?.totalTokens ?? 0 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed";
          const status = /rate|429/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
          console.error("AI generate failed:", message);
          return json({ error: message }, status);
        }
      },
    },
  },
});
