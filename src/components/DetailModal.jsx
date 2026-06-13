import { X, ExternalLink, ClipboardCheck, MessageSquare, ShieldAlert } from 'lucide-react';

// ─── URL 유효성 검증 ─────────────────────────────────────────────────────────
// 번개장터: /products/{숫자}, 당근마켓: /articles/{숫자} 형태만 실제 상품 URL로 인정
function isRealProductUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    if (u.hostname.includes('bunjang.co.kr')) {
      return /\/products\/\d+/.test(u.pathname);
    }
    if (u.hostname.includes('daangn.com') || u.hostname.includes('karrot')) {
      // /articles/{id} 또는 /buy-sell/{slug}/{slug} 패턴
      return /\/articles\/\d+/.test(u.pathname) ||
        (/\/buy-sell\/.+\/.+/.test(u.pathname) && !u.search.includes('search_type'));
    }
    return false;
  } catch {
    return false;
  }
}

// 검색 폴백 URL
function makeSearchUrl(platform, name) {
  const q = encodeURIComponent(name || '');
  if (platform === '번개장터') return `https://m.bunjang.co.kr/search/products?q=${q}`;
  if (platform === '당근마켓') return `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${q}`;
  return null;
}

// ─── 플랫폼별 최종 링크 결정 ────────────────────────────────────────────────
// 우선순위: ① 플랫폼 전용 URL(daangnUrl/bunjangUrl) → ② item.url → ③ 검색 폴백
function resolveLinks(item) {
  const platform = item.platform || '';
  const itemUrl = item.url || '';
  const daangnUrl = item.daangnUrl || '';
  const bunjangUrl = item.bunjangUrl || '';

  // 당근마켓 링크
  let daangn = { url: null, isDirect: false };
  if (isRealProductUrl(daangnUrl)) {
    daangn = { url: daangnUrl, isDirect: true };
  } else if (platform === '당근마켓' && isRealProductUrl(itemUrl)) {
    daangn = { url: itemUrl, isDirect: true };
  } else {
    const fallback = makeSearchUrl('당근마켓', item.name);
    daangn = { url: fallback, isDirect: false };
  }

  // 번개장터 링크
  let bunjang = { url: null, isDirect: false };
  if (isRealProductUrl(bunjangUrl)) {
    bunjang = { url: bunjangUrl, isDirect: true };
  } else if (platform === '번개장터' && isRealProductUrl(itemUrl)) {
    bunjang = { url: itemUrl, isDirect: true };
  } else {
    const fallback = makeSearchUrl('번개장터', item.name);
    bunjang = { url: fallback, isDirect: false };
  }

  // 원본 매물 바로가기 CTA (플랫폼 특정 + 실제 URL 있을 때)
  const directCta = platform === '당근마켓' ? daangn : bunjang;

  return { daangn, bunjang, directCta };
}

export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const platform = item.platform || '';
  const links = resolveLinks(item);

  const usageLevel = item.usageLevel || (item.hasDefect ? '사용감 있음' : '사용감 거의 없음');
  const isDamaged = item.isDamaged || (item.hasDefect ? '미세 찍힘 존재' : '파손 없음');
  const missingComponents = item.missingComponents || '없음 (풀박스)';
  const batteryStatus = item.batteryStatus || '해당없음';
  const sellerNotes = item.sellerNotes || '실사용 기간이 짧아 매우 깨끗하게 보관하였으며 기기 작동 상태 보증합니다.';
  const defectDetail = item.hasDefect ? (item.defectDetail || '세부 하자 검토 필요') : '검수 완료 (발견된 하자 없음)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid #e2e8f0', maxHeight: '96vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 이미지 */}
        <div className="relative bg-slate-100" style={{ height: 240 }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
            }}
          >
            <X style={{ width: 16, height: 16, color: '#475569' }} />
          </button>
          {platform && (
            <div
              style={{
                position: 'absolute', bottom: 12, left: 12,
                backgroundColor: platform === '당근마켓' ? '#f97316' : '#ef4444',
                color: 'white', padding: '4px 10px',
                borderRadius: 20, fontSize: 11, fontWeight: 700,
              }}
            >
              {platform}
            </div>
          )}
        </div>

        {/* 본문 스크롤 영역 */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(96vh - 240px)', padding: '24px 24px 32px' }}>

          {/* 상품명 + 위험도 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {item.category || ''}{item.timeAgo ? ` · ${item.timeAgo}` : ''}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.3, margin: 0 }}>
                {item.name}
              </h2>
            </div>
            <div style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              backgroundColor: item.riskLevel === '안전' ? '#d1fae5' : item.riskLevel === '주의' ? '#fef3c7' : '#fee2e2',
              color: item.riskLevel === '안전' ? '#065f46' : item.riskLevel === '주의' ? '#92400e' : '#991b1b',
              border: `1px solid ${item.riskLevel === '안전' ? '#a7f3d0' : item.riskLevel === '주의' ? '#fde68a' : '#fecaca'}`
            }}>
              {item.riskLevel || '안전'} 매물
            </div>
          </div>

          {/* 검수 보고서 */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
            <h3 style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 800, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 16, margin: '0 0 16px'
            }}>
              <ClipboardCheck style={{ width: 14, height: 14, color: '#6366f1' }} />
              플랫폼 통합 정밀 검수 보고서
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                {
                  label: '하자 여부 & 세부 내용',
                  content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.hasDefect
                        ? <ShieldAlert style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
                        : <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0, display: 'inline-block' }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{defectDetail}</span>
                    </div>
                  )
                },
                { label: '사용감 상태', content: <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{usageLevel}</span> },
                {
                  label: '파손 여부',
                  content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.hasDefect ? '#f59e0b' : '#10b981', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{isDamaged}</span>
                    </div>
                  )
                },
                { label: '구성품 누락', content: <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{missingComponents}</span> },
              ].map(({ label, content }, i) => (
                <div key={i} style={{ backgroundColor: 'white', padding: '12px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
                  {content}
                </div>
              ))}
            </div>

            {/* 배터리 */}
            <div style={{ backgroundColor: 'white', padding: 12, borderRadius: 10, border: '1px solid #f1f5f9', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>배터리 상태 효율</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{batteryStatus}</span>
                {batteryStatus !== '해당없음' && (
                  <div style={{ flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: batteryStatus,
                      height: '100%',
                      backgroundColor: parseInt(batteryStatus) > 85 ? '#10b981' : '#f59e0b',
                      borderRadius: 3
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* 판매자 코멘트 */}
            <div style={{ backgroundColor: 'white', padding: 12, borderRadius: 10, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                <MessageSquare style={{ width: 12, height: 12, color: '#6366f1' }} />
                판매자 등록 게시글 분석 특이사항
              </div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>&ldquo; {sellerNotes} &rdquo;</p>
            </div>
          </div>

          {/* 시세 분석 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 적정가 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderRadius: 16,
              backgroundColor: '#eff6ff', border: '1px solid #bfdbfe'
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a' }}>분석된 AI 적정가</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8' }}>{item.marketPrice.toLocaleString()}원</span>
            </div>

            {/* 플랫폼별 시세 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* 당근마켓 */}
              <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#f97316', marginBottom: 4 }}>당근마켓 시세</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
                  {(item.daangnPrice || item.marketPrice).toLocaleString()}원
                </div>
                {links.daangn.url ? (
                  <a
                    href={links.daangn.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 800,
                      color: '#f97316', backgroundColor: '#fff7ed',
                      padding: '4px 10px', borderRadius: 8, textDecoration: 'none',
                      border: '1px solid #fed7aa'
                    }}
                  >
                    {links.daangn.isDirect ? '원본 매물 보기' : '검색 결과 보기'}
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>현재 원본 매물을 찾을 수 없습니다.</span>
                )}
              </div>

              {/* 번개장터 */}
              <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>번개장터 시세</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
                  {(item.bunjangPrice || item.marketPrice).toLocaleString()}원
                </div>
                {links.bunjang.url ? (
                  <a
                    href={links.bunjang.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 800,
                      color: '#ef4444', backgroundColor: '#fff1f2',
                      padding: '4px 10px', borderRadius: 8, textDecoration: 'none',
                      border: '1px solid #fecaca'
                    }}
                  >
                    {links.bunjang.isDirect ? '원본 매물 보기' : '검색 결과 보기'}
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>현재 원본 매물을 찾을 수 없습니다.</span>
                )}
              </div>
            </div>

            {/* ✅ 원본 매물 바로가기 CTA (직접 URL 있을 때만 표시) */}
            {links.directCta.isDirect && links.directCta.url && (
              <a
                href={links.directCta.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px', borderRadius: 16,
                  backgroundColor: platform === '당근마켓' ? '#f97316' : '#ef4444',
                  color: 'white', fontWeight: 800, fontSize: 14,
                  textDecoration: 'none', boxSizing: 'border-box',
                }}
              >
                <ExternalLink style={{ width: 16, height: 16 }} />
                {platform} 원본 매물 바로가기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
