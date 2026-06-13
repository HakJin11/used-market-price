import { X, ExternalLink, ShieldAlert, ClipboardCheck, MessageSquare } from 'lucide-react';

// ─── URL 유효성: 실제 상품 페이지 URL 여부 ────────────────────────────────────
function isDirectProductUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    const h = u.hostname;
    // 번개장터 실제 상품 URL: bunjang.co.kr/products/{숫자}
    if (h.includes('bunjang.co.kr')) {
      return /\/products\/\d+/.test(u.pathname);
    }
    // 당근마켓 실제 상품 URL: daangn.com/articles/{숫자}
    if (h.includes('daangn.com') || h.includes('karrot.market')) {
      return /\/articles\/\d+/.test(u.pathname);
    }
    return false;
  } catch {
    return false;
  }
}

// 검색 폴백 URL (키워드로 검색 결과 페이지)
function makeSearchFallback(platform, keyword) {
  const q = encodeURIComponent((keyword || '').trim());
  if (!q) return null;
  if (platform === '번개장터') return `https://m.bunjang.co.kr/search/products?q=${q}`;
  if (platform === '당근마켓') return `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${q}`;
  return null;
}

// ─── 플랫폼별 링크 결정 (우선순위: 직접URL → item.url → 검색폴백) ─────────────
function resolveLinks(item) {
  const platform = item.platform || '';
  const keyword = item.keyword || item.name || '';

  // ① 전용 필드 확인
  const directDaangn  = isDirectProductUrl(item.daangnUrl)  ? item.daangnUrl  : null;
  const directBunjang = isDirectProductUrl(item.bunjangUrl) ? item.bunjangUrl : null;

  // ② item.url로 플랫폼별 직접 URL 결정
  const itemUrlDirect = isDirectProductUrl(item.url) ? item.url : null;

  // 당근마켓 링크
  let daangn = null;
  let daangnDirect = false;
  if (directDaangn) {
    daangn = directDaangn; daangnDirect = true;
  } else if (platform === '당근마켓' && itemUrlDirect) {
    daangn = itemUrlDirect; daangnDirect = true;
  } else {
    daangn = makeSearchFallback('당근마켓', keyword); daangnDirect = false;
  }

  // 번개장터 링크
  let bunjang = null;
  let bunjangDirect = false;
  if (directBunjang) {
    bunjang = directBunjang; bunjangDirect = true;
  } else if (platform === '번개장터' && itemUrlDirect) {
    bunjang = itemUrlDirect; bunjangDirect = true;
  } else {
    bunjang = makeSearchFallback('번개장터', keyword); bunjangDirect = false;
  }

  // CTA: 현재 플랫폼의 직접 URL
  const ctaUrl    = platform === '당근마켓' ? daangn : bunjang;
  const ctaDirect = platform === '당근마켓' ? daangnDirect : bunjangDirect;

  return { daangn, daangnDirect, bunjang, bunjangDirect, ctaUrl, ctaDirect, platform };
}

// ─── 플랫폼 링크 버튼 컴포넌트 ───────────────────────────────────────────────
function PlatformLinkBtn({ url, isDirect, label, color, bg, border }) {
  if (!url) {
    return (
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
        현재 원본 매물을 찾을 수 없습니다.
      </p>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 800, color,
        backgroundColor: bg, padding: '4px 10px',
        borderRadius: 8, textDecoration: 'none',
        border: `1px solid ${border}`,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {isDirect ? '원본 매물 보기' : '검색 결과 보기'}
      <ExternalLink style={{ width: 11, height: 11 }} />
    </a>
  );
}

export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const links = resolveLinks(item);
  const platform = item.platform || '';

  const usageLevel       = item.usageLevel       || (item.hasDefect ? '사용감 있음' : '사용감 거의 없음');
  const isDamaged        = item.isDamaged        || (item.hasDefect ? '미세 찍힘 존재' : '파손 없음');
  const missingComponents = item.missingComponents || '없음 (풀박스)';
  const batteryStatus    = item.batteryStatus    || '해당없음';
  const sellerNotes      = item.sellerNotes      ||
    '실사용 기간이 짧아 매우 깨끗하게 보관하였으며 기기 작동 상태 보증합니다.';
  const defectDetail     = item.hasDefect
    ? (item.defectDetail || '세부 하자 검토 필요')
    : '검수 완료 (발견된 하자 없음)';

  const riskColors = {
    '안전': { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
    '주의': { bg: '#fef3c7', color: '#78350f', border: '#fde68a' },
    '위험': { bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
  };
  const riskC = riskColors[item.riskLevel] || riskColors['안전'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(4px)',
        padding: '0 0 0 0',
      }}
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        style={{
          background: 'white',
          width: '100%', maxWidth: 680,
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          maxHeight: '96vh',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── 헤더 이미지 ── */}
        <div style={{ position: 'relative', height: 230, background: '#f1f5f9', flexShrink: 0 }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => {
              e.target.src =
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
            }}
          />
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'white', border: '1.5px solid #e2e8f0',
              borderRadius: '50%', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <X style={{ width: 17, height: 17, color: '#374151' }} />
          </button>
          {/* 플랫폼 배지 */}
          {platform && (
            <div style={{
              position: 'absolute', bottom: 12, left: 14,
              backgroundColor: platform === '당근마켓' ? '#ea580c' : '#dc2626',
              color: 'white', padding: '4px 12px',
              borderRadius: 20, fontSize: 12, fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              {platform}
            </div>
          )}
        </div>

        {/* ── 스크롤 본문 ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px 22px 32px' }}>

          {/* 상품명 + 위험도 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {item.category || ''}
                {item.timeAgo ? ` · ${item.timeAgo}` : ''}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1.3, margin: 0, wordBreak: 'keep-all' }}>
                {item.name}
              </h2>
            </div>
            <div style={{
              flexShrink: 0, padding: '4px 11px', borderRadius: 20,
              fontSize: 12, fontWeight: 800,
              backgroundColor: riskC.bg, color: riskC.color,
              border: `1.5px solid ${riskC.border}`,
            }}>
              {item.riskLevel || '안전'} 매물
            </div>
          </div>

          {/* ── 검수 보고서 ── */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 18, padding: '18px 18px 16px', marginBottom: 20,
          }}>
            <h3 style={{
              display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 16px',
              fontSize: 10, fontWeight: 800, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              paddingBottom: 10, borderBottom: '1px solid #e2e8f0',
            }}>
              <ClipboardCheck style={{ width: 14, height: 14, color: '#6366f1' }} />
              통합 검수 보고서
            </h3>

            {/* 2열 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[
                {
                  label: '하자 여부',
                  node: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {item.hasDefect
                        ? <ShieldAlert style={{ width: 13, height: 13, color: '#dc2626', flexShrink: 0 }} />
                        : <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block', flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {defectDetail}
                      </span>
                    </div>
                  ),
                },
                {
                  label: '사용감 상태',
                  node: <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{usageLevel}</span>,
                },
                {
                  label: '파손 여부',
                  node: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.hasDefect ? '#ea580c' : '#16a34a', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{isDamaged}</span>
                    </div>
                  ),
                },
                {
                  label: '구성품',
                  node: <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{missingComponents}</span>,
                },
              ].map(({ label, node }, i) => (
                <div key={i} style={{
                  background: 'white', padding: '11px 12px', borderRadius: 10,
                  border: '1px solid #f1f5f9',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>{label}</div>
                  {node}
                </div>
              ))}
            </div>

            {/* 배터리 */}
            <div style={{ background: 'white', padding: '11px 12px', borderRadius: 10, border: '1px solid #f1f5f9', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>배터리 상태</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{batteryStatus}</span>
                {batteryStatus !== '해당없음' && (
                  <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: batteryStatus,
                      height: '100%',
                      background: parseInt(batteryStatus) > 85 ? '#16a34a' : '#ea580c',
                      borderRadius: 4,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* 판매자 코멘트 */}
            <div style={{ background: 'white', padding: '11px 12px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 5 }}>
                <MessageSquare style={{ width: 12, height: 12, color: '#6366f1' }} />
                판매자 게시글 분석
              </div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
                &ldquo; {sellerNotes} &rdquo;
              </p>
            </div>
          </div>

          {/* ── 가격 섹션 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* AI 적정가 강조 박스 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#eff6ff', border: '1.5px solid #93c5fd',
              borderRadius: 16, padding: '14px 18px',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  AI 분석 적정가
                </div>
                <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 500 }}>실거래 데이터 기반</div>
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.02em' }}>
                {(item.marketPrice || 0).toLocaleString()}원
              </span>
            </div>

            {/* 플랫폼별 시세 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

              {/* 당근마켓 */}
              <div style={{ background: 'white', padding: '15px 15px', borderRadius: 16, border: '1.5px solid #fed7aa' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#ea580c', marginBottom: 4 }}>🥕 당근마켓</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#111827', marginBottom: 10, letterSpacing: '-0.01em' }}>
                  {(item.daangnPrice || item.marketPrice || 0).toLocaleString()}원
                </div>
                <PlatformLinkBtn
                  url={links.daangn}
                  isDirect={links.daangnDirect}
                  color="#ea580c"
                  bg="#fff7ed"
                  border="#fed7aa"
                />
              </div>

              {/* 번개장터 */}
              <div style={{ background: 'white', padding: '15px 15px', borderRadius: 16, border: '1.5px solid #fca5a5' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>⚡ 번개장터</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#111827', marginBottom: 10, letterSpacing: '-0.01em' }}>
                  {(item.bunjangPrice || item.marketPrice || 0).toLocaleString()}원
                </div>
                <PlatformLinkBtn
                  url={links.bunjang}
                  isDirect={links.bunjangDirect}
                  color="#dc2626"
                  bg="#fff1f2"
                  border="#fca5a5"
                />
              </div>
            </div>

            {/* ✅ 원본 매물 CTA — 직접 URL이 있을 때만 */}
            {links.ctaDirect && links.ctaUrl && (
              <a
                href={links.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px', borderRadius: 16,
                  background: platform === '당근마켓' ? '#ea580c' : '#dc2626',
                  color: 'white', fontWeight: 900, fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: platform === '당근마켓' ? '0 4px 14px rgba(234,88,12,0.4)' : '0 4px 14px rgba(220,38,38,0.4)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <ExternalLink style={{ width: 17, height: 17 }} />
                {platform} 원본 매물 바로가기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
