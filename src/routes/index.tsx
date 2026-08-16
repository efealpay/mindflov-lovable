import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const MindflovApp = lazy(() => import("@/features/mindflov/MindflovApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindFlov — AI Mind Mapping for Fast Idea Generation" },
      {
        name: "description",
        content:
          "Expand any idea into a visual mind map with AI. Brainstorm, connect concepts, and export polished briefs in minutes.",
      },
      { property: "og:title", content: "MindFlov — AI Mind Mapping for Fast Idea Generation" },
      {
        property: "og:description",
        content:
          "Expand any idea into a visual mind map with AI. Brainstorm, connect concepts, and export polished briefs in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function CanvasFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<CanvasFallback />}>
      <Suspense fallback={<CanvasFallback />}>
        <MindflovApp />
      </Suspense>
    </ClientOnly>
  );
}
