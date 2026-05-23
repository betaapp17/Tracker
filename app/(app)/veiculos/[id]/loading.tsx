export default function Loading() {
  return (
    <div className="px-4 pt-12 animate-pulse">
      {/* Hero */}
      <div className="h-36 rounded-3xl bg-gray-300 mb-4" />
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-200" />)}
      </div>
      {/* Cost breakdown */}
      <div className="h-40 rounded-2xl bg-gray-200 mb-4" />
      {/* Transaction list */}
      <div>
        <div className="h-3 w-28 rounded bg-gray-200 mb-2" />
        <div className="rounded-2xl bg-white overflow-hidden divide-y divide-gray-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
