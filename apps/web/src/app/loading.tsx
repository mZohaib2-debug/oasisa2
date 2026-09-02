export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-40 rounded-2xl bg-charcoal-700/5" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="card p-3">
            <div className="aspect-square w-full rounded-lg bg-charcoal-700/5" />
            <div className="mt-3 h-3 w-3/4 rounded bg-charcoal-700/5" />
            <div className="mt-2 h-3 w-1/2 rounded bg-charcoal-700/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
