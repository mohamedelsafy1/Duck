import React, { useState } from 'react';
import {
  MarketingDatasetRecord,
  DatasetFilterState,
  DatasetStatsResponse,
} from '../../types.ts';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface DatasetRecordsTableProps {
  records: MarketingDatasetRecord[];
  total: number;
  stats: DatasetStatsResponse | null;
  filters: DatasetFilterState;
  onFilterChange: (newFilters: Partial<DatasetFilterState>) => void;
  onEditRecord: (record: MarketingDatasetRecord) => void;
  onQuickApprove: (id: string) => Promise<void>;
  onQuickReject: (id: string, reason: string) => Promise<void>;
  onBulkReview: (ids: string[], status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onTriggerAIClassify: (id: string) => Promise<void>;
  loading: boolean;
}

export const DatasetRecordsTable: React.FC<DatasetRecordsTableProps> = ({
  records,
  total,
  stats,
  filters,
  onFilterChange,
  onEditRecord,
  onQuickApprove,
  onQuickReject,
  onBulkReview,
  onBulkDelete,
  onTriggerAIClassify,
  loading,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null); // if single or null for bulk

  const isAllPageSelected =
    records.length > 0 && records.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const toggleSelectRecord = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenSingleReject = (id: string) => {
    setTargetRejectId(id);
    setRejectReasonInput('');
    setShowRejectModal(true);
  };

  const handleOpenBulkReject = () => {
    if (selectedIds.length === 0) return;
    setTargetRejectId(null);
    setRejectReasonInput('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonInput.trim()) return;

    if (targetRejectId) {
      await onQuickReject(targetRejectId, rejectReasonInput.trim());
    } else {
      await onBulkReview(selectedIds, 'rejected', rejectReasonInput.trim());
      setSelectedIds([]);
    }
    setShowRejectModal(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const getReviewBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            معتمد
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={12} />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={12} />
            قيد المراجعة
          </span>
        );
    }
  };

  const getLicenseBadge = (license: string) => {
    switch (license) {
      case 'reuse_permitted':
        return (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            مصرح بإعادة الاستخدام
          </span>
        );
      case 'public_domain':
        return (
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            ملك عام (Public Domain)
          </span>
        );
      case 'restricted':
        return (
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            محظور ومقيد
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
            غير محدد / قيد التدقيق
          </span>
        );
    }
  };

  // Distinct dropdown lists from stats
  const countryList = Object.keys(stats?.distributions.countries || {});
  const industryList = Object.keys(stats?.distributions.industries || {});
  const dialectList = Object.keys(stats?.distributions.dialects || {});
  const formatList = Object.keys(stats?.distributions.contentTypes || {});

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value, page: 1 })}
              placeholder="البحث في نص المحتوى، اسم البراند، أو المصدر..."
              className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 bg-zinc-50/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Review Status Filter */}
            <select
              value={filters.reviewStatus}
              onChange={(e) => onFilterChange({ reviewStatus: e.target.value, page: 1 })}
              className="px-2.5 py-2 border border-zinc-300 rounded-xl bg-white text-xs font-medium text-zinc-700"
            >
              <option value="all">كل حالات الاعتماد</option>
              <option value="pending">قيد المراجعة (Pending)</option>
              <option value="approved">معتمد (Approved)</option>
              <option value="rejected">مرفوض (Rejected)</option>
            </select>

            {/* Record Purpose Filter */}
            <select
              value={filters.recordPurpose || 'all'}
              onChange={(e) => onFilterChange({ recordPurpose: e.target.value, page: 1 })}
              className="px-2.5 py-2 border border-zinc-300 rounded-xl bg-white text-xs font-medium text-zinc-700"
            >
              <option value="all">كل أغراض السجلات</option>
              <option value="marketing_content">✍️ محتوى تسويقي (Content)</option>
              <option value="marketing_reference">📚 مرجع تسويقي (Reference)</option>
            </select>

            {/* Country Filter */}
            <select
              value={filters.country}
              onChange={(e) => onFilterChange({ country: e.target.value, page: 1 })}
              className="px-2.5 py-2 border border-zinc-300 rounded-xl bg-white text-xs font-medium text-zinc-700"
            >
              <option value="all">كل الأسواق والدول</option>
              {countryList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Industry Filter */}
            <select
              value={filters.industry}
              onChange={(e) => onFilterChange({ industry: e.target.value, page: 1 })}
              className="px-2.5 py-2 border border-zinc-300 rounded-xl bg-white text-xs font-medium text-zinc-700"
            >
              <option value="all">كل قطاعات الصناعة</option>
              {industryList.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {/* Market Tier Filter */}
            <select
              value={filters.marketTier}
              onChange={(e) => onFilterChange({ marketTier: e.target.value, page: 1 })}
              className="px-2.5 py-2 border border-zinc-300 rounded-xl bg-white text-xs font-medium text-zinc-700"
            >
              <option value="all">كل فئات السوق</option>
              <option value="Tier A">Tier A</option>
              <option value="Tier B">Tier B</option>
              <option value="Tier C">Tier C</option>
              <option value="Unassigned">غير مصنف</option>
            </select>

            {/* Reset Filters */}
            {(filters.searchQuery ||
              filters.reviewStatus !== 'all' ||
              filters.country !== 'all' ||
              filters.industry !== 'all' ||
              filters.marketTier !== 'all') && (
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    searchQuery: '',
                    reviewStatus: 'all',
                    country: 'all',
                    dialect: 'all',
                    industry: 'all',
                    contentType: 'all',
                    marketingObjective: 'all',
                    marketTier: 'all',
                    page: 1,
                  })
                }
                className="px-2.5 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-zinc-600 transition"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (when records are selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-zinc-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="font-bold">تم تحديد {selectedIds.length} سجلاً</span>
              <span className="text-zinc-400 text-[11px]">• إجراءات المراجعة الجماعية:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onBulkReview(selectedIds, 'approved')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 size={13} />
                <span>اعتماد المحدد ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleOpenBulkReject}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <XCircle size={13} />
                <span>رفض المحدد مع ذكر السبب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} سجلاً نهائياً؟`)) {
                    onBulkDelete(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                title="حذف السجلات المحددة"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-zinc-400 hover:text-white px-2 py-1"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Records Table Container */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-zinc-600"
                  >
                    {isAllPageSelected ? (
                      <CheckSquare size={15} className="text-zinc-900" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="p-3 w-28">المعرف / الدفعة</th>
                <th className="p-3 max-w-[320px]">المحتوى / الملخص المرجعي</th>
                <th className="p-3">السوق / اللهجة</th>
                <th className="p-3">المجال / القالب</th>
                <th className="p-3">الفئة (Tier)</th>
                <th className="p-3">المصدر / الترخيص</th>
                <th className="p-3">حالة المراجعة</th>
                <th className="p-3 text-center">الجودة</th>
                <th className="p-3 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-zinc-400">
                    <div className="inline-block w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>جارٍ تحميل السجلات...</div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-zinc-400 space-y-2">
                    <div className="text-sm font-bold text-zinc-700">لا توجد سجلات تطابق البحث أو الفلاتر</div>
                    <p className="text-xs text-zinc-500">
                      جرب تغيير معايير التصفية أو استيراد ملفات جديدة من تبويب الاستيراد.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-zinc-50/70 transition ${
                        isSelected ? 'bg-zinc-100/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRecord(r.id)}
                          className="cursor-pointer text-zinc-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={15} className="text-zinc-900" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-zinc-900">
                          {r.id.split('-').slice(0, 2).join('-')}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[100px]">
                          {r.batchId}
                        </div>
                      </td>

                      <td className="p-3 leading-relaxed max-w-[320px]">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {r.recordPurpose === 'marketing_reference' ? (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              📚 مرجع تسويقي
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              ✍️ محتوى تسويقي
                            </span>
                          )}
                          {r.brandName && (
                            <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[150px]">
                              {r.brandName}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditRecord(r)}
                          className="text-right text-zinc-800 hover:text-blue-700 transition line-clamp-2 cursor-pointer font-medium"
                        >
                          {r.recordPurpose === 'marketing_reference' && r.contentSummary ? (
                            <span>{r.contentSummary}</span>
                          ) : (
                            r.content || <span className="text-zinc-400 italic">بدون نص محتوى</span>
                          )}
                        </button>
                      </td>

                      <td className="p-3 whitespace-nowrap text-[11px] text-zinc-700">
                        <div className="font-medium">{r.country}</div>
                        <div className="text-[10px] text-zinc-400">{r.dialect}</div>
                      </td>

                      <td className="p-3 whitespace-nowrap text-[11px] text-zinc-700">
                        <div className="font-medium">{r.industry}</div>
                        <div className="text-[10px] text-zinc-400">{r.contentType}</div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.marketTier === 'Tier A'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : r.marketTier === 'Tier B'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {r.marketTier}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {r.sourceUrl ? (
                            <a
                              href={r.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              title={r.sourceUrl}
                            >
                              <span>مصدر مباشر</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-zinc-400 text-[10px]">بدون رابط</span>
                          )}
                        </div>
                        <div>{getLicenseBadge(r.licenseStatus)}</div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {getReviewBadge(r.humanReviewStatus)}
                        {r.rejectionReason && (
                          <div className="text-[10px] text-rose-600 truncate max-w-[120px] mt-0.5" title={r.rejectionReason}>
                            سبب: {r.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-zinc-800">
                          {r.dataQualityScore}%
                        </div>
                        <div className="w-12 h-1 bg-zinc-100 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.dataQualityScore >= 80
                                ? 'bg-emerald-500'
                                : r.dataQualityScore >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${r.dataQualityScore}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100 cursor-pointer"
                            title="عرض وتعديل التفاصيل"
                          >
                            <Edit2 size={13} />
                          </button>

                          {r.humanReviewStatus !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => onQuickApprove(r.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 cursor-pointer"
                              title="اعتماد السجل سريعاً"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}

                          {r.humanReviewStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleOpenSingleReject(r.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                              title="رفض السجل مع سبب"
                            >
                              <XCircle size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onTriggerAIClassify(r.id)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50 cursor-pointer"
                            title="اقتراح تصنيف ذكي"
                          >
                            <Sparkles size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-zinc-100 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
          <div>
            إجمالي السجلات: <strong>{total}</strong> • الصفحة <strong>{filters.page}</strong> من{' '}
            <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">حجم الصفحة:</span>
            <select
              value={filters.pageSize}
              onChange={(e) =>
                onFilterChange({ pageSize: parseInt(e.target.value), page: 1 })
              }
              className="text-xs bg-white border border-zinc-300 rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              onClick={() => onFilterChange({ page: Math.max(1, filters.page - 1) })}
              disabled={filters.page <= 1}
              className="p-1.5 rounded border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ page: Math.min(totalPages, filters.page + 1) })}
              disabled={filters.page >= totalPages}
              className="p-1.5 rounded border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* REJECTION REASON MODAL (Required by policy) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                <XCircle size={16} className="text-rose-600" />
                <span>تحديد سبب الرفض (إلزامي وفق سياسة الجودة)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              {targetRejectId
                ? 'يرجى توضيح سبب رفض هذا السجل لحفظه في سجل التدقيق والمراجعة.'
                : `يرجى تحديد سبب رفض الـ ${selectedIds.length} سجلاً المحددة.`}
            </p>

            <form onSubmit={handleConfirmRejectSubmit} className="space-y-3">
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                required
                rows={3}
                placeholder="اكتب سبب الرفض بدقة: محتوى غير مكتمل، صياغة ركيكة، ادعاءات غير مدعومة، عدم وضوح الترخيص..."
                className="w-full p-2.5 text-xs rounded-xl border border-rose-300 focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!rejectReasonInput.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  تأكيد الرفض وتسجيل السبب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
