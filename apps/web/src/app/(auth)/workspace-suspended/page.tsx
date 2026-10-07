import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentOrg } from "@/lib/auth";
import { WorkspaceSuspendedClient } from "./workspace-suspended-client";

export default async function WorkspaceSuspendedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isActive) redirect("/account-deactivated");

  const org = await getCurrentOrg();
  if (!org) redirect("/sign-up");
  if (org.isActive) redirect("/dashboard");

  return (
    <WorkspaceSuspendedClient orgName={org.name} email={user.email} />
  );
}
