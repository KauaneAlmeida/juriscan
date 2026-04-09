"use client";

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-9 w-20 bg-gray-200 rounded mb-1" />
      <div className="h-4 w-32 bg-gray-200 rounded" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className={`${height} bg-gray-100 rounded-lg`} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
