import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountDeactivatedClient } from "./account-deactivated-client";

export default async function AccountDeactivatedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.isActive) redirect("/dashboard");

  return <AccountDeactivatedClient email={user.email} />;
}
