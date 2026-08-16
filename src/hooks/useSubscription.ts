import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { syncSubscriptionTier } from "@/utils/payments.functions";

export type SubscriptionState = {
  tier: "free" | "plus" | "pro";
  status: string;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
};

const EMPTY: SubscriptionState = {
  tier: "free",
  status: "inactive",
  interval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,
};

/**
 * Reads the signed-in user's subscription for the current payment environment and
 * keeps their profile tier in sync (including expiry after cancellation).
 */
export function useSubscription(userId?: string | null) {
  const [state, setState] = useState<SubscriptionState>(EMPTY);

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    try {
      const result = await syncSubscriptionTier({
        data: { environment: getPaddleEnvironment() },
      });
      setState({
        tier: result.tier,
        status: result.status,
        interval: result.interval,
        currentPeriodEnd: result.currentPeriodEnd,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`subscriptions-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { ...state, refresh };
}
