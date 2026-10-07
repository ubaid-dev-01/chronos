"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { PLANS } from "@chronos/types";
import { useApiClient } from "@/hooks/use-api-client";

interface BillingClientProps {
  initialPlanTier: string;
}

export function BillingClient({ initialPlanTier }: BillingClientProps) {
  const { apiFetch } = useApiClient();
  const [currentPlan] = useState(initialPlanTier);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(planTier: string) {
    setLoading(planTier);
    setError("");
    try {
      const data = await apiFetch<{ data?: { url?: string } }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planTier }),
      });
      if (data.data?.url) {
        window.location.assign(data.data.url);
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout";
      setError(message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Billing</h1>
        <p className="text-text-secondary">Manage your subscription plan</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.tier;
          const isPopular = plan.tier === "pro";

          return (
            <div
              key={plan.id}
              className={`rounded-xl border bg-surface p-6 relative flex flex-col ${
                isCurrent
                  ? "border-accent ring-1 ring-border"
                  : isPopular
                  ? "border-text-tertiary"
                  : "border-border bg-surface"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium bg-accent text-background rounded-full text-text-primary">
                  Current
                </span>
              )}
              {isPopular && !isCurrent && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium bg-warning rounded-full text-black flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-text-primary">
                {plan.name}
              </h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-text-primary">
                  ${(plan.price / 100).toFixed(0)}
                </span>
                <span className="text-text-secondary">/mo</span>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Up to {plan.seatLimit} user{plan.seatLimit > 1 ? "s" : ""}
              </p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={isCurrent || loading === plan.tier}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "border border-white/10 text-text-secondary cursor-default"
                    : "bg-accent text-background hover:bg-primary-600 text-text-primary disabled:opacity-50"
                }`}
              >
                {loading === plan.tier ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : (
                  "Upgrade"
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-text-secondary">
        All plans include: Privacy blur, offline mode, cross-platform agent,
        encrypted storage.
      </p>
    </div>
  );
}
