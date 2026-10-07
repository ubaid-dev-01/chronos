import { useState } from "react";
import ChronosLogoMark from "./ChronosLogoMark";
import { isTauri, login } from "../lib/tauri";

interface Props {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const browserPreview = !isTauri();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chronos-shell justify-center">
      <div className="mb-8 flex items-center justify-center gap-3">
        <ChronosLogoMark size="md" />
        <span className="text-2xl font-bold tracking-tight">Chronos</span>
      </div>

      {browserPreview && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs text-warning">
          Browser preview — tracking needs `pnpm tauri dev`.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="chronos-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="chronos-input"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="chronos-btn-primary w-full"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-xs text-muted">
          Same email and password as the Chronos web dashboard
        </p>
      </form>
    </div>
  );
}
