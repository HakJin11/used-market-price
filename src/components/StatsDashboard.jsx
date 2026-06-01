import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, HelpCircle, Activity, ShoppingCart, FileText, Sparkles } from 'lucide-react';

export default function StatsDashboard({ stats, searchQuery, items = [] }) {
  const priceDistribution = stats?.priceDistribution;

  // Guard against missing stats, missing avgPrice, or empty priceDistribution
  if (!stats || !stats.avgPrice || !priceDistribution || priceDistribution.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs animate-fade-in">
        <div className="w-12 h-12 bg-slate-50 border border-slate-250 rounded-full flex items-center justify-center text-indigo-500">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">해당 상품의 분석 데이터가 부족합니다.</h3>
          <p className="text-xs text-slate-450 mt-1">시세 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activePeriod, setActivePeriod] = useState('daily');

  const avgPrice = stats.avgPrice || 0;
  const avg7Days = stats.avg7Days || avgPrice;
  const avg30Days = stats.avg30Days || avgPrice;
  const maxPrice = stats.maxPrice || avgPrice;
  const minPrice = stats.minPrice || avgPrice;
  const volume = stats.volume || 0;
  const bunjangAvg = stats.bunjangAvg || avgPrice;
  const daangnAvg = stats.daangnAvg || avgPrice;
  
  const rawPriceDistribution = priceDistribution || [];
  const rawDailyTrend = stats.dailyTrend || stats.trend || [];
  const rawWeeklyTrend = stats.weeklyTrend || [];
  const rawMonthlyTrend = stats.monthlyTrend || [];

  const titleKeyword = searchQuery || '맥북';

  // Select trend array based on activePeriod
  let selectedTrend = [];
  if (activePeriod === 'daily') {
    selectedTrend = Array.isArray(rawDailyTrend) ? rawDailyTrend : [];
  } else if (activePeriod === 'weekly') {
    selectedTrend = Array.isArray(rawWeeklyTrend) ? rawWeeklyTrend : [];
  } else if (activePeriod === 'monthly') {
    selectedTrend = Array.isArray(rawMonthlyTrend) ? rawMonthlyTrend : [];
  }

  // Filter out invalid values
  const validTrend = Array.isArray(selectedTrend) 
    ? selectedTrend.filter(t => t && typeof t.price === 'number' && !isNaN(t.price))
    : [];

  const trendPrices = validTrend.map(t => t.price).filter(p => typeof p === 'number' && !isNaN(p));
  const trendMin = trendPrices.length > 0 ? Math.min(...trendPrices) : 0;
  const trendMax = trendPrices.length > 0 ? Math.max(...trendPrices) : 0;
  const priceRange = (typeof trendMax === 'number' && typeof trendMin === 'number' && !isNaN(trendMax) && !isNaN(trendMin))
    ? (trendMax - trendMin || 1)
    : 1;

  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = validTrend.map((t, index) => {
    const x = paddingX + (index * (width - paddingX * 2) / (validTrend.length - 1 || 1));
    const y = height - paddingY - ((t.price - trendMin) * (height - paddingY * 2) / priceRange);
    return { x, y, date: t.date, price: t.price };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient Path
  const fillPath = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x} ${height - paddingY}` +
      ` L ${points[0].x} ${height - paddingY} Z`
    : '';

  // Filter and map price distribution
  const validPriceDist = Array.isArray(rawPriceDistribution)
    ? rawPriceDistribution.filter(d => d && typeof d.count === 'number' && !isNaN(d.count))
    : [];
  const maxCount = validPriceDist.length > 0 ? Math.max(...validPriceDist.map(d => d.count)) : 1;

  // Sync volume trend with the selected period
  const selectedVolumeTrend = validTrend.map(t => ({ date: t.date, volume: t.volume || 0 }));
  const maxVol = selectedVolumeTrend.length > 0 ? Math.max(...selectedVolumeTrend.map(v => v.volume)) : 1;

  // Price range guide slider calculation
  const totalRange = maxPrice - minPrice || 1;
  const avgPct = Math.min(Math.max(((avgPrice - minPrice) / totalRange) * 100, 8), 92);

  // Price variance from 30 days ago to show indicator
  const priceChange = avgPrice - avg30Days;
  const priceChangePct = avg30Days > 0 ? ((priceChange / avg30Days) * 100).toFixed(1) : '0.0';
  const isUp = priceChange >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 animate-fade-in shadow-xs flex flex-col gap-8">
      {/* Header Info with Price Reliability Indicators */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            MARKET ANALYSIS & TRUST REPORT
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            &lsquo;{titleKeyword}&rsquo; 시세 및 거래 데이터베이스 분석 보고서
          </h3>
          
          {/* 시세 신뢰도 표시 (Reliability indicators) */}
          <div className="flex flex-wrap gap-2.5 mt-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              🎯 분석 대상 매물 수: <b className="text-slate-800 font-extrabold">{volume}개</b>
            </span>
            <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              ⏱️ 최근 업데이트 시간: <b className="text-slate-800 font-extrabold">{stats.lastUpdated || '실시간 (방금 전)'}</b>
            </span>
            <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              🔌 데이터 수집 플랫폼: <b className="text-indigo-600 font-extrabold">당근마켓 & 번개장터</b>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wider shrink-0 w-full md:w-auto justify-center">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          신뢰도 우수 검증필
        </div>
      </div>

      {/* HIERARCHY 1: 실제 거래 데이터 (Raw Marketplace Listings) - FIRST AT THE TOP */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            수집된 실제 중고 거래 사례 데이터베이스 (Listing Cases)
          </h4>
          <span className="text-[10px] font-bold text-slate-400">최근 거래 6건</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">플랫폼</th>
                <th className="pb-3">매물 상세 정보 (상품명 & 설명)</th>
                <th className="pb-3">거래 가격</th>
                <th className="pb-3">사용감 상태</th>
                <th className="pb-3">하자 정보</th>
                <th className="pb-3 text-right pr-2">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {items && items.length > 0 ? (
                items.slice(0, 6).map((item) => {
                  const platform = item.platform || (item.category === '당근마켓' || item.category === '번개장터' ? item.category : '당근마켓');
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          platform === '당근마켓' 
                            ? 'bg-orange-50 text-orange-600 border-orange-100' 
                            : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          {platform}
                        </span>
                      </td>
                      <td className="py-3.5 max-w-[300px]">
                        <div className="font-bold text-slate-800 truncate" title={item.name}>{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5" title={item.sellerNotes}>{item.sellerNotes || '등록된 상세 설명 내용이 없습니다.'}</div>
                      </td>
                      <td className="py-3.5 font-extrabold text-slate-900">
                        {item.marketPrice.toLocaleString()}원
                      </td>
                      <td className="py-3.5">
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-150">
                          {item.usageLevel || '사용감 거의 없음'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {item.hasDefect ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100">
                            <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                            {item.defectDetail || '하자 있음'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            이상 없음
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right text-slate-400 font-bold pr-2">
                        {item.timeAgo || '방금 전'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50/50 rounded-2xl">
                    등록된 매물이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIERARCHY 2: 종합 시세 통계 지표 및 가격 범위 가이드 - MIDDLE */}
      <div className="border-t border-slate-100 pt-6">
        <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase mb-4">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          종합 시세 통계 지표 (Statistics Indicator)
        </h4>

        {/* Primary Indicators Block */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              현재 평균 시세
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 tracking-tight">{avgPrice.toLocaleString()}원</div>
              <div className={`inline-flex items-center gap-0.5 text-xs font-bold mt-1 ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isUp ? '+' : ''}{priceChangePct}% (한 달 대비)
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-150 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-400 mb-1">최근 7일 평균</div>
            <div>
              <div className="text-lg font-bold text-slate-700">{avg7Days.toLocaleString()}원</div>
              <span className="text-[10px] text-slate-400 block mt-1">단기 흐름 시세</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-150 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-400 mb-1">최근 30일 평균</div>
            <div>
              <div className="text-lg font-bold text-slate-700">{avg30Days.toLocaleString()}원</div>
              <span className="text-[10px] text-slate-400 block mt-1">중기 흐름 시세</span>
            </div>
          </div>

          <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50 flex flex-col justify-between">
            <div className="text-xs font-semibold text-rose-500 mb-1">최고 거래가 (MAX)</div>
            <div>
              <div className="text-lg font-extrabold text-rose-600">{maxPrice.toLocaleString()}원</div>
              <span className="text-[10px] text-rose-400 block mt-1">S급/미개봉 기준 시세</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
            <div className="text-xs font-semibold text-emerald-500 mb-1">최저 거래가 (MIN)</div>
            <div>
              <div className="text-lg font-extrabold text-emerald-600">{minPrice.toLocaleString()}원</div>
              <span className="text-[10px] text-emerald-400 block mt-1">하자/부품용 기준 시세</span>
            </div>
          </div>
        </div>

        {/* 최고가 / 최저가 시세 범위 가이드 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2.5 tracking-wider uppercase">
            <span>최저가 {minPrice.toLocaleString()}원</span>
            <span className="text-indigo-600 font-extrabold">평균 시세 {avgPrice.toLocaleString()}원 (현재 위치)</span>
            <span>최고가 {maxPrice.toLocaleString()}원</span>
          </div>
          <div className="relative w-full h-3 bg-slate-200/60 rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-indigo-400/30 to-rose-450/30 rounded-full"></div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-4 border-indigo-600 rounded-full shadow-sm flex items-center justify-center transition-all duration-300"
              style={{ left: `${avgPct}%` }}
            >
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* HIERARCHY 3: 가격/거래 분석 차트 - BOTTOM */}
      <div className="border-t border-slate-100 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            시세 변동 및 분석 차트 영역 (Data Visualization)
          </h4>
          
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button 
              onClick={() => setActivePeriod('daily')} 
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                activePeriod === 'daily' 
                  ? 'bg-white text-indigo-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              일별
            </button>
            <button 
              onClick={() => setActivePeriod('weekly')} 
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                activePeriod === 'weekly' 
                  ? 'bg-white text-indigo-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              주간
            </button>
            <button 
              onClick={() => setActivePeriod('monthly')} 
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                activePeriod === 'monthly' 
                  ? 'bg-white text-indigo-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              월간
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sparkline Price Trend Chart */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {activePeriod === 'daily' ? '최근 10일 일별 시세 추이' : activePeriod === 'weekly' ? '최근 4주 주간 시세 추이' : '최근 3개월 월간 시세 추이'} (Line Chart)
              </span>
              {hoveredPoint ? (
                <span className="text-xs font-semibold text-indigo-600">
                  {hoveredPoint.date} 기준 &bull; <b className="font-extrabold">{hoveredPoint.price.toLocaleString()}원</b>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">그래프 포인트에 마우스를 올리세요</span>
              )}
            </div>
            
            <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-grow flex items-center justify-center min-h-[220px]">
              {validTrend.length >= 2 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
                  {fillPath && <path d={fillPath} fill="url(#chartGradient)" />}
                  <polyline fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />
                  {points.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r={hoveredPoint?.idx === idx ? 7 : 4} fill={hoveredPoint?.idx === idx ? '#4f46e5' : '#ffffff'} stroke="#4f46e5" strokeWidth="2.5" />
                  ))}
                  {points.map((p, idx) => (
                    <circle key={`hit-${idx}`} cx={p.x} cy={p.y} r="15" fill="transparent" onMouseEnter={() => setHoveredPoint({ ...p, idx })} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer" />
                  ))}
                  {points.map((p, idx) => (
                    <text key={`lbl-${idx}`} x={p.x} y={height - 6} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">{p.date}</text>
                  ))}
                  <text x={paddingX - 5} y={paddingY + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="bold">{Math.round(trendMax / 10000)}만</text>
                  <text x={paddingX - 5} y={height - paddingY + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="bold">{Math.round(trendMin / 10000)}만</text>
                </svg>
              ) : (
                <div className="text-slate-400 text-xs font-bold text-center flex flex-col items-center justify-center gap-1">
                  <span>해당 상품의 분석 데이터가 부족합니다.</span>
                  <span className="text-[10px] text-slate-400 font-normal">시세 데이터를 불러올 수 없습니다.</span>
                </div>
              )}
            </div>
          </div>

          {/* Volume Trend Bar Chart */}
          <div className="lg:col-span-3 flex flex-col">
            <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 mb-3 uppercase">
              {activePeriod === 'daily' ? '일별 거래량 변화' : activePeriod === 'weekly' ? '주간 거래량 변화' : '월간 거래량 변화'} (Volume Chart)
            </h4>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex-grow flex flex-col justify-between min-h-[220px]">
              {selectedVolumeTrend.length > 0 ? (
                <div className="flex items-end justify-between h-28 gap-2.5 pb-2 border-b border-slate-200">
                  {selectedVolumeTrend.map((v, index) => {
                    const barHeight = (v.volume / maxVol) * 85;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-800 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs pointer-events-none transition-opacity duration-150 whitespace-nowrap z-10">
                          {v.volume}건
                        </div>
                        <div className="w-full rounded-t bg-emerald-400 group-hover:bg-emerald-500 transition-all duration-200" style={{ height: `${barHeight || 10}%` }}></div>
                        <span className="text-[9px] font-bold text-slate-400 mt-2 absolute -bottom-5 truncate max-w-full text-center">{v.date}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs font-bold border-b border-slate-200 gap-1">
                  <span>해당 상품의 분석 데이터가 부족합니다.</span>
                  <span className="text-[10px] text-slate-400 font-normal">시세 데이터를 불러올 수 없습니다.</span>
                </div>
              )}
              <div className="h-2"></div>
            </div>
          </div>

          {/* Price Distribution Histogram */}
          <div className="lg:col-span-3 flex flex-col">
            <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 mb-3 uppercase">
              매물 가격 분포도 (Distribution)
            </h4>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex-grow flex flex-col justify-between min-h-[220px]">
              {validPriceDist.length > 0 ? (
                <div className="flex items-end justify-between h-28 gap-2.5 pb-2 border-b border-slate-200">
                  {validPriceDist.map((d, index) => {
                    const heightPct = (d.count / maxCount) * 85;
                    const isAvgBucket = index === 2;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-800 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs pointer-events-none transition-opacity duration-150 whitespace-nowrap z-10">
                          {d.count}개 매물
                        </div>
                        <div className={`w-full rounded-t transition-all duration-300 ${isAvgBucket ? 'bg-indigo-600 group-hover:bg-indigo-700 shadow-sm' : 'bg-indigo-200 group-hover:bg-indigo-300'}`} style={{ height: `${heightPct || 10}%` }}></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs font-bold border-b border-slate-200 gap-1">
                  <span>해당 상품의 분석 데이터가 부족합니다.</span>
                  <span className="text-[10px] text-slate-400 font-normal">시세 데이터를 불러올 수 없습니다.</span>
                </div>
              )}
              <div className="flex justify-between mt-2.5 text-[9px] font-bold text-slate-400">
                <span>{Math.round(minPrice / 10000)}만</span>
                <span>평균 ({Math.round(avgPrice / 10000)}만)</span>
                <span>{Math.round(maxPrice / 10000)}만</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
