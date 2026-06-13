import { X, CheckCircle2, AlertTriangle, ExternalLink, TrendingDown } from 'lucide-react';

export default function CompareModal({ items, onClose, onReset }) {
  const safeItems = (items || []).filter(item => item && item.id);
  if (safeItems.length < 2) return null;

  // 적정가 기준 최저가 찾기
  const minMarket = Math.min(...safeItems.map(i => i.marketPrice || Infinity).filter(p => p > 0 && p !== Infinity));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          width: '100%', maxWidth: 1080,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── 헤더 ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              상품 비교
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              {safeItems.length}개 상품을 한눈에 비교합니다
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onReset}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 700,
                background: 'rgba(255,255,255,0.2)', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12, cursor: 'pointer',
              }}
            >
              다시 선택
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 18, height: 18, color: 'white' }} />
            </button>
          </div>
        </div>

        {/* ── 카드 목록 ── */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, padding: '24px' }}>
          <div style={{ display: 'flex', gap: 20, minWidth: 'max-content', paddingBottom: 8 }}>
            {safeItems.map(item => {
              const market = item.marketPrice || 0;
              const sale   = Math.min(item.bunjangPrice || Infinity, item.daangnPrice || Infinity, market || Infinity);
              const saleDisplay = sale === Infinity ? market : sale;
              const newProd = item.newProductPrice || Math.round(market * 1.45);
              const saving  = newProd - market;
              const isBest  = market === minMarket && market > 0;

              // URL 우선순위: bunjangUrl/daangnUrl → url → 검색 폴백
              const directUrl = item.bunjangUrl || item.daangnUrl || item.url || null;
              const isDirectLink = directUrl &&
                (/bunjang\.co\.kr\/products\/\d+/.test(directUrl) ||
                 /daangn\.com\/articles\/\d+/.test(directUrl));
              const platform = item.platform || '';
              const searchFallback = platform === '번개장터'
                ? `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(item.keyword || item.name || '')}`
                : `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${encodeURIComponent(item.keyword || item.name || '')}`;
              const finalUrl = directUrl || searchFallback;

              const riskColors = {
                '안전': { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
                '주의': { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
                '위험': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
              };
              const riskC = riskColors[item.riskLevel] || riskColors['안전'];

              return (
                <div
                  key={item.id}
                  style={{
                    width: 260, flexShrink: 0,
                    background: isBest ? 'linear-gradient(180deg, #f0fdf4 0%, white 100%)' : 'white',
                    borderRadius: 20,
                    border: isBest ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: isBest
                      ? '0 8px 24px rgba(22,163,74,0.18)'
                      : '0 2px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {/* 추천 배지 */}
                  {isBest && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12, zIndex: 10,
                      backgroundColor: '#16a34a', color: 'white',
                      padding: '4px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: 4,
                      boxShadow: '0 2px 8px rgba(22,163,74,0.4)',
                    }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} />
                      최저 적정가
                    </div>
                  )}

                  {/* 이미지 */}
                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f8fafc' }}>
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    {/* 플랫폼 배지 */}
                    {platform && (
                      <div style={{
                        position: 'absolute', bottom: 8, left: 8,
                        backgroundColor: platform === '당근마켓' ? '#ea580c' : '#dc2626',
                        color: 'white', padding: '3px 8px', borderRadius: 6,
                        fontSize: 10, fontWeight: 800,
                      }}>
                        {platform}
                      </div>
                    )}
                  </div>

                  {/* 본문 */}
                  <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 14 }}>

                    {/* 상품명 */}
                    <h3 style={{
                      margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a',
                      lineHeight: 1.35, display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.name || '알 수 없는 상품'}
                    </h3>

                    {/* 위험도 */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      backgroundColor: riskC.bg, color: riskC.color,
                      border: `1px solid ${riskC.border}`,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                      alignSelf: 'flex-start',
                    }}>
                      {item.riskLevel || '안전'} 매물
                    </div>

                    {/* ════ 핵심 가격 정보 ════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* ✅ 판매가 — 가장 크고 진하게 */}
                      <div style={{
                        background: '#1e293b',
                        borderRadius: 14, padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          판매가
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {saleDisplay > 0 ? saleDisplay.toLocaleString() : '-'}
                          <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 2 }}>원</span>
                        </div>
                      </div>

                      {/* ✅ 적정가 — 파란 강조 박스 */}
                      <div style={{
                        background: '#eff6ff',
                        border: '2px solid #3b82f6',
                        borderRadius: 14, padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          AI 적정가
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {market > 0 ? market.toLocaleString() : '-'}
                          <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 2 }}>원</span>
                        </div>
                      </div>

                      {/* 새상품 대비 절약 */}
                      {saving > 0 && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#f0fdf4', border: '1px solid #86efac',
                          borderRadius: 10, padding: '8px 12px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <TrendingDown style={{ width: 14, height: 14, color: '#16a34a' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>새상품 대비 절약</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#16a34a' }}>
                            -{saving.toLocaleString()}원
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 하자 상태 */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 6,
                      padding: '8px 10px', borderRadius: 10,
                      background: item.hasDefect ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${item.hasDefect ? '#fca5a5' : '#86efac'}`,
                    }}>
                      {item.hasDefect ? (
                        <>
                          <AlertTriangle style={{ width: 13, height: 13, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', lineHeight: 1.4 }}>
                            {item.defectDetail || '하자 있음'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓ 하자 없음 (양호)</span>
                      )}
                    </div>

                    {/* ✅ 구매 바로가기 버튼 */}
                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '12px',
                        background: platform === '당근마켓' ? '#ea580c' : '#dc2626',
                        color: 'white', fontWeight: 800, fontSize: 13,
                        borderRadius: 12, textDecoration: 'none',
                        boxShadow: platform === '당근마켓'
                          ? '0 4px 12px rgba(234,88,12,0.35)'
                          : '0 4px 12px rgba(220,38,38,0.35)',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <ExternalLink style={{ width: 15, height: 15 }} />
                      {isDirectLink
                        ? `${platform} 매물 바로가기`
                        : `${platform || '사이트'} 검색 결과 보기`}
                    </a>
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
