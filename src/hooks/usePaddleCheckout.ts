import { useCallback, useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = useCallback(
    async (options: {
      priceId: string;
      customerEmail?: string;
      userId: string;
      onCompleted?: () => void;
    }) => {
      setLoading(true);
      try {
        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(options.priceId);

        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customer: options.customerEmail ? { email: options.customerEmail } : undefined,
          customData: { userId: options.userId },
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: `${window.location.origin}/?checkout=success`,
            allowLogout: false,
            variant: "one-page",
          },
        });

        if (options.onCompleted) {
          window.Paddle.Update?.({
            eventCallback: (event: { name?: string }) => {
              if (event?.name === "checkout.completed") options.onCompleted?.();
            },
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { openCheckout, loading };
}
