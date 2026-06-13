import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── 위험도 색상 (훨씬 진하게) ─────────────────────────────────────────────────
const RISK = {
  '안전': {
    badge: '#ffffff',
    badgeBg: '#16a34a',  // 초록
    border: '#15803d',
    topBar: '#16a34a',
    shadow: 'rgba(22,163,74,0.25)',
  },
  '주의': {
    badge: '#ffffff',
    badgeBg: '#ea580c',  // 주황
    border: '#c2410c',
    topBar: '#ea580c',
    shadow: 'rgba(234,88,12,0.25)',
  },
  '위험': {
    badge: '#ffffff',
    badgeBg: '#dc2626',  // 빨강
    border: '#b91c1c',
    topBar: '#dc2626',
    shadow: 'rgba(220,38,38,0.3)',
  },
};
const DEFAULT_RISK = {
  badge: '#ffffff',
  badgeBg: '#475569',
  border: '#334155',
  topBar: '#475569',
  shadow: 'rgba(0,0,0,0.1)',
};

export default function ItemCard({ item, onClick, isSelected, isCompareMode }) {
  if (!item) return null;

  const riskLevel = item.riskLevel || '안전';
  const name = item.name || '알 수 없는 상품';
  const hasDefect = !!item.hasDefect;
  const defectDetail = item.defectDetail || '하자 있음';
  const marketPrice = item.marketPrice || 0;
  const bunjangPrice = item.bunjangPrice || marketPrice;
  const daangnPrice = item.daangnPrice || marketPrice;
  // 판매가 = 플랫폼 가격 중 낮은 것 (더 저렴하게 보이는 가격이 유입 유도)
  const salePrice = Math.min(
    bunjangPrice || Infinity,
    daangnPrice  || Infinity,
    marketPrice  || Infinity
  ) || marketPrice;
  const image = item.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

  const r = RISK[riskLevel] || DEFAULT_RISK;

  // 적정가 대비 판매가 차이
  const diff = marketPrice > 0 && salePrice > 0 ? marketPrice - salePrice : 0;
  const diffPct = salePrice > 0 && diff !== 0 ? Math.round((diff / salePrice) * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
        borderTop: `4px solid ${r.topBar}`,
        boxShadow: isSelected
          ? '0 0 0 3px rgba(79,70,229,0.3), 0 8px 24px rgba(0,0,0,0.12)'
          : `0 4px 12px ${r.shadow}, 0 1px 4px rgba(0,0,0,0.06)`,
        transition: 'all 0.18s ease',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${r.shadow}, 0 2px 8px rgba(0,0,0,0.1)`;
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
        e.currentTarget.style.borderColor = r.border;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = `0 4px 12px ${r.shadow}, 0 1px 4px rgba(0,0,0,0.06)`;
        e.currentTarget.style.transform = isSelected ? 'scale(1.02)' : 'scale(1)';
        e.currentTarget.style.borderColor = isSelected ? '#4f46e5' : '#e2e8f0';
      }}
    >
      {/* 비교모드 체크 */}
      {isCompareMode && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, pointerEvents: 'none' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: isSelected ? '#4f46e5' : 'rgba(255,255,255,0.85)',
            border: `2px solid ${isSelected ? '#4f46e5' : 'rgba(255,255,255,0.9)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isSelected && <CheckCircle2 style={{ width: 14, height: 14, color: 'white' }} />}
          </div>
        </div>
      )}

      {/* ── 이미지 영역 ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#f1f5f9' }}>
        <img
          src={image}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
          onError={e => {
            e.target.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* 위험도 배지 — 진한 색상 */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          backgroundColor: r.badgeBg,
          color: r.badge,
          padding: '3px 9px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.03em',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          {riskLevel}
        </div>

        {/* 플랫폼 배지 */}
        {item.platform && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            backgroundColor: item.platform === '당근마켓' ? 'rgba(234,88,12,0.92)' : 'rgba(220,38,38,0.92)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(4px)',
          }}>
            {item.platform}
          </div>
        )}

        {/* 시간 배지 */}
        {item.timeAgo && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.55)',
            color: 'white',
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            {item.timeAgo}
          </div>
        )}
      </div>

      {/* ── 정보 영역 ── */}
      <div style={{ padding: '14px 15px 16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

        {/* 카테고리 태그 */}
        {item.category && (
          <span style={{
            display: 'inline-block', marginBottom: 6,
            fontSize: 10, fontWeight: 700, color: '#6366f1',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {item.category}
          </span>
        )}

        {/* ✅ 제품명 — 크고 굵고 진하게 (핵심 강조) */}
        <h3 style={{
          margin: '0 0 10px',
          fontSize: 15,
          fontWeight: 900,
          color: '#0f172a',          // 가장 진한 slate-950
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'keep-all',
          letterSpacing: '-0.01em',
        }}>
          {name}
        </h3>

        {/* ✅ 하자 경고 — 강렬한 빨간 박스 */}
        {hasDefect && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            backgroundColor: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: 8,
            padding: '5px 9px',
            marginBottom: 10,
          }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#dc2626', flexShrink: 0 }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#991b1b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {defectDetail}
            </span>
          </div>
        )}

        {/* ── 가격 섹션 ── */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '2px solid #f1f5f9' }}>

          {/* ✅ 판매가 — 가장 먼저 눈에 들어오도록, 크고 굵게 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.02em' }}>
              판매가
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {salePrice.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 700, marginLeft: 1 }}>원</span>
            </span>
          </div>

          {/* ✅ 적정가 — 파란 배경 박스로 확실히 구분 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #93c5fd',
            borderRadius: 10,
            padding: '7px 11px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8' }}>AI 적정가</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1d4ed8', lineHeight: 1, letterSpacing: '-0.01em' }}>
                {marketPrice.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 700, marginLeft: 1 }}>원</span>
              </span>
              {diffPct !== 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '1px 5px',
                  borderRadius: 5,
                  backgroundColor: diffPct > 0 ? '#dcfce7' : '#fee2e2',
                  color: diffPct > 0 ? '#15803d' : '#b91c1c',
                }}>
                  {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
