import React, { useState } from 'react';
import { ClientBrief, ReferenceExample, StrategyVersion } from '../../types.ts';
import { StrategyBoard } from './StrategyBoard.tsx';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  History,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageSquare,
  Send,
} from 'lucide-react';

interface Stage1Props {
  brief: ClientBrief;
  systemPrompt: string;
  referenceExamples: ReferenceExample[];
  strategyVersions: StrategyVersion[];
  approvedStrategy: string | null;
  useHumanReferences?: boolean;
  onToggleHumanReferences?: (enabled: boolean) => void;
  onApproveStrategy: (strategyContent: string) => void;
  onGenerateNewStrategy: () => Promise<void>;
  onReviseStrategy: (reasons: string[], customFeedback: string) => Promise<void>;
  onSelectVersionToView: (index: number) => void;
  onOpenBriefEditor?: () => void;
  isGenerating: boolean;
  isRevising: boolean;
  errorMessage: string | null;
  selectedModelName?: string;
  onResetWorkflow?: () => void;
}

const REVISION_OPTIONS = [
  'الجمهور المستهدف غير دقيق ومحتاج تركيز أكبر',
  'تموضع البراند غير ملائم للسوق المنافس',
  'نبرة الصوت لا تناسب هوية البراند وطبيعة منتجاته',
  'الأهداف التسويقية غير صحيحة أو غير واقعية',
  'ركائز المحتوى غير مناسبة وتحتاج لتجديد',
  'الاستراتيجية عامة جداً وتفتقر للبصيرة العميقة والتمايز',
  'الاستراتيجية معقدة بزيادة وغير عملية في التنفيذ',
  'محتاجة توجه إبداعي وجريء أكثر يكسر المألوف',
  'محتاجة توجه بيعي وعملي ومباشر أكثر لزيادة المبيعات',
  'بعض المعلومات المذكورة غير دقيقة أو مبنية على افتراضات خاطئة',
  'أخرى / ملاحظات خاصة إضافية',
];

export const Stage1BrandStrategyView: React.FC<Stage1Props> = ({
  brief,
  systemPrompt,
  referenceExamples,
  strategyVersions,
  approvedStrategy,
  useHumanReferences,
  onToggleHumanReferences,
  onApproveStrategy,
  onGenerateNewStrategy,
  onReviseStrategy,
  onSelectVersionToView,
  onOpenBriefEditor,
  isGenerating,
  isRevising,
  errorMessage,
  selectedModelName,
  onResetWorkflow,
}) => {
  const [activeVersionIdx, setActiveVersionIdx] = useState<number>(
    strategyVersions.length > 0 ? strategyVersions.length - 1 : 0
  );

  // Revision Form State
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync active version index if new version added
  React.useEffect(() => {
    if (strategyVersions.length > 0) {
      setActiveVersionIdx(strategyVersions.length - 1);
    }
  }, [strategyVersions.length]);

  const currentVersion: StrategyVersion | undefined = strategyVersions[activeVersionIdx];
  const isCurrentApproved =
    Boolean(approvedStrategy && currentVersion && approvedStrategy === currentVersion.content);

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter((r) => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleStartRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const hasOther = selectedReasons.includes('أخرى / ملاحظات خاصة إضافية');
    if (selectedReasons.length === 0) {
      setValidationError('يرجى تحديد سبب واحد على الأقل للتعديل.');
      return;
    }
    if (hasOther && !customFeedback.trim()) {
      setValidationError('يرجى كتابة الملاحظات الإضافية في حقل النص عند اختيار "أخرى".');
      return;
    }

    try {
      await onReviseStrategy(selectedReasons, customFeedback.trim());
      setShowRevisionForm(false);
      setSelectedReasons([]);
      setCustomFeedback('');
    } catch (err) {
      console.error(err);
    }
  };

  // If no strategy generated yet
  if (strategyVersions.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 text-center max-w-4xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
          <FileText size={28} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-zinc-900">
            المرحلة الأولى: بناء استراتيجية البراند (Brand Strategy)
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
            وفق منهجية العمل التتابعية الصارمة، تبدأ رحلتنا بصياغة واعتماد استراتيجية البراند أولاً. لن يتم توليد أفكار المحتوى إلا بعد مراجعة الاستراتيجية واعتمادها رسمياً من قِبلك.
          </p>
        </div>

        {/* Brief Highlights Card */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-right text-xs space-y-2 max-w-xl mx-auto">
          <div className="font-bold text-zinc-900 flex items-center justify-between">
            <span>بيانات موجز العميل المعتمدة للتشغيل:</span>
            {onOpenBriefEditor && (
              <button
                type="button"
                onClick={onOpenBriefEditor}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 cursor-pointer"
              >
                {brief.brandName ? 'تعديل البيانات أو تغيير النموذج' : 'اختيار نموذج جاهز'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-zinc-600 text-[11px] pt-1 border-t border-zinc-200/70">
            <div><strong>اسم البراند:</strong> {brief.brandName || <span className="text-amber-600 font-semibold">غير محدد</span>}</div>
            <div><strong>السوق:</strong> {brief.country || 'غير محدد'}</div>
            <div><strong>المجال:</strong> {brief.industry || 'غير محدد'}</div>
            <div><strong>الجمهور:</strong> {brief.targetAudience || 'غير محدد'}</div>
            <div><strong>الهدف:</strong> {brief.marketingObjective || 'غير محدد'}</div>
            <div><strong>اللهجة:</strong> {brief.languageDialect || 'غير محدد'}</div>
          </div>

          {brief.clientBrief && (
            <div className="mt-2 text-zinc-700 bg-white p-2.5 rounded border border-zinc-200 text-[11px] line-clamp-3">
              {brief.clientBrief}
            </div>
          )}
        </div>

        {onToggleHumanReferences && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-right max-w-xl mx-auto flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-zinc-800">الاستعانة بالمراجع البشرية المعتمدة:</div>
              <div className="text-[11px] text-zinc-500">
                {useHumanReferences
                  ? 'نشط: استلهام النبرة والخطافات من نماذج المحتوى ودراسات الحالة'
                  : 'معطل: اعتماد حصري على نموذج الذكاء الاصطناعي'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleHumanReferences(!useHumanReferences)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                useHumanReferences
                  ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              {useHumanReferences ? 'مفعّل ✓' : 'معطّل'}
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-right max-w-xl mx-auto flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        {selectedModelName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-700">
            <span>النموذج المعتمد للمشروع:</span>
            <strong className="font-mono text-zinc-900">{selectedModelName}</strong>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={onGenerateNewStrategy}
            disabled={isGenerating || !brief.brandName}
            className="px-8 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition shadow-md flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-300" />
                <span>جارٍ بناء وصياغة استراتيجية البراند...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>توليد استراتيجية البراند الشاملة</span>
              </>
            )}
          </button>

          {!brief.brandName && onOpenBriefEditor && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenBriefEditor}
                className="px-5 py-2.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition cursor-pointer shadow-xs"
              >
                👈 اضغط هنا لاختيار نموذج تجريبي جاهز (برجر، قهوة، أزياء، عقارات، عطور، أو تطبيق)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Meta Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-zinc-900">
                استراتيجية البراند: {brief.brandName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-xs font-mono font-semibold">
                الإصدار v{currentVersion?.version || 1}
              </span>
              {isCurrentApproved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <ShieldCheck size={13} />
                  معتمدة رسمياً
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  في انتظار مراجعة واعتماد المستخدم
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              المرحلة 1 من 5 • المرجع التأسيسي لجميع المراحل اللاحقة.
            </p>
          </div>

          {/* Strategy Version Switcher if multiple versions exist */}
          {strategyVersions.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs bg-zinc-50 p-1 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 text-[11px] px-2 font-medium">سجل الإصدارات:</span>
              {strategyVersions.map((v, idx) => {
                const isSelected = activeVersionIdx === idx;
                const isThisApproved = approvedStrategy === v.content;
                return (
                  <button
                    key={v.version}
                    type="button"
                    onClick={() => {
                      setActiveVersionIdx(idx);
                      onSelectVersionToView(idx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'text-zinc-700 hover:bg-zinc-200/70'
                    }`}
                  >
                    <span>v{v.version}</span>
                    {isThisApproved && <Check size={11} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Previous feedback note if this version was born from a revision */}
        {currentVersion?.rejectionReasons && currentVersion.rejectionReasons.length > 0 && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-950">
              <History size={13} />
              <span>تمت صياغة هذا الإصدار بناءً على طلب تعديل المستخدم:</span>
            </div>
            <div className="text-[11px] text-amber-800 flex flex-wrap gap-2">
              {currentVersion.rejectionReasons.map((r, idx) => (
                <span key={idx} className="bg-amber-100/80 px-2 py-0.5 rounded">
                  • {r}
                </span>
              ))}
            </div>
            {currentVersion.rejectionFeedback && (
              <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/50">
                ملاحظاتك: "{currentVersion.rejectionFeedback}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Strategy Interactive Board */}
      {currentVersion && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <StrategyBoard strategyText={currentVersion.content} />

          {/* APPROVAL & REVISION CONTROLS */}
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-4">
              <div className="space-y-1">
                <h4 className="text-base md:text-lg font-bold text-zinc-900">
                  هل الاستراتيجية دي مناسبة ليك؟
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  اختر اعتماد الاستراتيجية لفتح مرحلة توليد أفكار المحتوى، أو اطلب تعديلها بصياغة مخصصة.
                </p>
              </div>

              {/* Two Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {/* Approve Button */}
                <button
                  type="button"
                  onClick={() => onApproveStrategy(currentVersion.content)}
                  disabled={isCurrentApproved}
                  className={`px-7 py-3 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ${
                    isCurrentApproved
                      ? 'bg-emerald-700 text-white cursor-default'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 size={17} />
                  <span>{isCurrentApproved ? 'الاستراتيجية معتمدة بالفعل ✓' : 'مناسبة، نكمل'}</span>
                </button>

                {/* Reject / Revise Button */}
                <button
                  type="button"
                  onClick={() => setShowRevisionForm(!showRevisionForm)}
                  className="px-6 py-3 bg-white border border-zinc-300 hover:border-zinc-900 text-zinc-800 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <XCircle size={17} className="text-rose-600" />
                  <span>مش مناسبة، محتاجة تعديل</span>
                  {showRevisionForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isCurrentApproved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium inline-flex items-center gap-2">
                  <Check size={14} className="text-emerald-700" />
                  <span>
                    تم اعتماد هذه الاستراتيجية رسمياً وتم فتح مرحلة "أفكار المحتوى" بنجاح.
                  </span>
                </div>
              )}
            </div>

            {/* DEDICATED REVISION INTERFACE */}
            {showRevisionForm && (
              <form
                onSubmit={handleStartRevisionSubmit}
                className="p-5 md:p-6 bg-white border border-zinc-300 rounded-2xl space-y-5 text-xs text-right shadow-sm"
              >
                <div className="border-b border-zinc-100 pb-3">
                  <h5 className="font-bold text-sm md:text-base text-zinc-900">
                    إيه اللي محتاج يتغير في الاستراتيجية؟
                  </h5>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    حدد أسباب عدم الملاءمة واكتب أي توجيهات محددة ليقوم المستشار الذكي بإعادة صياغة الاستراتيجية بدقة مع الحفاظ على الأجزاء الممتازة.
                  </p>
                </div>

                {/* Selectable Revision Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {REVISION_OPTIONS.map((opt, idx) => {
                    const isChecked = selectedReasons.includes(opt);
                    return (
                      <label
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                          isChecked
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50/70 border-zinc-200 hover:border-zinc-300 text-zinc-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleReason(opt)}
                          className="mt-0.5 accent-zinc-900"
                        />
                        <span className="text-xs leading-relaxed font-medium">{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Additional Feedback Textarea */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-zinc-800">
                    ملاحظات وتوجيهات إضافية للتعديل (إلزامي إذا تم اختيار "أخرى"):
                  </label>
                  <textarea
                    rows={3}
                    value={customFeedback}
                    onChange={(e) => setCustomFeedback(e.target.value)}
                    placeholder="اكتب هنا أي تفاصيل تريد تعديلها، مثل: ركز أكثر على فئة الشباب المهنيين في الرياض، واجعل نبرة الصوت أقل رسمية..."
                    className="w-full p-3 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 bg-zinc-50/50 leading-relaxed"
                    dir="auto"
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <span className="text-[11px] text-zinc-400">
                    * سيتم الاحتفاظ بالإصدار السابق في السجل ليمكنك الرجوع إليه دائماً.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      className="px-4 py-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={isRevising}
                      className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isRevising ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-zinc-300" />
                          <span>جارٍ إعادة صياغة الاستراتيجية...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>إعادة صياغة الاستراتيجية</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
