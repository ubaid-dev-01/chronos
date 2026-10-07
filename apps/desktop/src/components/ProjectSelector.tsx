import { useEffect, useState } from "react";
import { fetchProjects, openDashboard } from "../lib/tauri";

interface Project {
  id: string;
  name: string;
  color_hex: string;
}

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  hidden?: boolean;
}

export default function ProjectSelector({
  selected,
  onSelect,
  disabled,
  hidden,
}: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hidden) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchProjects()
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
        if (data.length === 1) onSelect(data[0].id);
      })
      .catch((err) => {
        if (cancelled) return;
        setProjects([]);
        setError(
          err instanceof Error ? err.message : "Could not load projects"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // intentionally omit selected — avoid refetch loops when auto-selecting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelect, hidden]);

  if (hidden) return null;

  if (loading) {
    return <p className="mb-3 text-sm text-muted">Loading projects...</p>;
  }

  if (error) {
    return <p className="mb-3 text-sm text-danger">{error}</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mb-3 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-muted">
        <p>No projects in your org yet.</p>
        <button
          type="button"
          onClick={() => openDashboard("/dashboard")}
          className="mt-1 text-xs text-brand-light underline"
        >
          Create one in the web dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm text-muted">Project</label>
      <select
        value={selected}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
        className="chronos-input"
      >
        <option value="">Select a project...</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
