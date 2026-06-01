import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ItemCard({ item, onClick, isSelected, isCompareMode }) {
  if (!item) return null;
  
  const riskLevel = item.riskLevel || '안전';
  const name = item.name || '알 수 없는 상품';
  const hasDefect = !!item.hasDefect;
  const defectDetail = item.defectDetail || '하자 있음';
  const marketPrice = item.marketPrice || 0;
  const daangnPrice = item.daangnPrice || marketPrice;
  const bunjangPrice = item.bunjangPrice || marketPrice;
  const image = item.image || 'https://via.placeholder.com/150';

  const getRiskColor = (level) => {
    switch (level) {
      case '안전': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800';
      case '주의': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800';
      case '위험': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const riskGlow = riskLevel === '위험' ? 'shadow-[0_0_15px_rgba(244,63,94,0.4)]' : '';

  return (
    <div 
      onClick={onClick}
      className={`glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full relative transition-all duration-300 ${
        isSelected 
          ? 'ring-4 ring-indigo-500 dark:ring-indigo-400 shadow-xl scale-[1.02]' 
          : isCompareMode ? 'hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700' : ''
      }`}
    >
      {isCompareMode && (
        <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
          <div className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-indigo-500 border-indigo-500 text-white' 
              : 'bg-white/50 border-white/80 dark:bg-slate-800/50 dark:border-slate-500 backdrop-blur-sm'
          }`}>
            {isSelected && <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
      )}

      <div className="relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-md ${getRiskColor(riskLevel)} ${riskGlow}`}>
          {riskLevel}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{name}</h3>
        </div>
        {hasDefect && (
          <div className="flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400 font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{defectDetail}</span>
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">판매가</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {(bunjangPrice || daangnPrice || marketPrice).toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">적정가</span>
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
              {marketPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
