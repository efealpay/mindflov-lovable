import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PaddleEnv = "sandbox" | "live";

const TIER_BY_PRODUCT: Record<string, "plus" | "pro"> = {
  plus_plan: "plus",
  pro_plan: "pro",
};

/** Resolves a human-readable price id (e.g. "pro_monthly") to a Paddle price id. */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0]!.id;
  });

/**
 * Recomputes the signed-in user's plan from their subscription rows and stores it
 * on their profile. Handles paid-period expiry after a cancellation, which no
 * webhook fires for.
 */
export const syncSubscriptionTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("subscriptions")
      .select("tier, status, current_period_end, cancel_at_period_end, interval, product_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false });

    const now = Date.now();
    const active = (rows ?? []).find((row) => {
      const endsAt = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
      const withinPeriod = endsAt === null || endsAt > now;
      if (["active", "trialing", "past_due"].includes(row.status)) return withinPeriod;
      if (row.status === "canceled") return endsAt !== null && endsAt > now;
      return false;
    });

    const tier = active ? (active.tier as "plus" | "pro") : "free";

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    if (profile && profile.subscription_tier !== tier) {
      await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
    }

    return {
      tier,
      status: active?.status ?? "inactive",
      interval: active?.interval ?? null,
      currentPeriodEnd: active?.current_period_end ?? null,
      cancelAtPeriodEnd: active?.cancel_at_period_end ?? false,
    };
  });

/** Returns a Paddle customer portal URL so the user can cancel or update billing. */
export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row } = await supabase
      .from("subscriptions")
      .select("provider_customer_id, provider_subscription_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .not("provider_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row?.provider_customer_id) {
      throw new Error("No billing account found for this user yet");
    }

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(
      row.provider_customer_id,
      row.provider_subscription_id ? [row.provider_subscription_id] : [],
    );

    return { url: session.urls.general.overview };
  });

/**
 * Switches an existing subscription to another plan/interval.
 * Upgrades are charged pro-rated immediately; downgrades are not charged and the
 * lower price applies from the next renewal.
 */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { environment: PaddleEnv; priceId: string; targetProductId: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row } = await supabase
      .from("subscriptions")
      .select("provider_subscription_id, tier, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row?.provider_subscription_id) {
      return { changed: false as const, reason: "no_active_subscription" };
    }

    const targetTier = TIER_BY_PRODUCT[data.targetProductId] ?? "free";
    const rank = { free: 0, plus: 1, pro: 2 } as const;
    const isUpgrade = rank[targetTier] > rank[(row.tier as keyof typeof rank) ?? "free"];

    const { gatewayFetch, getPaddleClient } = await import("@/lib/paddle.server");

    const priceLookup = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const priceResult = (await priceLookup.json()) as { data?: Array<{ id: string }> };
    const paddlePriceId = priceResult.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Price not found");

    const paddle = getPaddleClient(data.environment);
    await paddle.subscriptions.update(row.provider_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: isUpgrade ? "prorated_immediately" : "do_not_bill",
    });

    return { changed: true as const, upgraded: isUpgrade, tier: targetTier };
  });
