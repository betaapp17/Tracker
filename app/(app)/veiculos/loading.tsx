export default function Loading() {
  return (
    <div className="px-4 pt-12 animate-pulse">
      <div className="mb-5">
        <div className="h-8 w-32 rounded-lg bg-gray-200 mb-2" />
        <div className="h-4 w-48 rounded-lg bg-gray-200" />
      </div>
      {/* Stats hero */}
      <div className="mb-4 space-y-3">
        <div className="h-28 rounded-3xl bg-gray-300" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-200" />)}
        </div>
      </div>
      {/* Vehicle list section */}
      <div className="mt-6 space-y-6">
        <div>
          <div className="h-3 w-40 rounded bg-gray-200 mb-2" />
          <div className="rounded-2xl bg-white overflow-hidden divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-3.5 w-20 rounded bg-gray-200" />
                  <div className="h-3 w-14 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
