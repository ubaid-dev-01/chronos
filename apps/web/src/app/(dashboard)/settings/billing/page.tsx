import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentOrg } from "@/lib/auth";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  // Only admins can manage billing/plan - API (POST /billing/checkout) also
  // enforces this, but the page should redirect instead of erroring on submit.
  if (user.role !== "admin") redirect("/dashboard");

  const org = await getCurrentOrg();
  if (!org) redirect("/sign-up");

  return <BillingClient initialPlanTier={org.planTier ?? "free"} />;
}
