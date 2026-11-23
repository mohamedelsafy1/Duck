import React, { useState } from 'react';
import { MarketingDatasetRecord, MarketTier } from '../../types.ts';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Edit2,
  AlertTriangle,
  ArrowRight,
  Check,
} from 'lucide-react';

interface DatasetReviewQueueProps {
  pendingRecords: MarketingDatasetRecord[];
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string, notes?: string) => Promise<void>;
  onTriggerAIClassify: (id: string) => Promise<void>;
  onOpenEditModal: (record: MarketingDatasetRecord) => void;
  isAIClassifying: boolean;
}

export const DatasetReviewQueue: React.FC<DatasetReviewQueueProps> = ({
  pendingRecords,
  onApprove,
  onReject,
  onTriggerAIClassify,
  onOpenEditModal,
  isAIClassifying,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRecord = pendingRecords[currentIndex];

  const handleNext = () => {
    setShowRejectBox(false);
    setRejectionReason('');
    setReviewerNotes('');
    if (currentIndex < pendingRecords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setShowRejectBox(false);
    setRejectionReason('');
    setReviewerNotes('');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleApproveAction = async () => {
    if (!currentRecord) return;
    setIsSubmitting(true);
    try {
      await onApprove(currentRecord.id, reviewerNotes.trim());
      setReviewerNotes('');
      // stays on current index (which will show next pending item)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAction = async () => {
    if (!currentRecord) return;
    if (!rejectionReason.trim()) {
      alert('يرجى تحديد سبب الرفض إجبارياً.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(currentRecord.id, rejectionReason.trim(), reviewerNotes.trim());
      setShowRejectBox(false);
      setRejectionReason('');
      setReviewerNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingRecords.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 size={30} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-900">
            قائمة المراجعة مكتملة بالكامل!
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            لا توجد سجلات في انتظار المراجعة حالياً. تم البت في كافة السجلات المستوردة إما بالاعتماد أو الرفض.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Queue Header & Stepper */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-bold text-xs md:text-sm text-zinc-900">
              قائمة التدقيق والمراجعة البشرية (Human Review Queue)
            </h3>
            <div className="text-[11px] text-zinc-400">
              سجل {currentIndex + 1} من أصل {pendingRecords.length} في انتظار البت
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
            title="السجل السابق"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-xs font-mono font-bold text-zinc-700">
            {currentIndex + 1} / {pendingRecords.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= pendingRecords.length - 1}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
            title="السجل التالي"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Main Review Card */}
      {currentRecord && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
          {/* Top Meta info */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                {currentRecord.id}
              </span>
              <span className="text-zinc-400">•</span>
              {currentRecord.recordPurpose === 'marketing_reference' ? (
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  📚 مرجع تسويقي (Reference)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  ✍️ محتوى تسويقي (Content)
                </span>
              )}
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-600 font-medium">الدفعة: {currentRecord.batchId}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500">الجودة: {currentRecord.dataQualityScore}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTriggerAIClassify(currentRecord.id)}
                disabled={isAIClassifying}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles size={13} />
                <span>{isAIClassifying ? 'جارٍ التحليل...' : 'اقتراح تصنيف ذكي'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEditModal(currentRecord)}
                className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>تعديل السجل</span>
              </button>
            </div>
          </div>

          {/* Marketing Content or Reference Summary */}
          {currentRecord.recordPurpose === 'marketing_reference' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                  <span>ملخص المرجع التسويقي ودراسة الحالة:</span>
                </div>
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 text-xs md:text-sm text-zinc-900 leading-relaxed font-sans whitespace-pre-wrap">
                  {currentRecord.contentSummary || 'لا يوجد ملخص متوفر'}
                </div>
              </div>

              {currentRecord.content && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-zinc-500">نص المحتوى التكميلي المرفق:</div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentRecord.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-zinc-500">نص المحتوى التسويقي:</div>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs md:text-sm text-zinc-900 leading-relaxed font-sans whitespace-pre-wrap">
                {currentRecord.content || <span className="text-zinc-400 italic">بدون محتوى</span>}
              </div>
            </div>
          )}

          {/* Metadata Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] text-zinc-400">البراند</div>
              <div className="font-bold text-zinc-900 truncate">
                {currentRecord.brandName || 'غير متوفر في المصدر'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] text-zinc-400">السوق واللهجة</div>
              <div className="font-bold text-zinc-900 truncate">
                {currentRecord.country} ({currentRecord.dialect})
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] text-zinc-400">الصناعة والقالب</div>
              <div className="font-bold text-zinc-900 truncate">
                {currentRecord.industry} • {currentRecord.contentType}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="text-[10px] text-zinc-400">فئة السوق</div>
              <div className="font-bold text-zinc-900 truncate">
                {currentRecord.marketTier}
              </div>
            </div>
          </div>

          {/* Provenance & License Card */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">بيانات المصدر والترخيص:</span>
              <span className="text-[11px] text-zinc-500">
                {currentRecord.sourceVerificationStatus === 'verified' ? 'مصدر موثق' : 'مصدر غير موثق'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-600">
              <div>
                <strong>الرابط:</strong>{' '}
                {currentRecord.sourceUrl ? (
                  <a
                    href={currentRecord.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>فتح رابط المصدر</span>
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-zinc-400">لا يوجد رابط مباشر</span>
                )}
              </div>

              <div>
                <strong>الترخيص:</strong>{' '}
                <span className="font-semibold text-zinc-800">
                  {currentRecord.licenseStatus}
                </span>
              </div>

              {currentRecord.permissionNotes && (
                <div>
                  <strong>ملاحظات:</strong> {currentRecord.permissionNotes}
                </div>
              )}
            </div>
          </div>

          {/* AI Suggestions if available */}
          {currentRecord.aiSuggestions && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-700" />
                <span>اقتراحات الذكاء الاصطناعي المسجلة:</span>
              </div>
              <div className="text-[11px] grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div>سوق مقترح: <strong>{currentRecord.aiSuggestions.country?.value}</strong></div>
                <div>لهجة مقترحة: <strong>{currentRecord.aiSuggestions.dialect?.value}</strong></div>
                <div>صناعة مقترحة: <strong>{currentRecord.aiSuggestions.industry?.value}</strong></div>
                <div>قالب مقترح: <strong>{currentRecord.aiSuggestions.contentType?.value}</strong></div>
                <div>هدف مقترح: <strong>{currentRecord.aiSuggestions.objective?.value}</strong></div>
                <div>فئة مقترحة: <strong>{currentRecord.aiSuggestions.marketTier?.value}</strong></div>
              </div>
            </div>
          )}

          {/* Review Notes Input */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
              ملاحظات المدقق (اختياري، تحفظ مع سجل المراجعة):
            </label>
            <input
              type="text"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="مثال: تم التأكد من جودة الصياغة والتموضع..."
              className="w-full p-2.5 rounded-xl border border-zinc-300 bg-white text-xs"
            />
          </div>

          {/* REJECTION REASON BOX (if toggled) */}
          {showRejectBox && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
              <div className="font-bold text-xs text-rose-900">
                يرجى تحديد سبب الرفض إجبارياً:
              </div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="سبب الرفض: محتوى مكرر، نبرة غير ملائمة، انتهاك سياسة الترخيص..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-lg border border-rose-300 focus:outline-none focus:border-rose-500 bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleRejectAction}
                  disabled={!rejectionReason.trim() || isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                  تأكيد الرفض
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
            <div className="text-[11px] text-zinc-400">
              الاعتماد ينقل السجل إلى حالة Approved ويجعله مؤهلاً للتصدير والاستخدام.
            </div>

            <div className="flex items-center gap-2">
              {!showRejectBox && (
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>رفض السجل (Reject)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleApproveAction}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 size={15} />
                <span>اعتماد السجل (Approve)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
