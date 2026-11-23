import React, { useEffect, useState } from 'react';
import { ClientBrief, MarketingDatasetRecord } from '../../types.ts';
import {
  X,
  Database,
  BookmarkCheck,
  Layers,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface ReferencesInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: ClientBrief;
  lastReferencesUsed?: {
    count: number;
    sampleTitles: string[];
    usedAtStage?: string;
  };
  useHumanReferences: boolean;
  onToggleHumanReferences: (enabled: boolean) => void;
}

export const ReferencesInspectionModal: React.FC<ReferencesInspectionModalProps> = ({
  isOpen,
  onClose,
  brief,
  lastReferencesUsed,
  useHumanReferences,
  onToggleHumanReferences,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableData, setAvailableData] = useState<{
    total: number;
    contentExamples: MarketingDatasetRecord[];
    referenceCases: MarketingDatasetRecord[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/workflow/available-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      })
        .then((res) => res.json())
        .then((data) => {
          setAvailableData(data);
        })
        .catch((err) => {
          console.error('Failed to fetch available references:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, brief]);

  if (!isOpen) return null;

  const totalAvailable = availableData?.total || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center font-bold">
              <Database size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-zinc-900">
                المراجع البشرية المعتمدة (Approved Human References)
              </h3>
              <p className="text-[11px] text-zinc-500">
                معاينة وتحكم في نماذج المحتوى ودراسات الحالة المستقاة من قاعدة بياناتك لدعم الذكاء الاصطناعي.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Main Control Toggle Box */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 text-xs md:text-sm">
                  تفعيل الاستعانة بالمراجع البشرية أثناء التوليد
                </span>
                {useHumanReferences ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                    مفعّل (Active)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200 px-2 py-0.5 rounded-full">
                    معطل (Pure AI)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {useHumanReferences
                  ? 'يقوم النموذج بالاطلاع على نماذج المحتوى البشري المعتمدة ودراسات الحالة المتوافقة مع هذا البراند لاستلهام النبرة والخطافات دون أي نسخ حرفي.'
                  : 'يعتمد النموذج كلياً على معرفته العامة وموجز العميل المكتوب فقط، دون حقن أي نماذج من قاعدة البيانات.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleHumanReferences(!useHumanReferences)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                useHumanReferences
                  ? 'bg-purple-700 hover:bg-purple-800 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-900 text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>{useHumanReferences ? 'تعطيل الاستعانة' : 'تفعيل الاستعانة بالمراجع'}</span>
            </button>
          </div>

          {/* Last Generation Usage Transparency Badge */}
          {lastReferencesUsed && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                <ShieldCheck size={15} className="text-purple-700" />
                <span>تقرير شفافية آخر عملية توليد ({lastReferencesUsed.usedAtStage || 'سير العمل'})</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                تم بنجاح حقن <strong>{lastReferencesUsed.count} مراجع بشرية معتمدة</strong> كمعيار استرشادي للموديل:
              </p>
              {lastReferencesUsed.sampleTitles && lastReferencesUsed.sampleTitles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lastReferencesUsed.sampleTitles.map((title, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white text-purple-900 border border-purple-200 text-[10px] font-semibold"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Matching Available References for Current Brief */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900">
                <BookmarkCheck size={16} className="text-purple-700" />
                <span>
                  المراجع المعتمدة المطابقة لموجز {brief.brandName || 'البراند الحالي'} ({totalAvailable})
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                يتم الفرز التلقائي وفق ملاءمة الصناعة، الدولة، واللهجة
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                جارٍ البحث عن مراجع معتمدة مطابقة...
              </div>
            ) : totalAvailable === 0 ? (
              <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl text-center space-y-1 text-zinc-500">
                <Info size={20} className="mx-auto text-zinc-400" />
                <div className="font-bold text-zinc-700">لا توجد مراجع معتمدة مطابقة حالياً في قاعدة البيانات</div>
                <p className="text-[11px]">
                  يمكنك استيراد نماذج محتوى أو دراسات حالة جديدة عبر "مدير مجموعات البيانات" واعتمادها لتظهر هنا تلقائياً.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Marketing Content Examples */}
                {availableData?.contentExamples && availableData.contentExamples.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                      <Layers size={13} className="text-teal-700" />
                      <span>نماذج محتوى تسويقي أصلي معتمد ({availableData.contentExamples.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {availableData.contentExamples.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 space-y-1.5 transition"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">{item.brandName || 'نموذج محتوى'}</span>
                              <span className="text-[10px] text-zinc-400">•</span>
                              <span className="text-zinc-500">{item.country} ({item.dialect})</span>
                              <span className="text-[10px] text-zinc-400">•</span>
                              <span className="text-zinc-500">{item.contentType}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              ✍️ محتوى تسويقي
                            </span>
                          </div>
                          <div className="p-2.5 bg-zinc-50 rounded-lg text-zinc-800 text-[11px] leading-relaxed line-clamp-3 font-sans whitespace-pre-wrap">
                            "{item.content}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference Case Studies */}
                {availableData?.referenceCases && availableData.referenceCases.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                      <BookmarkCheck size={13} className="text-purple-700" />
                      <span>دراسات حالة ومراجع تسويقية معتمدة ({availableData.referenceCases.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {availableData.referenceCases.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 space-y-1.5 transition"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">
                                {item.sourceTitle || item.brandName || 'دراسة حالة مرجعية'}
                              </span>
                              <span className="text-[10px] text-zinc-400">•</span>
                              <span className="text-zinc-500">{item.industry}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              📚 مرجع تسويقي
                            </span>
                          </div>
                          <div className="p-2.5 bg-purple-50/50 rounded-lg text-zinc-800 text-[11px] leading-relaxed line-clamp-3">
                            {item.contentSummary || item.content}
                          </div>
                          {item.sourceUrl && (
                            <div className="text-[10px]">
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <span>المصدر الأصلي للدراسة</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 text-xs">
          <div className="text-zinc-500 text-[11px]">
            يتم تحديث المراجع تلقائياً بمجرد اعتمادها في مدير البيانات.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
