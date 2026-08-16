import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, tierForProduct, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  return _supabase;
}

async function syncProfileTier(userId: string, tier: string) {
  await getSupabase().from("profiles").update({ subscription_tier: tier }).eq("id", userId);
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error("Paddle webhook: no userId in customData");
    return;
  }

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
    });
    return;
  }

  const tier = tierForProduct(productId);
  const interval = item?.price?.billingCycle?.interval ?? null;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "paddle",
      provider_subscription_id: id,
      provider_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      tier,
      interval,
      status,
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_subscription_id" },
  );

  await syncProfileTier(userId, tier);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, items, currentBillingPeriod, scheduledChange } = data;

  const item = items?.[0];
  const productId = item?.product?.importMeta?.externalId;
  const priceId = item?.price?.importMeta?.externalId;
  const tier = productId ? tierForProduct(productId) : null;

  const update: Record<string, unknown> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt ?? null,
    current_period_end: currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    updated_at: new Date().toISOString(),
  };
  if (tier) update['tier'] = tier;
  if (productId) update['product_id'] = productId;
  if (priceId) update['price_id'] = priceId;
  if (item?.price?.billingCycle?.interval) update['interval'] = item.price.billingCycle.interval;

  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .update(update)
    .eq("provider_subscription_id", id)
    .eq("environment", env)
    .select("user_id");

  const userId = (rows?.[0] as { user_id?: string } | undefined)?.user_id;
  // Paid access continues to the end of the period, so past_due/canceled keep the tier.
  if (userId && tier && ["active", "trialing", "past_due"].includes(status)) {
    await syncProfileTier(userId, tier);
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Access is retained until current_period_end; the tier is recomputed client-side
  // by syncSubscriptionTier once that date passes.
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", data.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled Paddle event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Paddle webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
