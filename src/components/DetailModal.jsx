import { X, ExternalLink, AlertCircle, FileText, ClipboardCheck, MessageSquare, ShieldAlert } from 'lucide-react';

export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  const bunjangUrl = `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(item.name)}`;
  const daangnUrl = `https://www.daangn.com/kr/search/${encodeURIComponent(item.name)}`;

  // Default values fallback for registered/new items
  const usageLevel = item.usageLevel || (item.hasDefect ? '사용감 있음' : '사용감 거의 없음');
  const isDamaged = item.isDamaged || (item.hasDefect ? '미세 찍힘 존재' : '파손 없음');
  const missingComponents = item.missingComponents || '없음 (풀박스)';
  const batteryStatus = item.batteryStatus || '해당없음';
  const sellerNotes = item.sellerNotes || '실사용 기간이 짧아 매우 깨끗하게 보관하였으며 기기 작동 상태 보증합니다.';
  const defectDetail = item.hasDefect ? (item.defectDetail || '세부 하자 검토 필요') : '검수 완료 (발견된 하자 없음)';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-xl animate-slide-up border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Hero Image */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-50 border-b border-slate-100">
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-full shadow-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-250px)]">
          {/* Header section */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <div className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider mb-1">
                ID: {item.id} &bull; {item.category}
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug">
                {item.name}
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
              item.riskLevel === '안전' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              item.riskLevel === '주의' ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {item.riskLevel} 매물
            </div>
          </div>

          {/* 1. 중고 거래 정밀 분석 보고서 (Advanced Inspection Report) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6">
            <h3 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5 uppercase mb-4 border-b border-slate-200/60 pb-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-500" />
              플랫폼 통합 정밀 검수 보고서 (Inspection Report)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 mb-1">하자 여부 & 세부 내용</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  {item.hasDefect ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  )}
                  <span className="truncate">{defectDetail}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 mb-1">사용감 상태</span>
                <span className="font-bold text-slate-700">{usageLevel}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 mb-1">파손 여부</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${item.hasDefect ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                  <span>{isDamaged}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 mb-1">구성품 누락 상태</span>
                <span className="font-bold text-slate-700">{missingComponents}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col justify-between sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-400 mb-1">배터리 상태 효율</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">{batteryStatus}</span>
                  {batteryStatus !== '해당없음' && (
                    <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${parseInt(batteryStatus) > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: batteryStatus }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller comments (특이사항) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-400 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                판매자 등록 게시글 분석 특이사항
              </div>
              <p className="italic leading-relaxed text-slate-700">&ldquo; {sellerNotes} &rdquo;</p>
            </div>
          </div>

          {/* 2. 시세 분석 결과 카드 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <span className="font-extrabold text-indigo-900 text-sm">분석된 AI 적정가</span>
              <span className="text-xl font-black text-indigo-600">{item.marketPrice.toLocaleString()}원</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200">
                <div className="text-[10px] font-extrabold text-orange-600 mb-1">당근마켓 시세</div>
                <div className="text-base font-bold text-slate-800 mb-2">{(item.daangnPrice || item.marketPrice).toLocaleString()}원</div>
                <a 
                  href={daangnUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/50 px-2 py-1 rounded-lg transition-colors"
                >
                  매물 확인 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="p-4 bg-white rounded-2xl border border-slate-200">
                <div className="text-[10px] font-extrabold text-rose-500 mb-1">번개장터 시세</div>
                <div className="text-base font-bold text-slate-800 mb-2">{(item.bunjangPrice || item.marketPrice).toLocaleString()}원</div>
                <a 
                  href={bunjangUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100/50 px-2 py-1 rounded-lg transition-colors"
                >
                  매물 확인 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
