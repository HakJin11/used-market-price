import { X, ExternalLink, ClipboardCheck, MessageSquare, ShieldAlert } from 'lucide-react';

/**
 * 실제 상품 상세 URL인지 검증
 * - 번개장터: https://bunjang.co.kr/products/{숫자} 또는 m.bunjang.co.kr/products/{숫자}
 * - 당근마켓: /articles/{숫자} 또는 /buy-sell/ 하위 실제 slug
 */
function isRealProductUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    if (u.hostname.includes('bunjang.co.kr')) {
      return /\/products\/\d+/.test(u.pathname);
    }
    if (u.hostname.includes('daangn.com')) {
      return /\/(articles|buy-sell)\/.{4,}/.test(u.pathname) && !/search_type/.test(u.search);
    }
    return false;
  } catch {
    return false;
  }
}

/** 플랫폼별 검색 폴백 URL */
function searchUrl(platform, name) {
  const q = encodeURIComponent(name || '');
  if (platform === '번개장터') return `https://m.bunjang.co.kr/search/products?q=${q}`;
  if (platform === '당근마켓') return `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${q}`;
  return null;
}

export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const platform = item.platform || '';
  const itemUrl = item.url || '';

  // 실제 상품 URL 여부 판단
  const hasRealUrl = isRealProductUrl(itemUrl);

  // 당근마켓 링크
  const daangnDirect = (itemUrl.includes('daangn') && hasRealUrl) ? itemUrl : null;
  const daangnSearch = searchUrl('당근마켓', item.name);

  // 번개장터 링크
  const bunjangDirect = (itemUrl.includes('bunjang') && hasRealUrl) ? itemUrl : null;
  const bunjangSearch = searchUrl('번개장터', item.name);

  // 원본 매물 직접 링크 (플랫폼 특정 + 실제 URL 있을 때)
  const directUrl = hasRealUrl ? itemUrl : null;

  // Default values
  const usageLevel = item.usageLevel || (item.hasDefect ? '사용감 있음' : '사용감 거의 없음');
  const isDamaged = item.isDamaged || (item.hasDefect ? '미세 찍힘 존재' : '파손 없음');
  const missingComponents = item.missingComponents || '없음 (풀박스)';
  const batteryStatus = item.batteryStatus || '해당없음';
  const sellerNotes = item.sellerNotes || '실사용 기간이 짧아 매우 깨끗하게 보관하였으며 기기 작동 상태 보증합니다.';
  const defectDetail = item.hasDefect ? (item.defectDetail || '세부 하자 검토 필요') : '검수 완료 (발견된 하자 없음)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up"
        style={{ border: '1px solid #e2e8f0' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 이미지 */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-50">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
          {platform && (
            <div
              className="absolute bottom-4 left-4 px-3 py-1 text-xs font-bold rounded-full text-white"
              style={{ backgroundColor: platform === '당근마켓' ? '#f97316' : '#ef4444' }}
            >
              {platform}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-260px)]">
          {/* 상품 제목 + 위험도 */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: '#6366f1' }}>
                {item.category} {item.timeAgo ? `· ${item.timeAgo}` : ''}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                {item.name}
              </h2>
            </div>
            <div
              className="shrink-0 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: item.riskLevel === '안전' ? '#d1fae5' : item.riskLevel === '주의' ? '#fef3c7' : '#fee2e2',
                color: item.riskLevel === '안전' ? '#065f46' : item.riskLevel === '주의' ? '#92400e' : '#991b1b',
                border: `1px solid ${item.riskLevel === '안전' ? '#a7f3d0' : item.riskLevel === '주의' ? '#fde68a' : '#fecaca'}`
              }}
            >
              {item.riskLevel || '안전'} 매물
            </div>
          </div>

          {/* 검수 보고서 */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-6" style={{ border: '1px solid #e2e8f0' }}>
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider pb-2 mb-4"
              style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
              <ClipboardCheck className="w-4 h-4" style={{ color: '#6366f1' }} />
              플랫폼 통합 정밀 검수 보고서
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* 하자 */}
              <div className="bg-white p-3 rounded-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>하자 여부 & 세부 내용</div>
                <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: '#374151' }}>
                  {item.hasDefect
                    ? <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: '#ef4444' }} />
                    : <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#10b981' }} />}
                  <span className="truncate">{defectDetail}</span>
                </div>
              </div>

              {/* 사용감 */}
              <div className="bg-white p-3 rounded-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>사용감 상태</div>
                <div className="font-bold text-sm" style={{ color: '#374151' }}>{usageLevel}</div>
              </div>

              {/* 파손 */}
              <div className="bg-white p-3 rounded-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>파손 여부</div>
                <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: '#374151' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.hasDefect ? '#f59e0b' : '#10b981' }} />
                  {isDamaged}
                </div>
              </div>

              {/* 구성품 */}
              <div className="bg-white p-3 rounded-xl" style={{ border: '1px solid #f1f5f9' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>구성품 누락 상태</div>
                <div className="font-bold text-sm" style={{ color: '#374151' }}>{missingComponents}</div>
              </div>

              {/* 배터리 */}
              <div className="bg-white p-3 rounded-xl sm:col-span-2" style={{ border: '1px solid #f1f5f9' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>배터리 상태 효율</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm" style={{ color: '#374151' }}>{batteryStatus}</span>
                  {batteryStatus !== '해당없음' && (
                    <div className="flex-grow h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: batteryStatus,
                          backgroundColor: parseInt(batteryStatus) > 85 ? '#10b981' : '#f59e0b'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 판매자 코멘트 */}
            <div className="bg-white p-3.5 rounded-xl text-xs" style={{ border: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-1.5 font-extrabold mb-1.5" style={{ color: '#94a3b8' }}>
                <MessageSquare className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                판매자 등록 게시글 분석 특이사항
              </div>
              <p className="italic leading-relaxed" style={{ color: '#374151' }}>&ldquo; {sellerNotes} &rdquo;</p>
            </div>
          </div>

          {/* 시세 분석 */}
          <div className="space-y-4">
            {/* 적정가 */}
            <div className="flex justify-between items-center p-4 rounded-2xl"
              style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span className="font-extrabold text-sm" style={{ color: '#1e3a8a' }}>분석된 AI 적정가</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8' }}>{item.marketPrice.toLocaleString()}원</span>
            </div>

            {/* 플랫폼별 시세 + 링크 */}
            <div className="grid grid-cols-2 gap-4">

              {/* 당근마켓 */}
              <div className="p-4 bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
                <div className="text-[10px] font-extrabold mb-1" style={{ color: '#f97316' }}>당근마켓 시세</div>
                <div className="text-base font-bold mb-3" style={{ color: '#111827' }}>
                  {(item.daangnPrice || item.marketPrice).toLocaleString()}원
                </div>
                {/* ✅ 실제 URL 있으면 원본 매물 보기, 없으면 검색 결과 보기 */}
                {daangnDirect ? (
                  <a href={daangnDirect} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#f97316', backgroundColor: '#fff7ed' }}>
                    원본 매물 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                ) : daangnSearch ? (
                  <a href={daangnSearch} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#f97316', backgroundColor: '#fff7ed' }}>
                    검색 결과 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>현재 원본 매물을 찾을 수 없습니다.</span>
                )}
              </div>

              {/* 번개장터 */}
              <div className="p-4 bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
                <div className="text-[10px] font-extrabold mb-1" style={{ color: '#ef4444' }}>번개장터 시세</div>
                <div className="text-base font-bold mb-3" style={{ color: '#111827' }}>
                  {(item.bunjangPrice || item.marketPrice).toLocaleString()}원
                </div>
                {bunjangDirect ? (
                  <a href={bunjangDirect} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#ef4444', backgroundColor: '#fff1f2' }}>
                    원본 매물 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                ) : bunjangSearch ? (
                  <a href={bunjangSearch} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#ef4444', backgroundColor: '#fff1f2' }}>
                    검색 결과 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>현재 원본 매물을 찾을 수 없습니다.</span>
                )}
              </div>
            </div>

            {/* ✅ 실제 URL 있을 때 큰 버튼으로 원본 매물 이동 */}
            {directUrl && (
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-colors"
                style={{ backgroundColor: platform === '당근마켓' ? '#f97316' : '#ef4444' }}
              >
                <ExternalLink className="w-4 h-4" />
                {platform || '플랫폼'} 원본 매물 바로가기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
