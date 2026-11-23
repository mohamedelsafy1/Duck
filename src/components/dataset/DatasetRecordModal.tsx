import React, { useState } from 'react';
import {
  MarketingDatasetRecord,
  MarketTier,
  LicenseStatus,
  SourceVerificationStatus,
  DatasetReviewStatus,
} from '../../types.ts';
import {
  X,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  Check,
  RotateCcw,
} from 'lucide-react';

interface DatasetRecordModalProps {
  record: MarketingDatasetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<MarketingDatasetRecord>) => Promise<void>;
  onTriggerAIClassify: (id: string) => Promise<void>;
  isAIClassifying: boolean;
}

export const DatasetRecordModal: React.FC<DatasetRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  onTriggerAIClassify,
  isAIClassifying,
}) => {
  if (!isOpen || !record) return null;

  // Form State
  const [recordPurpose, setRecordPurpose] = useState<'marketing_content' | 'marketing_reference'>(
    record.recordPurpose || (record.content && record.content.trim().length >= 5 ? 'marketing_content' : 'marketing_reference')
  );
  const [content, setContent] = useState(record.content || '');
  const [contentSummary, setContentSummary] = useState(record.contentSummary || '');
  const [brandName, setBrandName] = useState(record.brandName || '');
  const [country, setCountry] = useState(record.country || '');
  const [dialect, setDialect] = useState(record.dialect || '');
  const [industry, setIndustry] = useState(record.industry || '');
  const [contentType, setContentType] = useState(record.contentType || '');
  const [marketingObjective, setMarketingObjective] = useState(record.marketingObjective || '');
  const [contentPillar, setContentPillar] = useState(record.contentPillar || '');
  const [publicationDate, setPublicationDate] = useState(record.publicationDate || '');
  const [marketTier, setMarketTier] = useState<MarketTier>(record.marketTier || 'Unassigned');

  // Provenance & License
  const [sourceUrl, setSourceUrl] = useState(record.sourceUrl || '');
  const [sourceId, setSourceId] = useState(record.sourceId || '');
  const [sourcePlatform, setSourcePlatform] = useState(record.sourcePlatform || '');
  const [sourceTitle, setSourceTitle] = useState(record.sourceTitle || '');
  const [sourceVerificationStatus, setSourceVerificationStatus] = useState<SourceVerificationStatus>(
    record.sourceVerificationStatus || 'unverified'
  );
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(record.licenseStatus || 'unknown');
  const [licenseName, setLicenseName] = useState(record.licenseName || '');
  const [permissionNotes, setPermissionNotes] = useState(record.permissionNotes || '');

  // Review
  const [humanReviewStatus, setHumanReviewStatus] = useState<DatasetReviewStatus>(
    record.humanReviewStatus || 'pending'
  );
  const [reviewerNotes, setReviewerNotes] = useState(record.reviewerNotes || '');
  const [rejectionReason, setRejectionReason] = useState(record.rejectionReason || '');

  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'provenance' | 'raw'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accept AI suggestions
  const handleAcceptAISuggestions = () => {
    if (!record.aiSuggestions) return;
    if (record.aiSuggestions.country) setCountry(record.aiSuggestions.country.value);
    if (record.aiSuggestions.dialect) setDialect(record.aiSuggestions.dialect.value);
    if (record.aiSuggestions.industry) setIndustry(record.aiSuggestions.industry.value);
    if (record.aiSuggestions.contentType) setContentType(record.aiSuggestions.contentType.value);
    if (record.aiSuggestions.objective) setMarketingObjective(record.aiSuggestions.objective.value);
    if (record.aiSuggestions.marketTier) setMarketTier(record.aiSuggestions.marketTier.value as MarketTier);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (recordPurpose === 'marketing_content' && !content.trim()) {
      setErrorMsg('المحتوى التسويقي الأصلي إلزامي لسجلات المحتوى (marketing_content).');
      return;
    }

    if (recordPurpose === 'marketing_reference') {
      if (!contentSummary.trim()) {
        setErrorMsg('سجل المرجع التسويقي (marketing_reference) يتطلب كتابة ملخص للمحتوى / الفكرة.');
        return;
      }
      if (!sourceUrl.trim() && !sourceId.trim() && !sourcePlatform.trim()) {
        setErrorMsg('سجل المرجع التسويقي يتطلب توثيق مصدر (رابط المصدر، معرف المصدر، أو منصة النشر).');
        return;
      }
    }

    if (humanReviewStatus === 'rejected' && !rejectionReason.trim()) {
      setErrorMsg('سبب الرفض إلزامي عند تصنيف السجل كمرفوض.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(record.id, {
        recordPurpose,
        content: content.trim(),
        contentSummary: contentSummary.trim() || null,
        brandName: brandName.trim() || null,
        country: country.trim() || 'غير محدد',
        dialect: dialect.trim() || 'غير محدد',
        industry: industry.trim() || 'غير محدد',
        contentType: contentType.trim() || 'غير محدد',
        marketingObjective: marketingObjective.trim() || 'غير محدد',
        contentPillar: contentPillar.trim() || null,
        publicationDate: publicationDate.trim() || null,
        marketTier,
        sourceUrl: sourceUrl.trim() || null,
        sourceId: sourceId.trim() || undefined,
        sourcePlatform: sourcePlatform.trim() || null,
        sourceTitle: sourceTitle.trim() || null,
        sourceVerificationStatus,
        licenseStatus,
        licenseName: licenseName.trim() || null,
        permissionNotes: permissionNotes.trim() || null,
        humanReviewStatus,
        reviewerNotes: reviewerNotes.trim() || null,
        rejectionReason: humanReviewStatus === 'rejected' ? rejectionReason.trim() : null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل حفظ التعديلات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="font-mono text-xs bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-bold">
              {record.id}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-xs md:text-sm">
                مراجعة وتعديل السجل التسويقي
              </h3>
              <div className="text-[11px] text-zinc-400">
                دفعة: {record.batchId} • جودة البيانات: {record.dataQualityScore}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTriggerAIClassify(record.id)}
              disabled={isAIClassifying}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles size={13} />
              <span>{isAIClassifying ? 'جارٍ التحليل...' : 'اقتراح تصنيف ذكي'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-zinc-100 text-xs font-semibold bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'content' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            المحتوى والاعتماد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'metadata' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            التصنيفات والبيانات الوصفية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'provenance' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            المصدر والتراخيص
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'raw' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            السجل الخام (Audit Raw)
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSaveSubmit} className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* AI Suggestions Callout if available */}
          {record.aiSuggestions && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-700" />
                  <span>اقتراحات الذكاء الاصطناعي (AI Suggestions — Model: {record.aiSuggestions.model})</span>
                </div>
                <button
                  type="button"
                  onClick={handleAcceptAISuggestions}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  تطبيق هذه الاقتراحات على الحقول
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-blue-900 pt-1">
                {record.aiSuggestions.country && (
                  <div>الدولة: <strong>{record.aiSuggestions.country.value}</strong> ({Math.round(record.aiSuggestions.country.confidence * 100)}%)</div>
                )}
                {record.aiSuggestions.dialect && (
                  <div>اللهجة: <strong>{record.aiSuggestions.dialect.value}</strong> ({Math.round(record.aiSuggestions.dialect.confidence * 100)}%)</div>
                )}
                {record.aiSuggestions.industry && (
                  <div>الصناعة: <strong>{record.aiSuggestions.industry.value}</strong> ({Math.round(record.aiSuggestions.industry.confidence * 100)}%)</div>
                )}
                {record.aiSuggestions.contentType && (
                  <div>القالب: <strong>{record.aiSuggestions.contentType.value}</strong> ({Math.round(record.aiSuggestions.contentType.confidence * 100)}%)</div>
                )}
                {record.aiSuggestions.objective && (
                  <div>الهدف: <strong>{record.aiSuggestions.objective.value}</strong> ({Math.round(record.aiSuggestions.objective.confidence * 100)}%)</div>
                )}
                {record.aiSuggestions.marketTier && (
                  <div>الفئة: <strong>{record.aiSuggestions.marketTier.value}</strong> ({Math.round(record.aiSuggestions.marketTier.confidence * 100)}%)</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: CONTENT & REVIEW */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Record Purpose Selector */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <label className="block font-bold text-zinc-900 text-xs">
                  تصنيف وطبيعة السجل (Record Purpose) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      recordPurpose === 'marketing_content'
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recordPurpose"
                      value="marketing_content"
                      checked={recordPurpose === 'marketing_content'}
                      onChange={() => setRecordPurpose('marketing_content')}
                      className="mt-0.5 text-teal-700"
                    />
                    <div>
                      <div>✍️ محتوى تسويقي (Marketing Content)</div>
                      <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                        نص تسويقي كامل أصلي يمكن استخدامه كأمثلة كتابية مباشرة ومطابقة اللهجة.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      recordPurpose === 'marketing_reference'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recordPurpose"
                      value="marketing_reference"
                      checked={recordPurpose === 'marketing_reference'}
                      onChange={() => setRecordPurpose('marketing_reference')}
                      className="mt-0.5 text-purple-700"
                    />
                    <div>
                      <div>📚 مرجع تسويقي (Marketing Reference)</div>
                      <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                        دراسة حالة أو مفهوم استراتيجي للاستلهام، لا يشترط وجود النص التسويقي الكامل.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Content Summary (Especially for marketing_reference) */}
              <div>
                <label className="block font-bold text-zinc-900 mb-1">
                  ملخص المحتوى / نبذة الفكرة والحملة (Content Summary)
                  {recordPurpose === 'marketing_reference' && <span className="text-rose-600 font-bold mr-1">*</span>}
                </label>
                <textarea
                  value={contentSummary}
                  onChange={(e) => setContentSummary(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 leading-relaxed font-sans"
                  placeholder="وصف أو ملخص الفكرة التسويقية، زاوية الحملة، ولماذا تعتبر مرجعاً مهماً..."
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-900 mb-1.5">
                  نص المحتوى التسويقي الأصلي (Marketing Copy)
                  {recordPurpose === 'marketing_content' && <span className="text-rose-600 font-bold mr-1">*</span>}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full p-3 text-xs md:text-sm rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 leading-relaxed font-sans"
                  placeholder="نص المنشور، الإعلان، أو السكريبت..."
                />
              </div>

              {/* Review Decision Block */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
                <div className="font-bold text-zinc-900">
                  حالة المراجعة البشرية (Human Review Decision):
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      humanReviewStatus === 'pending'
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="pending"
                      checked={humanReviewStatus === 'pending'}
                      onChange={() => setHumanReviewStatus('pending')}
                      className="hidden"
                    />
                    <Clock size={14} />
                    <span>قيد المراجعة (Pending)</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      humanReviewStatus === 'approved'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="approved"
                      checked={humanReviewStatus === 'approved'}
                      onChange={() => setHumanReviewStatus('approved')}
                      className="hidden"
                    />
                    <CheckCircle2 size={14} />
                    <span>معتمد (Approved)</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      humanReviewStatus === 'rejected'
                        ? 'bg-rose-100 border-rose-300 text-rose-900'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="rejected"
                      checked={humanReviewStatus === 'rejected'}
                      onChange={() => setHumanReviewStatus('rejected')}
                      className="hidden"
                    />
                    <XCircle size={14} />
                    <span>مرفوض (Rejected)</span>
                  </label>
                </div>

                {humanReviewStatus === 'rejected' && (
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">
                      سبب الرفض (إلزامي في حال الرفض) *
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="مثال: جودة صياغة ضعيفة، معلومات مضللة، انتهاك حقوق ملكية..."
                      className="w-full p-2.5 rounded-lg border border-rose-300 focus:outline-none focus:border-rose-500 bg-white text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-zinc-700 font-medium mb-1">
                    ملاحظات المدقق البشري (Reviewer Notes)
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="أي ملاحظات فنية أو توجيهات حول هذا النموذج..."
                    className="w-full p-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-900 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METADATA */}
          {activeTab === 'metadata' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">اسم البراند (Brand Name)</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">السوق / الدولة (Country)</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">اللهجة (Dialect)</label>
                <input
                  type="text"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">قطاع الصناعة (Industry)</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">نوع المحتوى (Content Type)</label>
                <input
                  type="text"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">الهدف التسويقي (Objective)</label>
                <input
                  type="text"
                  value={marketingObjective}
                  onChange={(e) => setMarketingObjective(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">تصنيف السوق (Market Tier)</label>
                <select
                  value={marketTier}
                  onChange={(e) => setMarketTier(e.target.value as MarketTier)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="Tier A">Tier A (أسواق كبرى / عالي الإنفاق)</option>
                  <option value="Tier B">Tier B (أسواق متوسطة النمو)</option>
                  <option value="Tier C">Tier C (أسواق ناشئة أو محدودة)</option>
                  <option value="Unassigned">غير مصنف (Unassigned)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">تاريخ النشر الأصلي</label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PROVENANCE & LICENSING */}
          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-zinc-700 mb-1">رابط المصدر الأصلي (Source URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/post/..."
                      className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                    />
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg shrink-0"
                        title="فتح الرابط الأصلي"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">معرف المصدر (Source ID)</label>
                  <input
                    type="text"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">منصة النشر (Platform)</label>
                  <input
                    type="text"
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    placeholder="Instagram, X, LinkedIn..."
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    حالة التحقق من المصدر (Verification)
                  </label>
                  <select
                    value={sourceVerificationStatus}
                    onChange={(e) => setSourceVerificationStatus(e.target.value as SourceVerificationStatus)}
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                  >
                    <option value="unverified">غير موثق (Unverified)</option>
                    <option value="verified">موثق من المصدر (Verified)</option>
                    <option value="disputed">محل نزاع (Disputed)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    حالة الترخيص وإعادة الاستخدام (License Status)
                  </label>
                  <select
                    value={licenseStatus}
                    onChange={(e) => setLicenseStatus(e.target.value as LicenseStatus)}
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white font-semibold"
                  >
                    <option value="unknown">غير محدد (Unknown)</option>
                    <option value="pending_verification">قيد التحقق (Pending Verification)</option>
                    <option value="permission_required">يتطلب إذناً صريحاً (Permission Required)</option>
                    <option value="reuse_permitted">مصرح بإعادة الاستخدام (Reuse Permitted)</option>
                    <option value="restricted">محظور ومقيد الاستخدام (Restricted)</option>
                    <option value="public_domain">ملك عام (Public Domain)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-zinc-700 mb-1">ملاحظات الترخيص والاستخدام الداخلي</label>
                  <input
                    type="text"
                    value={permissionNotes}
                    onChange={(e) => setPermissionNotes(e.target.value)}
                    placeholder="أي قيود أو اتفاقيات حول ترخيص هذا النموذج..."
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW RECORD AUDIT */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="text-[11px] text-zinc-500">
                الحقول الأصلية كما تم استيرادها من الملف دون تعديل لأغراض التدقيق والمطابقة:
              </div>
              <pre className="p-3 bg-zinc-900 text-zinc-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed dir-ltr text-left">
                {JSON.stringify(record.rawRecord || record, null, 2)}
              </pre>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              بصمة المحتوى: {record.contentFingerprint?.slice(0, 16)}...
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save size={14} />
                <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
