import { X, Search } from 'lucide-react';
import ItemCard from './ItemCard';
import SkeletonCard from './SkeletonCard';

export default function CompareSearchModal({ 
  searchQuery, 
  setSearchQuery, 
  items, 
  isLoading, 
  compareItems, 
  setCompareItems,
  onClose,
  onCompare
}) {
  const safeItems = items || [];
  const safeCompareItems = compareItems || [];

  const handleItemClick = (item) => {
    if (!item) return;
    setCompareItems(prev => {
      const safePrev = prev || [];
      if (safePrev.find(i => i.id === item.id)) {
        return safePrev.filter(i => i.id !== item.id);
      }
      if (safePrev.length >= 6) {
        alert('최대 6개까지만 선택 가능합니다.');
        return safePrev;
      }
      return [...safePrev, item];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header & Search Bar */}
        <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">비교할 상품 검색</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              autoFocus
              type="text"
              placeholder="비교하고 싶은 상품을 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl glass-input text-lg text-slate-700 dark:text-white placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : safeItems.length > 0 ? (
              safeItems.map((item) => {
                if (!item) return null;
                const isSelected = safeCompareItems.some(i => i.id === item.id);
                return (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleItemClick(item)} 
                    isSelected={isSelected}
                    isCompareMode={true}
                  />
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-500 glass dark:bg-slate-800/50 rounded-3xl">
                죄송합니다 제품을 발견하지 못했습니다
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-between items-center">
          <span className="font-bold text-slate-700 dark:text-slate-200 ml-4">
            선택됨: <span className="text-indigo-600 dark:text-indigo-400">{safeCompareItems.length}</span> / 6
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareItems([])}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              초기화
            </button>
            <button
              onClick={() => {
                if (safeCompareItems.length < 2) {
                  alert('비교하려면 최소 2개의 상품을 선택해주세요.');
                } else {
                  onCompare();
                }
              }}
              className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-colors ${
                safeCompareItems.length >= 2 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              비교하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
