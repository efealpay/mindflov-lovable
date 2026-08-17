import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const MindflovApp = lazy(() => import("@/features/mindflov/MindflovApp"));

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "MindFlov Canvas — Expand Your Idea Into a Map" },
      {
        name: "description",
        content:
          "Open the MindFlov canvas: seed a concept, expand it with AI, synthesize the map into a brief and export it.",
      },
      { property: "og:title", content: "MindFlov Canvas" },
      {
        property: "og:description",
        content: "Seed a concept, expand it with AI, synthesize and export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CanvasRoute,
});

function CanvasFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
    </div>
  );
}

function CanvasRoute() {
  return (
    <ClientOnly fallback={<CanvasFallback />}>
      <Suspense fallback={<CanvasFallback />}>
        <MindflovApp />
      </Suspense>
    </ClientOnly>
  );
}
