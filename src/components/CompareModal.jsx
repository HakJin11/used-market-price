import { X, CheckCircle2, AlertTriangle, PackageOpen, Package } from 'lucide-react';

export default function CompareModal({ items, onClose, onReset }) {
  const safeItems = (items || []).filter(item => item && item.id);
  if (safeItems.length < 2) return null;

  // Find the cheapest item
  const cheapestPrice = Math.min(...safeItems.map(item => {
    const price = item.marketPrice;
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  }));
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">상품 비교</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              다시 선택
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto flex-grow custom-scrollbar">
          <div className="flex gap-4 min-w-max pb-4">
            {safeItems.map(item => {
              const marketPrice = item.marketPrice || 0;
              const isCheapest = marketPrice === cheapestPrice;
              const newProductPrice = item.newProductPrice || Math.round(marketPrice * 1.45);
              const bunjangPrice = item.bunjangPrice || marketPrice;
              const daangnPrice = item.daangnPrice || marketPrice;
              const defectDetail = item.defectDetail || '하자있음';
              const name = item.name || '알 수 없는 상품';
              const image = item.image || 'https://via.placeholder.com/150';

              return (
                <div key={item.id} className="w-64 flex flex-col bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative shadow-sm">
                  {isCheapest && (
                    <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" />
                      추천
                    </div>
                  )}
                  <div className="aspect-square w-full relative">
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 mb-3 h-10">{name}</h3>
                    
                    <div className="space-y-3 flex-grow">
                      <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400">새상품 (네이버 등)</span>
                          <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                            {newProductPrice.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg mt-1">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">새상품 대비 절약</span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">
                            {(newProductPrice - marketPrice).toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">판매가</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {(bunjangPrice || daangnPrice || marketPrice).toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">적정가</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{marketPrice.toLocaleString()}원</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400 min-w-max mr-2">상태</span>
                        <div className="flex items-center gap-1 text-right">
                          {item.hasDefect ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-rose-500 line-clamp-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{defectDetail}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-500">양호</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">개봉여부</span>
                        <div className="flex items-center gap-1">
                          {item.isSealed ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                              <Package className="w-3 h-3" />
                              미개봉
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <PackageOpen className="w-3 h-3" />
                              개봉
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
