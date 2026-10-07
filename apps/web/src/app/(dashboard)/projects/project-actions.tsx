"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useApiClient } from "@/hooks/use-api-client";

interface ProjectSummary {
  _id: string;
  name: string;
  description: string;
  colorHex: string;
  isActive: boolean;
  todayHours: number;
  todaySessions: number;
}

interface ProjectActionsProps {
  userRole: string;
  projects: ProjectSummary[];
}

const COLORS = [
  "#52525b", "#2563eb", "#16a34a", "#dc2626",
  "#ca8a04", "#db2777", "#0891b2", "#7c3aed",
];

export function ProjectActions({ userRole }: ProjectActionsProps) {
  const router = useRouter();
  const { apiFetch } = useApiClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const canCreate = userRole === "admin" || userRole === "manager";

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          colorHex: color,
        }),
      });
      toast.success("Project created");
      setShowModal(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!canCreate) return null;

  return (
    <>
      <Button size="sm" onClick={() => setShowModal(true)}>
        <Plus className="h-3.5 w-3.5" />
        New project
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New project"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-tertiary">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    color === c ? "border-text-primary scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
