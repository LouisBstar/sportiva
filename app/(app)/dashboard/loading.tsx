// Next.js displays this automatically during page navigation / data fetching

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className ?? ""}`} />
  );
}

function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="bg-gray-50 min-h-screen px-4 pt-5 pb-28 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-1.5">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-7 w-40" />
        </div>
        <SkeletonBox className="w-10 h-10 rounded-full" />
      </div>

      {/* Calorie balance */}
      <SkeletonCard>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <SkeletonBox className="h-8 w-24" />
            <SkeletonBox className="h-3 w-28" />
          </div>
          <SkeletonBox className="h-5 w-20" />
        </div>
        <SkeletonBox className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Macros chart */}
      <SkeletonCard>
        <SkeletonBox className="h-3 w-24" />
        <div className="flex justify-center py-2">
          <SkeletonBox className="w-36 h-36 rounded-full" />
        </div>
      </SkeletonCard>

      {/* Score antifragile */}
      <SkeletonCard>
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-5">
          <SkeletonBox className="w-[88px] h-[88px] rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-3 w-3/4" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </SkeletonCard>

      {/* Meals section */}
      <SkeletonCard>
        <SkeletonBox className="h-3 w-24" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <SkeletonBox className="w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <SkeletonBox className="h-3 w-3/4" />
              <SkeletonBox className="h-2.5 w-1/2" />
            </div>
            <SkeletonBox className="h-4 w-12" />
          </div>
        ))}
      </SkeletonCard>

      {/* Sport section */}
      <SkeletonCard>
        <SkeletonBox className="h-3 w-20" />
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <SkeletonBox className="h-3 w-1/2" />
            <SkeletonBox className="h-2.5 w-1/3" />
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
}
