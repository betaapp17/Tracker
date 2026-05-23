export default function Loading() {
  return (
    <div className="px-4 pt-12 animate-pulse">
      <div className="mb-5">
        <div className="h-8 w-40 rounded-lg bg-gray-200 mb-2" />
        <div className="h-4 w-28 rounded-lg bg-gray-200" />
      </div>
      {/* Month filter bar */}
      <div className="h-9 rounded-xl bg-gray-200 mb-4" />
      {/* Date groups */}
      <div className="space-y-4">
        {[3, 2, 4].map((count, gi) => (
          <div key={gi}>
            <div className="h-3 w-32 rounded bg-gray-200 mb-2" />
            <div className="rounded-2xl bg-white overflow-hidden divide-y divide-gray-100">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
