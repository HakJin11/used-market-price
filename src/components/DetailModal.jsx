import { X, ExternalLink, ShieldAlert, ClipboardCheck, MessageSquare, ExternalLinkIcon } from 'lucide-react';

// ─── 실제 상품 페이지 URL 판별 ───────────────────────────────────────────────
function isDirect(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname.includes('bunjang.co.kr'))
      return /\/products\/\d+/.test(pathname);
    if (hostname.includes('daangn.com') || hostname.includes('karrot'))
      return /\/articles\/\d+/.test(pathname);
    return false;
  } catch { return false; }
}

// ─── 검색 폴백 URL ───────────────────────────────────────────────────────────
function fallback(platform, kw) {
  const q = encodeURIComponent((kw || '').trim());
  if (!q) return null;
  return platform === '번개장터'
    ? `https://m.bunjang.co.kr/search/products?q=${q}`
    : `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${q}`;
}

// ─── 각 플랫폼별 최종 링크 계산 ──────────────────────────────────────────────
function getLinks(item) {
  const kw = item.keyword || item.name || '';

  // 번개장터: bunjangUrl > url(bunjang) > 폴백
  let bUrl  = null, bDirect = false;
  if (isDirect(item.bunjangUrl) && item.bunjangUrl.includes('bunjang')) {
    bUrl = item.bunjangUrl; bDirect = true;
  } else if (isDirect(item.url) && item.url.includes('bunjang')) {
    bUrl = item.url; bDirect = true;
  } else {
    bUrl = fallback('번개장터', kw); bDirect = false;
  }

  // 당근마켓: daangnUrl > url(daangn) > 폴백
  let dUrl = null, dDirect = false;
  if (isDirect(item.daangnUrl) && (item.daangnUrl.includes('daangn') || item.daangnUrl.includes('karrot'))) {
    dUrl = item.daangnUrl; dDirect = true;
  } else if (isDirect(item.url) && (item.url.includes('daangn') || item.url.includes('karrot'))) {
    dUrl = item.url; dDirect = true;
  } else {
    dUrl = fallback('당근마켓', kw); dDirect = false;
  }

  // CTA: 자기 플랫폼 링크
  const platform = item.platform || '번개장터';
  const ctaUrl    = platform === '당근마켓' ? dUrl : bUrl;
  const ctaDirect = platform === '당근마켓' ? dDirect : bDirect;

  return { bUrl, bDirect, dUrl, dDirect, ctaUrl, ctaDirect };
}

// ─── 링크 버튼 ───────────────────────────────────────────────────────────────
function LinkBtn({ url, isDirect: direct, label, color, bg, border }) {
  if (!url) {
    return <span style={{ fontSize: 11, color: '#94a3b8' }}>링크 없음</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 800,
        color, backgroundColor: bg,
        padding: '5px 11px', borderRadius: 8,
        border: `1.5px solid ${border}`,
        textDecoration: 'none', transition: 'opacity .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {label || (direct ? '원본 매물 보기 →' : '검색 결과 보기 →')}
      <ExternalLink style={{ width: 11, height: 11, flexShrink: 0 }} />
    </a>
  );
}

// ─── 모달 ────────────────────────────────────────────────────────────────────
export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const links    = getLinks(item);
  const platform = item.platform || '번개장터';

  const usageLevel  = item.usageLevel  || (item.hasDefect ? '사용감 있음' : '사용감 거의 없음');
  const isDamaged   = item.isDamaged   || (item.hasDefect ? '미세 흠집 존재' : '파손 없음');
  const components  = item.missingComponents || '없음 (풀박스)';
  const battery     = item.batteryStatus     || '해당없음';
  const notes       = item.sellerNotes       ||
    '판매자 페이지에서 상세 정보를 확인하세요.';
  const defect = item.hasDefect
    ? (item.defectDetail || '세부 하자 확인 필요')
    : '검수 완료 (하자 없음)';

  const RC = {
    '안전': { bg:'#dcfce7', color:'#14532d', border:'#86efac' },
    '주의': { bg:'#fef3c7', color:'#78350f', border:'#fde68a' },
    '위험': { bg:'#fee2e2', color:'#7f1d1d', border:'#fca5a5' },
  };
  const rc = RC[item.riskLevel] || RC['안전'];

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        backgroundColor:'rgba(15,23,42,.52)',
        backdropFilter:'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:'white', width:'100%', maxWidth:680,
          borderRadius:'28px 28px 0 0',
          overflow:'hidden',
          boxShadow:'0 -8px 40px rgba(0,0,0,.18)',
          maxHeight:'96vh',
          display:'flex', flexDirection:'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 이미지 헤더 */}
        <div style={{ position:'relative', height:220, background:'#f1f5f9', flexShrink:0 }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onError={e => {
              e.target.src =
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <button
            onClick={onClose}
            style={{
              position:'absolute', top:12, right:12,
              background:'white', border:'1.5px solid #e2e8f0',
              borderRadius:'50%', width:38, height:38,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.12)',
            }}
          >
            <X style={{ width:17, height:17, color:'#374151' }} />
          </button>
          {platform && (
            <div style={{
              position:'absolute', bottom:12, left:14,
              backgroundColor: platform==='당근마켓' ? '#ea580c' : '#dc2626',
              color:'white', padding:'4px 12px',
              borderRadius:20, fontSize:12, fontWeight:800,
              boxShadow:'0 2px 6px rgba(0,0,0,.2)',
            }}>
              {platform}
            </div>
          )}
        </div>

        {/* 스크롤 본문 */}
        <div style={{ overflowY:'auto', flex:1, padding:'22px 20px 32px' }}>

          {/* 상품명 + 위험도 */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:18 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
                {item.category || ''}
                {item.timeAgo ? ` · ${item.timeAgo}` : ''}
              </div>
              <h2 style={{ fontSize:20, fontWeight:900, color:'#0f172a', lineHeight:1.3, margin:0, wordBreak:'keep-all' }}>
                {item.name}
              </h2>
            </div>
            <div style={{
              flexShrink:0, padding:'4px 11px', borderRadius:20,
              fontSize:12, fontWeight:800,
              backgroundColor:rc.bg, color:rc.color,
              border:`1.5px solid ${rc.border}`,
            }}>
              {item.riskLevel || '안전'} 매물
            </div>
          </div>

          {/* 검수 보고서 */}
          <div style={{
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:18, padding:'16px 16px 14px', marginBottom:18,
          }}>
            <h3 style={{
              display:'flex', alignItems:'center', gap:6, margin:'0 0 14px',
              fontSize:10, fontWeight:800, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'.07em',
              paddingBottom:10, borderBottom:'1px solid #e2e8f0',
            }}>
              <ClipboardCheck style={{ width:14, height:14, color:'#6366f1' }} />
              통합 검수 보고서
            </h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              {[
                { label:'하자 여부', node:(
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    {item.hasDefect
                      ? <ShieldAlert style={{ width:13, height:13, color:'#dc2626', flexShrink:0 }} />
                      : <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#16a34a', display:'inline-block' }} />}
                    <span style={{ fontSize:12, fontWeight:800, color:'#1e293b' }}>{defect}</span>
                  </div>
                )},
                { label:'사용감', node: <span style={{ fontSize:12, fontWeight:800, color:'#1e293b' }}>{usageLevel}</span> },
                { label:'파손', node:(
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:item.hasDefect ? '#ea580c' : '#16a34a', display:'inline-block' }} />
                    <span style={{ fontSize:12, fontWeight:800, color:'#1e293b' }}>{isDamaged}</span>
                  </div>
                )},
                { label:'구성품', node: <span style={{ fontSize:12, fontWeight:800, color:'#1e293b' }}>{components}</span> },
              ].map(({ label, node }, i) => (
                <div key={i} style={{ background:'white', padding:'10px 12px', borderRadius:10, border:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:4 }}>{label}</div>
                  {node}
                </div>
              ))}
            </div>

            {/* 배터리 */}
            <div style={{ background:'white', padding:'10px 12px', borderRadius:10, border:'1px solid #f1f5f9', marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:4 }}>배터리 상태</div>
              <span style={{ fontSize:12, fontWeight:800, color:'#1e293b' }}>{battery}</span>
            </div>

            {/* 판매자 정보 */}
            <div style={{ background:'white', padding:'10px 12px', borderRadius:10, border:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, color:'#94a3b8', marginBottom:4 }}>
                <MessageSquare style={{ width:12, height:12, color:'#6366f1' }} />
                판매자 정보
              </div>
              <p style={{ fontSize:12, color:'#374151', lineHeight:1.65, margin:0, fontStyle:'italic' }}>
                &ldquo; {notes} &rdquo;
              </p>
            </div>
          </div>

          {/* ════ 가격 + 링크 섹션 ════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* AI 적정가 */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'#eff6ff', border:'1.5px solid #93c5fd',
              borderRadius:16, padding:'14px 18px',
            }}>
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'#1d4ed8', marginBottom:2, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  AI 분석 적정가
                </div>
                <div style={{ fontSize:11, color:'#3b82f6', fontWeight:500 }}>실거래 데이터 기반</div>
              </div>
              <span style={{ fontSize:26, fontWeight:900, color:'#1d4ed8', letterSpacing:'-.02em' }}>
                {(item.marketPrice || 0).toLocaleString()}원
              </span>
            </div>

            {/* 플랫폼 카드 2열 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

              {/* 🥕 당근마켓 */}
              <div style={{ background:'white', padding:14, borderRadius:16, border:'1.5px solid #fed7aa' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#ea580c', marginBottom:4 }}>🥕 당근마켓</div>
                <div style={{ fontSize:19, fontWeight:900, color:'#111827', marginBottom:10, letterSpacing:'-.01em' }}>
                  {(item.daangnPrice || item.marketPrice || 0).toLocaleString()}원
                </div>
                <LinkBtn
                  url={links.dUrl}
                  isDirect={links.dDirect}
                  color="#ea580c" bg="#fff7ed" border="#fed7aa"
                />
              </div>

              {/* ⚡ 번개장터 */}
              <div style={{ background:'white', padding:14, borderRadius:16, border:'1.5px solid #fca5a5' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#dc2626', marginBottom:4 }}>⚡ 번개장터</div>
                <div style={{ fontSize:19, fontWeight:900, color:'#111827', marginBottom:10, letterSpacing:'-.01em' }}>
                  {(item.bunjangPrice || item.marketPrice || 0).toLocaleString()}원
                </div>
                <LinkBtn
                  url={links.bUrl}
                  isDirect={links.bDirect}
                  color="#dc2626" bg="#fff1f2" border="#fca5a5"
                />
              </div>
            </div>

            {/* ✅ 큰 CTA 버튼 — 항상 표시 (직접/검색 폴백 무관) */}
            {links.ctaUrl && (
              <a
                href={links.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:15, borderRadius:16,
                  background: platform==='당근마켓' ? '#ea580c' : '#dc2626',
                  color:'white', fontWeight:900, fontSize:14,
                  textDecoration:'none',
                  boxShadow: platform==='당근마켓'
                    ? '0 4px 14px rgba(234,88,12,.4)'
                    : '0 4px 14px rgba(220,38,38,.4)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <ExternalLink style={{ width:17, height:17 }} />
                {links.ctaDirect
                  ? `${platform} 원본 매물 바로가기`
                  : `${platform} 검색 결과 보기`}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
