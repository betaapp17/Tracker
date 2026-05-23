export default function Loading() {
  return (
    <div className="px-4 pt-12 animate-pulse">
      <div className="h-8 w-16 rounded-lg bg-gray-200 mb-6" />
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-200" />
        </div>
      </div>
      {/* Settings section */}
      <div className="mb-6">
        <div className="h-3 w-28 rounded bg-gray-200 mb-2" />
        <div className="rounded-2xl bg-white overflow-hidden divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="h-3.5 flex-1 rounded bg-gray-200" />
              <div className="w-4 h-4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      {/* App info card */}
      <div className="h-32 rounded-2xl bg-gray-200" />
    </div>
  )
}
