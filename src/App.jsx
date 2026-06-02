import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Filter from './components/Filter';
import ItemCard from './components/ItemCard';
import SkeletonCard from './components/SkeletonCard';
import DetailModal from './components/DetailModal';
import RegisterModal from './components/RegisterModal';
import CompareModal from './components/CompareModal';
import CompareSearchModal from './components/CompareSearchModal';
import StatsDashboard from './components/StatsDashboard';
import { mockData, categories } from './data/mockData';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  // Theme Locked to Light White Theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // New Compare Flow States
  const [showCompareSearchModal, setShowCompareSearchModal] = useState(false);
  const [compareItems, setCompareItems] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const observer = useRef();
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentSearchIdRef = useRef(0);
  
  const lastItemElementRef = useCallback(node => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore]);

  // Keep theme standard light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    return () => {
      // Cancel pending tasks on unmount
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Debounce search input changes (300ms)
  useEffect(() => {
    const sanitized = searchQuery.trim();
    const capped = sanitized.substring(0, 60);
    const handler = setTimeout(() => {
      setDebouncedQuery(capped);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // 첫 데이터 로딩 (검색어 변경 시)
  useEffect(() => {
    setItems([]);
    setStats(null);
    setPage(1);
    setHasMore(true);
    fetchData(1, true, debouncedQuery);
  }, [debouncedQuery ,activeCategory ]);

  // 페이지 변경 시 (무한 스크롤)
  useEffect(() => {
    if (page > 1) {
      fetchData(page, false, debouncedQuery);
    }
  }, [page]);

  const fetchData = async (pageNum, isInitial, query) => {
    currentSearchIdRef.current += 1;
    const thisSearchId = currentSearchIdRef.current;

    // Cancel previous pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Clear pending offline fallback timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      if (pageNum === 1) {
        try {
          await axios.get('/api/health', { timeout: 2000, signal: controller.signal });
          if (thisSearchId !== currentSearchIdRef.current) return;
          setIsOnline(true);
        } catch (err) {
          if (thisSearchId !== currentSearchIdRef.current) return;
          if (err.name === 'CanceledError' || axios.isCancel(err)) {
            return; // Aborted
          }
          setIsOnline(false);
          throw new Error('Offline');
        }
      }

      const keyword = (query || '').trim();
      if (!keyword && activeCategory === '전체') {
        if (thisSearchId !== currentSearchIdRef.current) return;
        setItems([]);
        setStats(null);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }
      const res = await axios.get(`/api/search?q=${encodeURIComponent(keyword)}&page=${pageNum}&category=${encodeURIComponent(activeCategory)}`, {
        signal: controller.signal
      });
      
      if (thisSearchId !== currentSearchIdRef.current) return;

      const newItems = res.data?.items || [];
      const newStats = res.data?.stats || null;
      
      if (newItems.length === 0) {
        setHasMore(false);
        if (isInitial) {
          setItems([]);
          setStats(null);
        }
      } else {
        setItems(prev => isInitial ? newItems : [...(prev || []), ...newItems]);
        if (isInitial) setStats(newStats);
      }
      
      if (isInitial) setIsLoading(false);
      else setIsLoadingMore(false);
    } catch (error) {
      if (thisSearchId !== currentSearchIdRef.current) return;

      if (error.name === 'CanceledError' || axios.isCancel(error) || error.message === 'canceled') {
        return; // Aborted, do not run state updates
      }

      console.log('Using offline mock data fallback');
      setIsOnline(false);
      
      timeoutRef.current = setTimeout(() => {
        if (thisSearchId !== currentSearchIdRef.current) return;

        const safeQuery = (query || '').trim();
        const filteredMock = mockData.filter(item => {
          if (!item || !item.name) return false;
          const matchesQuery = item.name.toLowerCase().includes(safeQuery.toLowerCase()) || item.id.includes(safeQuery);
          
          // 카테고리 매칭 여부 ('전체'면 패스, 아니면 카테고리 글자가 같아야 함)
          const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
          
          return matchesQuery && matchesCategory;
          return item.name.toLowerCase().includes(safeQuery.toLowerCase()) || 
                 item.id.includes(safeQuery);
        });

        // Offline stats calculation
        const prices = filteredMock.map(item => item.marketPrice).filter(p => typeof p === 'number' && p > 0);
        let offlineStats = null;
        if (prices.length > 0) {
          const sum = prices.reduce((a, b) => a + b, 0);
          const avg = Math.round(sum / prices.length);
          const max = Math.max(...prices);
          const min = Math.min(...prices);
          
          const bunjangAvg = Math.round(filteredMock.reduce((a, b) => a + (b.bunjangPrice || avg), 0) / (filteredMock.length || 1));
          const daangnAvg = Math.round(filteredMock.reduce((a, b) => a + (b.daangnPrice || avg), 0) / (filteredMock.length || 1));
          const volume = prices.length * 6 + 14;

          const trend = [];
          const volumeTrend = [];
          const days = ['05-26', '05-27', '05-28', '05-29', '05-30', '05-31', '06-01'];
          const priceVariances = [1.04, 1.05, 1.02, 1.03, 1.01, 1.00, 1.00];
          const volumeFactors = [0.8, 1.2, 0.95, 1.1, 0.85, 1.05, 1.00];

          days.forEach((day, index) => {
            trend.push({
              date: day,
              price: Math.round(avg * priceVariances[index])
            });
            volumeTrend.push({
              date: day,
              volume: Math.round(volume * volumeFactors[index])
            });
          });

          const priceDistribution = [];
          const binCount = 5;
          const range = max - min;
          const binWidth = range > 0 ? range / binCount : 10000;
          for (let i = 0; i < binCount; i++) {
            const binStart = min + (i * binWidth);
            const binEnd = min + ((i + 1) * binWidth);
            const count = prices.filter(p => p >= binStart && p <= binEnd).length;
            
            const formatPriceLabel = (val) => {
              if (val >= 10000) return `${Math.round(val / 10000)}만`;
              return `${val}원`;
            };
            priceDistribution.push({
              range: `${formatPriceLabel(binStart)} - ${formatPriceLabel(binEnd)}`,
              count: count || 0
            });
          }

          offlineStats = {
            avgPrice: avg,
            avg7Days: Math.round(avg * 0.98),
            avg30Days: Math.round(avg * 1.03),
            maxPrice: max,
            minPrice: min,
            volume,
            bunjangAvg,
            daangnAvg,
            priceDistribution,
            trend,
            volumeTrend,
            dailyTrend: trend,
            weeklyTrend: trend.slice(-4),
            monthlyTrend: trend.slice(-3)
          };
        }
        
        const expandedMock = Array(10).fill(filteredMock).flat().map((item, idx) => ({
          ...item,
          id: `${item.id}_${idx}`
        }));

        const itemsPerPage = 20;
        const startIndex = (pageNum - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const newItems = expandedMock.slice(startIndex, endIndex);

        if (newItems.length === 0) {
          setHasMore(false);
          if (isInitial) {
            setItems([]);
            setStats(null);
          }
        } else {
          setItems(prev => isInitial ? newItems : [...(prev || []), ...newItems]);
          if (isInitial) setStats(offlineStats);
        }
        
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }, 400);
    }
  };

  const filteredItems = (items || []).filter((item) => {
    if (!item) return false;
    if (activeCategory === '전체') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="min-h-screen relative pb-20 bg-[#f8f9fc]">
      <Header 
        onOpenRegister={() => setIsRegisterOpen(true)}
        isCompareMode={showCompareSearchModal}
        onToggleCompareMode={() => {
          setShowCompareSearchModal(true);
        }}
      />
      
      <main className="container mx-auto px-4 mt-8 animate-fade-in max-w-7xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight transition-colors">
            중고거래 <span className="text-indigo-600">데이터 시세 분석</span> 플랫폼
          </h2>
          <p className="text-slate-500 text-sm">실시간 당근마켓과 번개장터의 거래 정보를 수집하여 정밀 적정 시세를 산출합니다.</p>
        </div>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Filter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {/* Dynamic Statistical Analysis Report Dashboard placed ABOVE list - Conditional on searchQuery being truthy */}
        {!isLoading && stats && debouncedQuery && <StatsDashboard stats={stats} searchQuery={debouncedQuery} items={filteredItems} />}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-8">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              if (filteredItems.length === index + 1) {
                return (
                  <div ref={lastItemElementRef} key={item.id}>
                    <ItemCard 
                      item={item} 
                      onClick={() => setSelectedItem(item)} 
                      isSelected={false}
                      isCompareMode={false}
                    />
                  </div>
                );
              } else {
                return (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => setSelectedItem(item)} 
                    isSelected={false}
                    isCompareMode={false}
                  />
                );
              }
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">죄송합니다. 제품을 찾지 못했습니다.</h3>
                <p className="text-sm text-slate-400">다른 물품 이름을 검색하시거나 검색 키워드를 간결하게 입력해보세요.</p>
              </div>
            </div>
          )}
          
          {isLoadingMore && (
            Array(5).fill(0).map((_, i) => <SkeletonCard key={`more-${i}`} />)
          )}
        </div>
      </main>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      
      {isRegisterOpen && (
        <RegisterModal onClose={() => setIsRegisterOpen(false)} />
      )}

      {showCompareSearchModal && (
        <CompareSearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          items={filteredItems}
          isLoading={isLoading}
          compareItems={compareItems}
          setCompareItems={setCompareItems}
          onClose={() => setShowCompareSearchModal(false)}
          onCompare={() => {
            setShowCompareSearchModal(false);
            setShowCompareModal(true);
          }}
        />
      )}

      {showCompareModal && (
        <CompareModal 
          items={compareItems} 
          onClose={() => setShowCompareModal(false)} 
          onReset={() => {
            setCompareItems([]);
            setShowCompareModal(false);
            setShowCompareSearchModal(true); // 다시 검색 모달로 돌아감
          }}
        />
      )}
    </div>
  );
}

export default App;
