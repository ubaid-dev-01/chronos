"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/hooks/use-api-client";
import { Select } from "@/components/ui/input";

export interface TeamMember {
  _id: string;
  displayName: string;
  email: string;
  role: string;
}

interface UseCurrentUserResult {
  user: TeamMember | null;
  isManager: boolean;
  loading: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { apiFetch } = useApiClient();
  const [user, setUser] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: TeamMember }>("/users/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const isManager = user?.role === "admin" || user?.role === "manager";
  return { user, isManager, loading };
}

interface UseTeamMembersResult {
  members: TeamMember[];
  loading: boolean;
}

export function useTeamMembers(): UseTeamMembersResult {
  const { apiFetch } = useApiClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: TeamMember[] }>("/users")
      .then((res) => setMembers(res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  return { members, loading };
}

interface TeamMemberSelectProps {
  value: string;
  onChange: (userId: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function TeamMemberSelect({
  value,
  onChange,
  includeAll = false,
  allLabel = "All members",
  className,
  disabled,
}: TeamMemberSelectProps) {
  const { members, loading } = useTeamMembers();

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled || loading}
    >
      {includeAll && <option value="">{allLabel}</option>}
      {members.map((m) => (
        <option key={m._id} value={m._id}>
          {m.displayName}
        </option>
      ))}
    </Select>
  );
}
