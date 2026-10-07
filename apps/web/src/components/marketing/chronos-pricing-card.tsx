import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ElevatedOutlineLink,
  ElevatedPill,
} from "@/components/ui/elevated";
import type { IPlan } from "@chronos/types";

interface ChronosPricingCardProps {
  plan: IPlan;
  highlighted?: boolean;
}

export function ChronosPricingCard({
  plan,
  highlighted,
}: ChronosPricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border-2 border-[var(--elevated-ink)] p-8 pt-11 shadow-[0_6px_0_0_var(--elevated-ink)]",
        highlighted
          ? "bg-brand/5 dark:bg-brand/10"
          : "bg-surface"
      )}
    >
      {highlighted && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <ElevatedPill>Most popular</ElevatedPill>
        </div>
      )}

      <p className="text-center text-sm font-semibold text-text-secondary">
        {plan.seatLimit === 1
          ? "For individuals tracking solo"
          : `Teams up to ${plan.seatLimit} people`}
      </p>

      <div className="my-6 text-center">
        <span className="font-mono text-4xl font-bold tracking-tight text-text-primary">
          {plan.price === 0 ? "$0" : `$${(plan.price / 100).toFixed(0)}`}
        </span>
        <span className="text-sm font-medium text-text-secondary">
          {plan.price === 0 ? " forever" : "/month"}
        </span>
      </div>

      <p className="mb-4 text-center text-sm font-semibold text-text-primary">
        {plan.name}
      </p>

      <ul className="mb-8 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm font-medium text-text-secondary"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {feature}
          </li>
        ))}
      </ul>

      <ElevatedOutlineLink href="/sign-up">
        {plan.price === 0 ? "Start free" : `Choose ${plan.name}`}
      </ElevatedOutlineLink>
    </div>
  );
}
