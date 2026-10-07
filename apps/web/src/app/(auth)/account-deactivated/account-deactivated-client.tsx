"use client";

import { UserX } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface AccountDeactivatedPageProps {
  email: string;
}

export function AccountDeactivatedClient({ email }: AccountDeactivatedPageProps) {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-elevated">
          <UserX className="h-6 w-6 text-text-tertiary" />
        </div>
        <h1 className="text-lg font-medium text-text-primary">
          Account deactivated
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your Chronos account ({email}) has been deactivated by an
          administrator. You can still sign in, but workspace access is
          disabled.
        </p>
        <p className="mt-4 text-xs text-text-tertiary">
          Contact your organization admin if you believe this is a mistake.
        </p>
        <div className="mt-6">
          <Button variant="secondary" className="w-full" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
