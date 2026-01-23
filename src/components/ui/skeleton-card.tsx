'use client';

/**
 * Skeleton Card Component
 * Fast placeholder for loading states
 */

export function SkeletonCard() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-4" />
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
