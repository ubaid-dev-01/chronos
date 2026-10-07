"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiClient } from "@/hooks/use-api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  TeamMemberSelect,
  useCurrentUser,
} from "@/components/dashboard/team-member-select";

interface Comment {
  _id: string;
  userName: string;
  createdByName?: string;
  targetType: string;
  targetId: string;
  text: string;
  createdAt: string;
}

const TARGET_LABELS: Record<string, string> = {
  day: "Day",
  timelog: "Time log",
  screenshot: "Screenshot",
  user: "User",
};

export default function CommentsPage() {
  const { apiFetch } = useApiClient();
  const { user, isManager } = useCurrentUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState("");
  const [text, setText] = useState("");
  const [targetType, setTargetType] = useState<"day" | "user">("day");
  const [targetId, setTargetId] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [commentForUserId, setCommentForUserId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (user && !commentForUserId) setCommentForUserId(user._id);
    });
  }, [user, commentForUserId]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterUserId) params.set("userId", filterUserId);
      const res = await apiFetch<{ data: Comment[] }>(
        `/comments?${params}`
      );
      setComments(res.data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, filterUserId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchComments();
    });
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !targetId.trim()) return;

    setSaving(true);
    try {
      const body: Record<string, string> = {
        targetType,
        targetId,
        text: text.trim(),
      };
      if (isManager && commentForUserId && commentForUserId !== user?._id) {
        body.userId = commentForUserId;
      }

      await apiFetch("/comments", {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success("Comment added");
      setText("");
      fetchComments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/comments/${id}`, { method: "DELETE" });
      toast.success("Comment deleted");
      fetchComments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comments"
        description="Notes on days, time blocks, and team members"
      >
        {isManager && (
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs text-text-tertiary">
              Filter by member
            </label>
            <TeamMemberSelect
              value={filterUserId}
              onChange={setFilterUserId}
              includeAll
            />
          </div>
        )}
      </PageHeader>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-text-tertiary" />
            <p className="text-sm font-medium">Add comment</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-text-tertiary">
                Target type
              </label>
              <Select
                value={targetType}
                onChange={(e) => {
                  const t = e.target.value as "day" | "user";
                  setTargetType(t);
                  setTargetId(
                    t === "day"
                      ? new Date().toISOString().split("T")[0]
                      : user?._id ?? ""
                  );
                }}
              >
                <option value="day">Day</option>
                <option value="user">Team member</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-text-tertiary">
                {targetType === "day" ? "Date" : "Member"}
              </label>
              {targetType === "day" ? (
                <Input
                  type="date"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              ) : (
                <TeamMemberSelect
                  value={targetId}
                  onChange={setTargetId}
                />
              )}
            </div>
          </div>

          {isManager && (
            <div>
              <label className="mb-1.5 block text-xs text-text-tertiary">
                Comment on behalf of
              </label>
              <TeamMemberSelect
                value={commentForUserId}
                onChange={setCommentForUserId}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              Comment
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Write your note..."
            />
          </div>

          <Button type="submit" size="sm" disabled={!text.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post comment"}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-medium text-text-tertiary">
            Recent comments
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : comments.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-text-tertiary">
            No comments yet
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {comments.map((c) => (
              <li key={c._id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                      <span className="font-medium text-text-primary">
                        {c.userName}
                      </span>
                      {c.createdByName && c.createdByName !== c.userName && (
                        <span>· by {c.createdByName}</span>
                      )}
                      <span>· {formatDate(c.createdAt)}</span>
                      <span className="rounded bg-surface-elevated px-1.5 py-0.5">
                        {TARGET_LABELS[c.targetType] ?? c.targetType}:{" "}
                        {c.targetId}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-primary">{c.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c._id)}
                    className="shrink-0 rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
