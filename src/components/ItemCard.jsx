import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// 위험도별 색상 맵
const RISK_COLORS = {
  '안전': { badge: '#065f46', badgeBg: '#d1fae5', border: '#10b981', cardTop: '#10b981' },
  '주의': { badge: '#92400e', badgeBg: '#fef3c7', border: '#f59e0b', cardTop: '#f59e0b' },
  '위험': { badge: '#7f1d1d', badgeBg: '#fee2e2', border: '#ef4444', cardTop: '#ef4444' },
};
const DEFAULT_RISK = { badge: '#334155', badgeBg: '#f1f5f9', border: '#cbd5e1', cardTop: '#cbd5e1' };

export default function ItemCard({ item, onClick, isSelected, isCompareMode }) {
  if (!item) return null;

  const riskLevel = item.riskLevel || '안전';
  const name = item.name || '알 수 없는 상품';
  const hasDefect = !!item.hasDefect;
  const defectDetail = item.defectDetail || '하자 있음';
  const marketPrice = item.marketPrice || 0;
  const daangnPrice = item.daangnPrice || marketPrice;
  const bunjangPrice = item.bunjangPrice || marketPrice;
  const salePrice = bunjangPrice || daangnPrice || marketPrice;
  const image = item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

  const riskStyle = RISK_COLORS[riskLevel] || DEFAULT_RISK;

  // 판매가 대비 적정가 차이
  const priceDiff = salePrice > 0 && marketPrice > 0 ? marketPrice - salePrice : 0;
  const priceDiffPct = salePrice > 0 ? Math.round((priceDiff / salePrice) * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        borderTop: `3px solid ${riskStyle.cardTop}`,
        boxShadow: riskLevel === '위험'
          ? '0 0 14px rgba(239,68,68,0.25), 0 1px 3px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.08)',
      }}
      className={`
        bg-white rounded-2xl overflow-hidden cursor-pointer
        flex flex-col h-full relative
        border border-slate-200
        hover:shadow-md hover:scale-[1.015] hover:border-slate-300
        transition-all duration-200
        ${isSelected ? 'ring-4 ring-indigo-500 shadow-xl scale-[1.02]' : ''}
      `}
    >
      {/* 비교 선택 체크 */}
      {isCompareMode && (
        <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isSelected ? '#4f46e5' : 'rgba(255,255,255,0.7)',
              borderColor: isSelected ? '#4f46e5' : 'rgba(255,255,255,0.9)',
              color: 'white'
            }}
          >
            {isSelected && <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
      )}

      {/* 이미지 */}
      <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* 위험도 배지 */}
        <div
          style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: riskStyle.badgeBg,
            color: riskStyle.badge,
            border: `1px solid ${riskStyle.border}`,
            padding: '2px 8px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {riskLevel}
        </div>

        {/* 플랫폼 배지 */}
        {item.platform && (
          <div
            style={{
              position: 'absolute', bottom: 8, left: 8,
              backgroundColor: item.platform === '당근마켓' ? 'rgba(249,115,22,0.9)' : 'rgba(239,68,68,0.9)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {item.platform}
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

        {/* ✅ 제품명: 진한 색, 크고 굵게 */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#111827',   /* 가장 진한 gray-900 */
            lineHeight: 1.35,
            marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h3>

        {/* ✅ 하자 경고: 빨간색 강조 */}
        {hasDefect && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 8,
              padding: '4px 8px',
              marginBottom: 8,
            }}
          >
            <AlertTriangle style={{ width: 13, height: 13, color: '#dc2626', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {defectDetail}
            </span>
          </div>
        )}

        {/* 가격 영역 */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>

          {/* ✅ 판매가: 진한 검정 #111827 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>판매가</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              {salePrice.toLocaleString()}원
            </span>
          </div>

          {/* ✅ 적정가: 파란색 강조 박스 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: '6px 10px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>적정가</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>
                {marketPrice.toLocaleString()}원
              </span>
              {priceDiffPct !== 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: priceDiffPct > 0 ? '#16a34a' : '#dc2626'
                }}>
                  {priceDiffPct > 0 ? `+${priceDiffPct}%` : `${priceDiffPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
