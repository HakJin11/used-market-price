import { Search, Plus, Sun, Moon, Scale, ArrowRightLeft } from 'lucide-react';

export default function Header({ 
  onOpenRegister, 
  isCompareMode,
  onToggleCompareMode
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="text-white w-4 h-4" strokeWidth={3} />
          </div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
            중고물품 <span className="text-indigo-600">분석 플랫폼</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleCompareMode}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors border ${
              isCompareMode 
                ? 'bg-indigo-150 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            비교 해보기
          </button>

          <button 
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Search className="w-4 h-4" />
            시세 알아보기
          </button>
        </div>
      </div>
    </header>
  );
}
