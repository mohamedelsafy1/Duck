import React, { useState } from 'react';
import { ClientBrief, ContentIdea } from '../../types.ts';
import {
  Lightbulb,
  Plus,
  RefreshCw,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Compass,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

interface Stage2Props {
  brief: ClientBrief;
  approvedStrategy: string | null;
  ideas: ContentIdea[];
  selectedIdeaIds: string[];
  ideasApproved: boolean;
  onToggleIdea: (id: string) => void;
  onSelectAllIdeas: () => void;
  onDeselectAllIdeas: () => void;
  onGenerateIdeas: (count: number) => Promise<void>;
  onShowMoreIdeas: (count: number) => Promise<void>;
  onApproveSelectedIdeas: () => void;
  onBackToStrategy: () => void;
  isGenerating: boolean;
  isShowMoreLoading: boolean;
  errorMessage: string | null;
  selectedModelName?: string;
}

export const Stage2ContentIdeasView: React.FC<Stage2Props> = ({
  brief,
  approvedStrategy,
  ideas,
  selectedIdeaIds,
  ideasApproved,
  onToggleIdea,
  onSelectAllIdeas,
  onDeselectAllIdeas,
  onGenerateIdeas,
  onShowMoreIdeas,
  onApproveSelectedIdeas,
  onBackToStrategy,
  isGenerating,
  isShowMoreLoading,
  errorMessage,
  selectedModelName,
}) => {
  const [ideasCount, setIdeasCount] = useState<number>(10);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  // If Brand Strategy is NOT approved yet, this stage is strictly locked!
  if (!approvedStrategy) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
          <Lock size={26} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900">
            مرحلة "أفكار المحتوى" مغلقة حالياً
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
            وفق منهجية العمل التتابعية المعتمدة، يجب مراجعة واعتماد استراتيجية البراند في المرحلة الأولى ("مناسبة، نكمل") قبل فتح وتوليد أفكار المحتوى.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToStrategy}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
        >
          الانتقال إلى استراتيجية البراند للاعتماد ←
        </button>
      </div>
    );
  }

  // If ideas have not been generated yet
  if (ideas.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 text-center space-y-6 max-w-3xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
          <Lightbulb size={28} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-zinc-900">
            المرحلة الثانية: توليد أفكار المحتوى (Content Ideas)
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
            استناداً إلى استراتيجية البراند المعتمدة رسمياً، سيقوم المحرك الإبداعي بتوليد مجموعة من الأفكار التسويقية المبتكرة والمصممة خصيصاً لسوق وجمهور البراند.
          </p>
        </div>

        {/* Quantity selector */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-right max-w-md mx-auto space-y-2">
          <label className="block text-xs font-semibold text-zinc-800">
            حدد عدد الأفكار المطلوبة للتوليد الأولي:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setIdeasCount(num)}
                className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  ideasCount === num
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {num} أفكار
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400">
            (القيمة الافتراضية الموصى بها: 10 أفكار، ويمكنك دائماً طلب المزيد لاحقاً)
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-right max-w-md mx-auto">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={() => onGenerateIdeas(ideasCount)}
          disabled={isGenerating}
          className="px-8 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition shadow-md flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin text-zinc-300" />
              <span>جارٍ استخلاص وتوليد {ideasCount} فكرة إبداعية...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>توليد أفكار المحتوى التسويقية ({ideasCount} أفكار)</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const selectedCount = selectedIdeaIds.length;
  const isAllSelected = ideas.length > 0 && selectedCount === ideas.length;

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb size={20} className="text-zinc-800" />
              <h3 className="text-lg font-bold text-zinc-900">
                لوحة الأفكار التسويقية ({ideas.length} فكرة متوفرة)
              </h3>
              {selectedModelName && (
                <span className="text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 font-mono">
                  النموذج: {selectedModelName}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              حدد الأفكار التي ترغب في اعتمادها للتنفيذ. يمكنك طلب المزيد أو إعادة التوليد بأي وقت.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Show More Button */}
            <button
              type="button"
              onClick={() => onShowMoreIdeas(5)}
              disabled={isShowMoreLoading}
              className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="توليد أفكار إضافية دون مسح الأفكار الحالية واختياراتك"
            >
              {isShowMoreLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-zinc-300" />
                  <span>جارٍ جلب المزيد...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>أفكار إضافية — Show More (+5)</span>
                </>
              )}
            </button>

            {/* Regenerate All with confirmation */}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'هل أنت متأكد من إعادة توليد كل الأفكار؟ سيتم استبدال المجموعة الحالية بأفكار جديدة.'
                  )
                ) {
                  onGenerateIdeas(ideasCount);
                }
              }}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="إعادة التوليد بالكامل"
            >
              <RefreshCw size={13} />
              <span>إعادة توليد الكل</span>
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAllIdeas : onSelectAllIdeas}
              className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 font-medium cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-zinc-900" />
              ) : (
                <Square size={16} className="text-zinc-400" />
              )}
              <span>{isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد كل الأفكار'}</span>
            </button>

            <span className="text-zinc-300">•</span>

            <span className="font-semibold text-zinc-900">
              تم اختيار: <strong className="text-emerald-700">{selectedCount}</strong> من {ideas.length} فكرة
            </span>
          </div>

          {/* Approve Selected Ideas Button */}
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onApproveSelectedIdeas}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={15} />
              <span>اعتماد الأفكار المختارة ({selectedCount}) والمتابعة ←</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas.map((item, idx) => {
          const isSelected = selectedIdeaIds.includes(item.id);
          const isExpanded = expandedIdeaId === item.id;
          const displayNum = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={item.id}
              onClick={() => onToggleIdea(item.id)}
              className={`p-5 rounded-2xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-zinc-900 bg-white ring-2 ring-zinc-900 shadow-sm'
                  : 'border-zinc-200 bg-[#FCFCFB] hover:border-zinc-300 hover:bg-white'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-200/80 text-zinc-700'
                      }`}
                    >
                      {displayNum}
                    </span>

                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm leading-snug">
                        {item.title}
                      </h4>
                      {item.contentPillar && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                          {item.contentPillar}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-900 text-white'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>

                {/* Concept Description */}
                <p className="text-zinc-700 leading-relaxed text-xs">
                  {item.description}
                </p>

                {/* Highlight Boxes */}
                <div className="space-y-2 pt-1">
                  {item.suggestedHook && (
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-800">
                      <strong className="text-zinc-900 font-semibold block mb-0.5">
                        🎣 زاوية البداية (Suggested Hook):
                      </strong>
                      <span className="text-zinc-700 italic leading-relaxed">
                        "{item.suggestedHook}"
                      </span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="space-y-2 pt-1 border-t border-zinc-100">
                      {item.audienceInsight && (
                        <div className="p-2.5 bg-purple-50/50 border border-purple-200/60 rounded-xl text-[11px] text-purple-950">
                          <strong className="block mb-0.5">
                            💡 بصيرة الجمهور (Audience Insight):
                          </strong>
                          {item.audienceInsight}
                        </div>
                      )}
                      {item.strategicPurpose && (
                        <div className="p-2.5 bg-blue-50/50 border border-blue-200/60 rounded-xl text-[11px] text-blue-950">
                          <strong className="block mb-0.5">
                            🎯 الهدف الاستراتيجي (Strategic Purpose):
                          </strong>
                          {item.strategicPurpose}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom toggle details */}
              <div
                className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedIdeaId(isExpanded ? null : item.id);
                }}
              >
                <span className="hover:text-zinc-700 flex items-center gap-1 cursor-pointer">
                  {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل والبصيرة'}
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>

                <span className={isSelected ? 'text-emerald-700 font-bold' : 'text-zinc-400'}>
                  {isSelected ? 'تم الاختيار ✓' : 'انقر للتحديد'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Bar if ideas selected */}
      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-20 bg-white border border-zinc-200 p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-zinc-900">
              تم تحديد {selectedCount} فكرة تسويقية
            </span>
            <span className="text-zinc-500 mr-2">
              (ستنتقل إلى مرحلة تحديد القوالب التنفيذية: كاروسيل، بوست، سكريبت)
            </span>
          </div>

          <button
            type="button"
            onClick={onApproveSelectedIdeas}
            className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={15} />
            <span>اعتماد الاختيارات والمتابعة لتحديد القوالب ←</span>
          </button>
        </div>
      )}
    </div>
  );
};
