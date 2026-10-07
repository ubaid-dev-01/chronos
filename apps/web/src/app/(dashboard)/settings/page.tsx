import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentOrg } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");

  const org = await getCurrentOrg();
  if (!org) redirect("/sign-up");

  return (
    <SettingsForm
      orgName={org.name}
      userTimezone={user.timezone}
    />
  );
}
