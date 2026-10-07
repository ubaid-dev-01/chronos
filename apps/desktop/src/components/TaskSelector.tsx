import { useEffect, useState } from "react";
import { fetchMyTasks } from "../lib/tauri";

export interface AgentTask {
  id: string;
  title: string;
  list_name: string;
  project_id?: string | null;
  project_name?: string | null;
}

interface Props {
  selectedTaskId: string;
  onSelect: (task: AgentTask | null) => void;
  disabled?: boolean;
  hidden?: boolean;
}

export default function TaskSelector({
  selectedTaskId,
  onSelect,
  disabled,
  hidden,
}: Props) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hidden) {
      setLoading(false);
      return;
    }
    fetchMyTasks()
      .then((data) => {
        setTasks(data);
        setError("");
        if (data.length === 1) onSelect(data[0]);
      })
      .catch((err) =>
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not load assigned tasks"
        )
      )
      .finally(() => setLoading(false));
  }, [onSelect, hidden]);

  if (hidden) return null;

  if (loading) {
    return <p className="mb-3 text-sm text-muted">Loading your tasks...</p>;
  }

  if (error) {
    return <p className="mb-3 text-sm text-danger">{error}</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="mb-3 text-sm text-muted">
        No assigned tasks — pick a project below
      </p>
    );
  }

  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm text-muted">Assigned Task</label>
      <select
        value={selectedTaskId}
        disabled={disabled}
        onChange={(e) => {
          const task = tasks.find((t) => t.id === e.target.value) ?? null;
          onSelect(task);
        }}
        className="chronos-input"
      >
        <option value="">Select a task...</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
            {task.project_name ? ` · ${task.project_name}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
