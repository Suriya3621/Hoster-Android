export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 md:p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square rounded-card skeleton" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 8 }) {
  return (
    <div className="p-4 md:p-6 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg skeleton" />
      ))}
    </div>
  );
}
