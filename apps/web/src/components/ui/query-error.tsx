'use client';

export function QueryError ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-left font-medium underline underline-offset-2 sm:text-right"
        >
          Try again
        </button>
      )}
    </div>
  );
}
