export default function Loading() {
  return (
    <div className="px-4 pt-12 animate-pulse">
      <div className="mb-5">
        <div className="h-8 w-36 rounded-lg bg-gray-200 mb-2" />
        <div className="h-4 w-28 rounded-lg bg-gray-200" />
      </div>
      {/* Month filter */}
      <div className="h-9 rounded-xl bg-gray-200 mb-5" />
      {/* 2x2 stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
      </div>
      {/* Profit banner */}
      <div className="h-24 rounded-2xl bg-gray-200 mb-4" />
      {/* Category spending */}
      <div className="h-48 rounded-2xl bg-gray-200 mb-4" />
      {/* Vehicle table */}
      <div className="rounded-2xl bg-white overflow-hidden mb-4">
        <div className="h-4 w-36 rounded bg-gray-200 mx-4 mt-4 mb-2" />
        <div className="divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      {/* Trend chart */}
      <div className="h-56 rounded-2xl bg-gray-200" />
    </div>
  )
}
