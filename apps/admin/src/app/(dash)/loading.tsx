export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-ink-200" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-ink-100" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-ink-100" />
    </div>
  );
}
