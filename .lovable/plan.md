# Admin panel, usage analytics, and the Mindflov marketing site

Three connected pieces. Verified starting points: the admin console exists only as a modal gated on a
hardcoded email; no account actually holds the `admin` role, so admin config saves and user deletes
currently fail. Usage tracking today is a single weekly counter plus a token total — nothing records
which context (23 roles) or which of the four generation modes was used. The canvas currently owns `/`.

---

## Part 1 — Usage telemetry (what gets measured)

Every AI generation writes one event row: user, timestamp, action type
(expand / insight / plan / synthesis / bridge / export-document), the active context role
(e.g. Storyteller, Architect, General Framework), the generation mode slot used
(Neural Bridge / Visual Metaphor / Strategic Logic / Viral Hook, stored as both the slot key and the
context-specific label), model used, tokens in/out, latency, success or failure, and the map id.

Events are written server-side inside the AI endpoint that already handles generation, so the numbers
can't be faked by the client and nothing breaks if the browser closes mid-request. The existing weekly
counter and token totals keep working; events become the source of truth for analytics.

## Part 2 — Admin panel

A real protected `/admin` area, admin-only, replacing the email check with the proper `admin` role.
Your account gets granted the role. Sections:

**Overview**
Total users, new signups (7/30 days), active users, paid vs free split, MRR estimate from live
subscriptions, generations today/week, tokens consumed, average generations per active user,
error rate of AI calls.

**Users**
Searchable, sortable, paginated table: email, name, tier, subscription status and renewal date,
generations this week, lifetime tokens, last active, joined. Row actions: view a user's detail panel
(their maps count, usage over time, favourite context and mode), change tier manually, reset weekly
usage, grant/revoke admin, delete account and all their data.

**Usage analytics**
- Generations over time (day/week), stacked by action type.
- Context leaderboard: which of the 23 professional contexts are actually used, with share of total.
- Mode distribution: Neural Bridge vs Visual Metaphor vs Strategic Logic vs Viral Hook, overall and
  broken down per context (which contexts lean on which mind).
- Model usage and token cost split, so spend per model is visible.
- Funnel: signed up → first map → first expansion → hit free limit → upgraded.
- Free-limit pressure: how many users hit the weekly cap, a direct upgrade signal.

**Revenue**
Active subscriptions by plan and interval, monthly vs yearly mix, new/canceled in period, cancellations
pending at period end, and sandbox vs live separation so test data never pollutes real numbers.

**Settings**
Weekly free limit, Plus/Pro token limits, plan names and descriptions. The legacy Gumroad link fields
are removed — checkout is owned by the payments provider now.

All admin reads and writes go through server functions that verify the admin role before doing anything;
the UI role check only decides what is shown.

## Part 3 — Marketing website (multipage, SEO-first)

A proper marketing site at the root, with the canvas moved to `/app` (matching how mindflov.com and
app.mindflov.com are split today). `/` will no longer open the canvas directly; signed-in users get an
"Open the canvas" call to action, and the old entry point keeps working.

Pages, built from mindflov.com's own positioning and copy:

- `/` — Home: "You're not out of ideas. You're out of angles." Hero with free-first CTA, the
  chat-is-a-line vs map contrast, the three failures (memory, context, continuity) answered by the
  three solutions, the Seed → Expand → Synthesise → Export loop, mode teaser, pricing teaser, FAQ teaser.
- `/how-it-works` — the four steps in depth, with the anatomy of a map.
- `/generation-modes` — "One idea. Five minds.": what each of the four cognitive slots does, with real
  seed → output examples, plus the table showing how the same four slots are renamed per discipline.
- `/contexts` — the 23 profession-specific contexts, grouped by category, each with what changes.
- `/for/content-creators`, `/for/marketers`, `/for/designers` — audience landing pages ("A week of
  angles from one theme", "Past the obvious three angles", "Directions, not mood boards").
- `/pricing` — Free (10 generations weekly, refills), Plus $11.99/mo, Pro $29.99/mo, with the
  2-months-free yearly option, plus a comparison table and billing FAQ.
- `/faq` — the full FAQ set (vs ChatGPT, vs mind-mapping tools, learning curve, longevity, cost, who
  it's for).
- `/about`, `/contact` (support@mindflov.com), `/privacy`, `/terms`.

Design direction: dark, high-contrast, editorial-technical — numbered acts, monospace labels, node/edge
motifs and canvas-like visuals, generous type scale. Distinct from the app UI but clearly the same
product. Fully responsive, reduced-motion respected.

SEO: unique title + meta description + Open Graph/Twitter tags per page, single H1 each, semantic
sections, internal linking between contexts/modes/audience pages, JSON-LD for SoftwareApplication,
Organization, FAQPage and per-page breadcrumbs, canonical URLs, sitemap and robots, lazy-loaded imagery
with real alt text.

---

## Technical notes

- New `ai_events` table (indexed on user + created_at, role, mode, action) written by the existing
  server-side AI route with the service role; RLS restricts reads to admins. Aggregations exposed via
  admin-only server functions using SQL grouping, not client-side loops over raw rows.
- The AI request payload gains explicit `role`, `modeKey`, `modeLabel`, and `actionType` fields so the
  server logs truth rather than guessing from prompt text.
- New `src/lib/admin.functions.ts`: `requireSupabaseAuth` + in-handler `has_role(uid,'admin')` check,
  privileged client imported inside handlers. Routes live under `_authenticated/admin/*`.
- Migration adds the admin role row, `ai_events`, and the admin-scoped policies/GRANTs the panel needs
  (admin read on usage/subscriptions/events, admin delete on user data).
- Marketing pages are separate SSR route files under `src/routes/` (not hash sections), styled with
  semantic tokens in `src/styles.css`; the canvas moves to `src/routes/app.tsx` with `/` redirect
  handling for existing links.
- Charts reuse the Recharts setup already in the project.

## Suggested build order

1. Telemetry + migration (so data starts accumulating immediately).
2. Admin panel on top of that data.
3. Marketing site and the `/app` move.
