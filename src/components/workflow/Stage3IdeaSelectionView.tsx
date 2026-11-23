import React from 'react';
import { ContentIdea } from '../../types.ts';
import {
  CheckSquare,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Layers,
} from 'lucide-react';

interface Stage3Props {
  ideas: ContentIdea[];
  selectedIdeaIds: string[];
  ideasApproved: boolean;
  onToggleIdea: (id: string) => void;
  onConfirmIdeaSelection: () => void;
  onBackToIdeas: () => void;
  onProceedToFormats: () => void;
}

export const Stage3IdeaSelectionView: React.FC<Stage3Props> = ({
  ideas,
  selectedIdeaIds,
  ideasApproved,
  onToggleIdea,
  onConfirmIdeaSelection,
  onBackToIdeas,
  onProceedToFormats,
}) => {
  const selectedIdeas = ideas.filter((item) => selectedIdeaIds.includes(item.id));
  const unselectedIdeas = ideas.filter((item) => !selectedIdeaIds.includes(item.id));

  if (selectedIdeas.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
          <CheckSquare size={26} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">لم يتم اختيار أي أفكار حتى الآن</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          يرجى العودة إلى مرحلة "توليد أفكار المحتوى" وتحديد فكرة واحدة على الأقل للاعتماد والتنفيذ.
        </p>
        <button
          type="button"
          onClick={onBackToIdeas}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
        >
          العودة لاختيار الأفكار ←
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-zinc-800" />
            <h3 className="text-lg font-bold text-zinc-900">
              المرحلة 3: مراجعة واعتماد الأفكار المختارة (Idea Selection)
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            راجع قائمة الأفكار التي قررت اعتمادها للمشروع. بعد تأكيد الاعتماد، ستنتقل لتحديد قوالب التنفيذ (كاروسيل، بوست، سكريبت).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToIdeas}
            className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            ← تعديل الاختيارات
          </button>

          <button
            type="button"
            onClick={onConfirmIdeaSelection}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={16} />
            <span>اعتماد هذه الأفكار ({selectedIdeas.length}) رسمياً</span>
          </button>
        </div>
      </div>

      {/* Selected Ideas List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-zinc-800 flex items-center justify-between px-1">
          <span>الأفكار المعتمدة للمشروع ({selectedIdeas.length}):</span>
          <span className="text-zinc-500 font-normal">
            يمكنك استبعاد أي فكرة بالنقر على زر الحذف
          </span>
        </div>

        <div className="space-y-3">
          {selectedIdeas.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-zinc-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-8 h-8 rounded-xl bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-zinc-900 text-sm">{item.title}</h4>
                    {item.contentPillar && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                        {item.contentPillar}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{item.description}</p>
                  {item.suggestedHook && (
                    <div className="text-[11px] text-zinc-500 italic">
                      الخطاف: "{item.suggestedHook}"
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleIdea(item.id)}
                className="text-zinc-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition cursor-pointer self-end md:self-center"
                title="استبعاد هذه الفكرة"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Unselected Ideas quick restore */}
      {unselectedIdeas.length > 0 && (
        <div className="pt-4 border-t border-zinc-200 space-y-3">
          <div className="text-xs font-bold text-zinc-600 px-1">
            أفكار أخرى متاحة في المجموعة ({unselectedIdeas.length}):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unselectedIdeas.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-zinc-50/70 border border-zinc-200 rounded-xl flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-medium text-zinc-800 truncate">{item.title}</span>
                <button
                  type="button"
                  onClick={() => onToggleIdea(item.id)}
                  className="px-2.5 py-1 text-[11px] bg-white border border-zinc-200 hover:border-zinc-900 text-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={12} />
                  <span>إضافة للاعتماد</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Confirmation Bar */}
      <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-zinc-600">
          هل تأكدت من اختياراتك؟ سيتم ترحيل هذه الأفكار ({selectedIdeas.length}) إلى مرحلة تحديد القوالب التنفيذية.
        </div>

        <button
          type="button"
          onClick={onConfirmIdeaSelection}
          className="px-7 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <CheckCircle2 size={16} />
          <span>اعتماد الأفكار المختارة والمتابعة ←</span>
        </button>
      </div>
    </div>
  );
};
