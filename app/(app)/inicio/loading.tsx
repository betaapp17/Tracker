export default function Loading() {
  return (
    <div className="px-4 pt-12 space-y-4 animate-pulse">
      <div className="h-36 rounded-3xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-200" />)}
      </div>
      <div className="h-28 rounded-2xl bg-gray-200" />
      <div className="h-44 rounded-2xl bg-gray-200" />
      <div className="h-48 rounded-2xl bg-gray-200" />
      <div className="h-56 rounded-2xl bg-gray-200" />
    </div>
  )
}
