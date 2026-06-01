export default function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-slate-200/50"></div>
      <div className="p-4 space-y-3">
        <div className="w-12 h-4 bg-slate-200 rounded"></div>
        <div className="w-3/4 h-6 bg-slate-200 rounded"></div>
        <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
        <div className="w-1/3 h-6 bg-slate-200 rounded mt-4"></div>
      </div>
    </div>
  );
}
