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
import { mockData } from './data/mockData';

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

  // ✅ 로고 클릭 새로고침용 상태
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ✅ 크롤링 오류 배너용 상태
  const [crawlError, setCrawlError] = useState(null);

  // Theme Locked to Light White Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Compare Flow States
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
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore]);

  // 테마: 항상 라이트 모드
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const sanitized = searchQuery.trim().substring(0, 60);
    const handler = setTimeout(() => setDebouncedQuery(sanitized), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 검색어·카테고리 변경 시 첫 데이터 로딩
  useEffect(() => {
    setItems([]);
    setStats(null);
    setPage(1);
    setHasMore(true);
    fetchData(1, true, debouncedQuery);
  }, [debouncedQuery, activeCategory]);

  // 무한 스크롤: 페이지 변경 시
  useEffect(() => {
    if (page > 1) {
      fetchData(page, false, debouncedQuery);
    }
  }, [page, activeCategory]);

  // ──────────────────────────────────────────
  // 데이터 패치 함수
  // ──────────────────────────────────────────
  const fetchData = async (pageNum, isInitial, query) => {
    currentSearchIdRef.current += 1;
    const thisSearchId = currentSearchIdRef.current;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      // 서버 헬스체크
      if (pageNum === 1) {
        try {
          await axios.get('/api/health', { timeout: 2000, signal: controller.signal });
          if (thisSearchId !== currentSearchIdRef.current) return;
          setIsOnline(true);
        } catch (err) {
          if (thisSearchId !== currentSearchIdRef.current) return;
          if (err.name === 'CanceledError' || axios.isCancel(err)) return;
          setIsOnline(false);
          throw new Error('Offline');
        }
      }

      const keyword = (query || '').trim();
      // 검색어 없고 카테고리 전체 → 빈 화면
      if (!keyword && activeCategory === '전체') {
        if (thisSearchId !== currentSearchIdRef.current) return;
        setItems([]);
        setStats(null);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        return;
      }

      const res = await axios.get(
        `/api/search?q=${encodeURIComponent(keyword)}&page=${pageNum}&category=${encodeURIComponent(activeCategory)}`,
        { signal: controller.signal }
      );

      if (thisSearchId !== currentSearchIdRef.current) return;

      const newItems = res.data?.items || [];
      const newStats = res.data?.stats || null;
      const crawlStatus = res.data?.crawlStatus || null;

      // 크롤링 오류 메시지 처리
      if (crawlStatus) {
        if (crawlStatus.crawlFailed) {
          setCrawlError('데이터 수집 서비스에 일시적인 문제가 발생했습니다. 캐시된 데이터를 표시합니다.');
        } else if (crawlStatus.daangnFailed) {
          setCrawlError('당근마켓 데이터 수집에 실패했습니다. 번개장터 데이터만 표시됩니다.');
        } else if (crawlStatus.bunjangFailed) {
          setCrawlError('번개장터 데이터 수집에 실패했습니다. 당근마켓 데이터만 표시됩니다.');
        } else {
          setCrawlError(null);
        }
      } else {
        setCrawlError(null);
      }

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

      if (isInitial) {
        setIsLoading(false);
        setIsRefreshing(false);
      } else {
        setIsLoadingMore(false);
      }
    } catch (error) {
      if (thisSearchId !== currentSearchIdRef.current) return;
      if (error.name === 'CanceledError' || axios.isCancel(error) || error.message === 'canceled') return;

      // 오프라인 폴백
      console.log('Using offline mock data fallback');
      setIsOnline(false);

      timeoutRef.current = setTimeout(() => {
        if (thisSearchId !== currentSearchIdRef.current) return;

        const safeQuery = (query || '').trim();
        const filteredMock = mockData.filter(item => {
          if (!item || !item.name) return false;
          const matchesQuery = !safeQuery ||
            item.name.toLowerCase().includes(safeQuery.toLowerCase()) ||
            (item.id && item.id.includes(safeQuery));
          const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
          return matchesQuery && matchesCategory;
        });

        const prices = filteredMock.map(i => i.marketPrice).filter(p => typeof p === 'number' && p > 0);
        let offlineStats = null;
        if (prices.length > 0) {
          const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          offlineStats = {
            avgPrice: avg,
            avg7Days: Math.round(avg * 0.98),
            avg30Days: Math.round(avg * 1.03),
            maxPrice: Math.max(...prices),
            minPrice: Math.min(...prices),
            volume: prices.length * 6 + 14,
            bunjangAvg: avg,
            daangnAvg: avg,
            priceDistribution: [],
            trend: [],
            volumeTrend: [],
            dailyTrend: [],
            weeklyTrend: [],
            monthlyTrend: []
          };
        }

        const expanded = Array(10).fill(filteredMock).flat().map((item, idx) => ({
          ...item, id: `${item.id}_${idx}`
        }));
        const perPage = 20;
        const slice = expanded.slice((pageNum - 1) * perPage, pageNum * perPage);

        if (slice.length === 0) {
          setHasMore(false);
          if (isInitial) { setItems([]); setStats(null); }
        } else {
          setItems(prev => isInitial ? slice : [...(prev || []), ...slice]);
          if (isInitial) setStats(offlineStats);
        }

        if (isInitial) {
          setIsLoading(false);
          setIsRefreshing(false);
        } else {
          setIsLoadingMore(false);
        }
      }, 400);
    }
  };

  // ✅ 로고 클릭 시 데이터 새로고침 (window.location.reload 미사용)
  const handleRefresh = useCallback(() => {
    if (isLoading || isRefreshing) return;
    setCrawlError(null);
    setIsRefreshing(true);
    setItems([]);
    setStats(null);
    setPage(1);
    setHasMore(true);
    fetchData(1, true, debouncedQuery);
  }, [isLoading, isRefreshing, debouncedQuery]);

  const filteredItems = (items || []).filter(item => {
    if (!item) return false;
    if (activeCategory === '전체') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="min-h-screen relative pb-20 bg-[#f8f9fc]">
      {/* ✅ 헤더에 onRefresh, isRefreshing 전달 */}
      <Header
        onOpenRegister={() => setIsRegisterOpen(true)}
        isCompareMode={showCompareSearchModal}
        onToggleCompareMode={() => setShowCompareSearchModal(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* ✅ 크롤링 오류 배너 */}
      {crawlError && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-semibold text-amber-800">{crawlError}</span>
          </div>
          <button
            onClick={() => setCrawlError(null)}
            className="text-amber-600 hover:text-amber-900 text-xs font-bold shrink-0 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors"
          >
            닫기
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 mt-8 animate-fade-in max-w-7xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight transition-colors">
            중고거래 <span className="text-indigo-600">데이터 시세 분석</span> 플랫폼
          </h2>
          <p className="text-slate-500 text-sm">실시간 당근마켓과 번개장터의 거래 정보를 수집하여 정밀 적정 시세를 산출합니다.</p>
        </div>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Filter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {/* 통계 대시보드 */}
        {!isLoading && stats && debouncedQuery && (
          <StatsDashboard stats={stats} searchQuery={debouncedQuery} items={filteredItems} />
        )}

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-8">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isLast = filteredItems.length === index + 1;
              return isLast ? (
                <div ref={lastItemElementRef} key={item.id}>
                  <ItemCard item={item} onClick={() => setSelectedItem(item)} isSelected={false} isCompareMode={false} />
                </div>
              ) : (
                <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} isSelected={false} isCompareMode={false} />
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">죄송합니다. 제품을 찾지 못했습니다.</h3>
                <p className="text-sm text-slate-400">다른 물품 이름을 검색하시거나 검색 키워드를 간결하게 입력해보세요.</p>
              </div>
            </div>
          )}

          {isLoadingMore && Array(5).fill(0).map((_, i) => <SkeletonCard key={`more-${i}`} />)}
        </div>
      </main>

      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {isRegisterOpen && <RegisterModal onClose={() => setIsRegisterOpen(false)} />}

      {showCompareSearchModal && (
        <CompareSearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          items={filteredItems}
          isLoading={isLoading}
          compareItems={compareItems}
          setCompareItems={setCompareItems}
          onClose={() => setShowCompareSearchModal(false)}
          onCompare={() => { setShowCompareSearchModal(false); setShowCompareModal(true); }}
        />
      )}

      {showCompareModal && (
        <CompareModal
          items={compareItems}
          onClose={() => setShowCompareModal(false)}
          onReset={() => { setCompareItems([]); setShowCompareModal(false); setShowCompareSearchModal(true); }}
        />
      )}
    </div>
  );
}

export default App;
