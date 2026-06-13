import { Search, Scale, ArrowRightLeft, RefreshCw } from 'lucide-react';

// ✅ onRefresh: 로고 클릭 시 데이터 새로고침 콜백
// ✅ isRefreshing: 새로고침 중 여부 (스피너 표시)
export default function Header({
  onOpenRegister,
  isCompareMode,
  onToggleCompareMode,
  onRefresh,
  isRefreshing
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">

        {/* ✅ 로고 영역 - 클릭 시 데이터 새로고침 */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="클릭하면 최신 데이터를 다시 불러옵니다"
          style={{ cursor: isRefreshing ? 'wait' : 'pointer' }}
          className="flex items-center gap-2 group rounded-xl px-2 py-1.5 -ml-2
            hover:bg-slate-100 active:bg-slate-200
            transition-all duration-200 select-none"
          aria-label="데이터 새로고침"
        >
          {/* 아이콘 박스 */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ backgroundColor: isRefreshing ? '#818cf8' : '#4f46e5' }}
          >
            {isRefreshing ? (
              <RefreshCw
                className="text-white w-4 h-4"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            ) : (
              <ArrowRightLeft className="text-white w-4 h-4" strokeWidth={2.5} />
            )}
          </div>

          {/* 텍스트 */}
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: '#1e293b' }}>
            중고물품{' '}
            <span style={{ color: '#4f46e5' }}>분석 플랫폼</span>
          </h1>

          {/* 새로고침 중 텍스트 */}
          {isRefreshing && (
            <span className="text-xs font-semibold hidden sm:inline" style={{ color: '#6366f1' }}>
              갱신 중...
            </span>
          )}
        </button>

        {/* 우측 버튼들 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCompareMode}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors border ${
              isCompareMode
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            비교 해보기
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            시세 알아보기
          </button>
        </div>
      </div>

      {/* CSS spin 애니메이션 (Tailwind animate-spin이 안 될 경우 대비) */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
