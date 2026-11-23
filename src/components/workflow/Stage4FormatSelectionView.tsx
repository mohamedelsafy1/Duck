import React, { useState } from 'react';
import { ContentIdea, ContentFormatType } from '../../types.ts';
import {
  LayoutGrid,
  CheckCircle2,
  Check,
  AlertTriangle,
  Layers,
  Film,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface Stage4Props {
  selectedIdeas: ContentIdea[];
  ideaFormats: Record<string, ContentFormatType[]>;
  onToggleIdeaFormat: (ideaId: string, format: ContentFormatType) => void;
  onSetIdeaFormats: (ideaId: string, formats: ContentFormatType[]) => void;
  onApplyBulkFormats: (formats: ContentFormatType[]) => void;
  onConfirmFormatsAndStartProduction: () => void;
  onBackToSelection: () => void;
}

const AVAILABLE_FORMATS: {
  id: ContentFormatType;
  title: string;
  sub: string;
  desc: string;
  icon: any;
}[] = [
  {
    id: 'carousel',
    title: 'Carousel — كاروسيل',
    sub: 'شرائح متعددة تفاعلية',
    desc: 'شرائح متسلسلة (غلاف، محتوى تدريجي، دعوة للإجراء) مع توجيهات بصرية وكابشن.',
    icon: Layers,
  },
  {
    id: 'static_post',
    title: 'Static Post — بوست ثابت',
    sub: 'تصميم بصري واحد + كابشن',
    desc: 'نص بصري رئيسي (Hook)، كابشن تسويقي متكامل، ودعوة صريحة لاتخاذ إجراء.',
    icon: ImageIcon,
  },
  {
    id: 'video_script',
    title: 'Video Script — سكريبت فيديو',
    sub: 'ريلز / تيك توك / إعلان',
    desc: 'هوك أول 3 ثوانٍ، تفصيل المشاهد بالصوت وحركة الكاميرا والتكست على الشاشة.',
    icon: Film,
  },
];

export const Stage4FormatSelectionView: React.FC<Stage4Props> = ({
  selectedIdeas,
  ideaFormats,
  onToggleIdeaFormat,
  onSetIdeaFormats,
  onApplyBulkFormats,
  onConfirmFormatsAndStartProduction,
  onBackToSelection,
}) => {
  const [bulkFormats, setBulkFormats] = useState<ContentFormatType[]>(['carousel', 'static_post']);

  // Summary counts
  let totalCarousels = 0;
  let totalStaticPosts = 0;
  let totalVideoScripts = 0;

  selectedIdeas.forEach((idea) => {
    const formats = ideaFormats[idea.id] || [];
    if (formats.includes('carousel')) totalCarousels++;
    if (formats.includes('static_post')) totalStaticPosts++;
    if (formats.includes('video_script')) totalVideoScripts++;
  });

  const totalDeliverables = totalCarousels + totalStaticPosts + totalVideoScripts;
  const ideasWithoutFormats = selectedIdeas.filter(
    (idea) => !(ideaFormats[idea.id] && ideaFormats[idea.id].length > 0)
  );

  const toggleBulkFormat = (fmt: ContentFormatType) => {
    if (bulkFormats.includes(fmt)) {
      setBulkFormats(bulkFormats.filter((f) => f !== fmt));
    } else {
      setBulkFormats([...bulkFormats, fmt]);
    }
  };

  const handleApplyBulk = () => {
    if (bulkFormats.length === 0) {
      alert('يرجى اختيار قالب واحد على الأقل لتطبيقه على جميع الأفكار.');
      return;
    }
    onApplyBulkFormats(bulkFormats);
  };

  if (selectedIdeas.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
          <LayoutGrid size={26} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">لا توجد أفكار معتمدة حالياً</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          يرجى العودة إلى المراحل السابقة واختيار الأفكار التسويقية أولاً.
        </p>
        <button
          type="button"
          onClick={onBackToSelection}
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid size={20} className="text-zinc-800" />
              <h3 className="text-lg font-bold text-zinc-900">
                المرحلة 4: تحديد قوالب التنفيذ (Content Format Selection)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              عايز تنفذ كل فكرة في شكل إيه؟ حدد صيغ التنفيذ المطلوبة لكل فكرة بشكل مستقل تماماً.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToSelection}
            className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            ← تعديل قائمة الأفكار
          </button>
        </div>

        {/* Bulk Action Accordion / Bar */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-zinc-700" />
            <span className="font-bold text-zinc-800">تطبيق سريع على جميع الأفكار ({selectedIdeas.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {AVAILABLE_FORMATS.map((fmt) => {
              const isChecked = bulkFormats.includes(fmt.id);
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => toggleBulkFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {isChecked && <Check size={12} />}
                  <span>{fmt.title.split('—')[0].trim()}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleApplyBulk}
              className="px-4 py-1.5 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-900 transition cursor-pointer"
            >
              تطبيق على الكل
            </button>
          </div>
        </div>

        {/* Real-time Output Summary Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-zinc-500 font-medium">الأفكار المعتمدة</span>
            <div className="font-bold text-zinc-900 text-base">{selectedIdeas.length} أفكار</div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-zinc-500 font-medium">كاروسيل (Carousels)</span>
            <div className="font-bold text-zinc-900 text-base">{totalCarousels}</div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-zinc-500 font-medium">بوستات ثابتة (Static Posts)</span>
            <div className="font-bold text-zinc-900 text-base">{totalStaticPosts}</div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-zinc-500 font-medium">سكريبتات فيديو (Video Scripts)</span>
            <div className="font-bold text-zinc-900 text-base">{totalVideoScripts}</div>
          </div>
        </div>

        {/* Warning if any ideas have 0 formats selected */}
        {ideasWithoutFormats.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">تنبيه: توجد أفكار بدون قالب محدد!</strong>
              <span>
                هناك {ideasWithoutFormats.length} فكرة لم يتم تحديد أي قالب لها حتى الآن. يرجى اختيار قالب واحد على الأقل لكل فكرة ليتم توليدها في مرحلة الإنتاج.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ideas Format Selection Cards */}
      <div className="space-y-4">
        {selectedIdeas.map((idea, idx) => {
          const currentFormats = ideaFormats[idea.id] || [];
          const hasNone = currentFormats.length === 0;

          return (
            <div
              key={idea.id}
              className={`p-5 rounded-2xl border transition-all text-xs bg-white shadow-xs space-y-4 ${
                hasNone ? 'border-amber-300 ring-1 ring-amber-200' : 'border-zinc-200'
              }`}
            >
              {/* Idea Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{idea.title}</h4>
                    <p className="text-zinc-600 text-xs mt-0.5 max-w-2xl">{idea.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSetIdeaFormats(idea.id, ['carousel', 'static_post', 'video_script'])
                    }
                    className="text-[11px] text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetIdeaFormats(idea.id, [])}
                    className="text-[11px] text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                  >
                    مسح
                  </button>
                </div>
              </div>

              {/* Format Selectors for this Idea */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AVAILABLE_FORMATS.map((fmt) => {
                  const isSelected = currentFormats.includes(fmt.id);
                  const Icon = fmt.icon;

                  return (
                    <label
                      key={fmt.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={isSelected ? 'text-zinc-900' : 'text-zinc-400'} />
                            <span className="font-bold text-zinc-900 text-xs">{fmt.title}</span>
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleIdeaFormat(idea.id, fmt.id)}
                            className="accent-zinc-900 cursor-pointer"
                          />
                        </div>

                        <div className="text-[11px] text-zinc-500 font-medium">{fmt.sub}</div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{fmt.desc}</p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                        <span className={isSelected ? 'text-emerald-700 font-bold' : 'text-zinc-400'}>
                          {isSelected ? 'محدد للتنفيذ ✓' : 'غير محدد'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation & Launch Box */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-zinc-900">
              ملخص خطة الإنتاج والتنفيذ:
            </h4>
            <div className="text-xs text-zinc-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-900">{selectedIdeas.length} أفكار</span>
              <span>•</span>
              <span>{totalCarousels} كاروسيل</span>
              <span>•</span>
              <span>{totalStaticPosts} بوست ثابت</span>
              <span>•</span>
              <span>{totalVideoScripts} سكريبت فيديو</span>
              <span>=</span>
              <span className="font-bold text-emerald-800 text-sm">
                إجمالي {totalDeliverables} مخرج تسويقي
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onConfirmFormatsAndStartProduction}
            disabled={totalDeliverables === 0}
            className="px-8 py-3.5 bg-zinc-900 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>اعتماد الاختيارات وبدء التنفيذ ({totalDeliverables} مخرج) ←</span>
          </button>
        </div>

        {totalDeliverables === 0 && (
          <p className="text-xs text-rose-600 text-center">
            يرجى تحديد قالب واحد على الأقل لفكرة واحدة للمتابعة إلى مرحلة الإنتاج.
          </p>
        )}
      </div>
    </div>
  );
};
