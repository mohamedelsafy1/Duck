import React, { useState } from 'react';
import { DatasetStatsResponse } from '../../types.ts';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface DatasetExportSectionProps {
  stats: DatasetStatsResponse | null;
}

export const DatasetExportSection: React.FC<DatasetExportSectionProps> = ({ stats }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'jsonl'>('csv');
  const [onlyApproved, setOnlyApproved] = useState<boolean>(true);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const approvedCount = stats?.approved || 0;
  const totalCount = stats?.totalRecords || 0;

  const eligibleCount = onlyApproved ? approvedCount : totalCount;

  const handleTriggerExport = () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', exportFormat);
      params.set('onlyApproved', onlyApproved ? 'true' : 'false');
      if (selectedPurpose !== 'all') params.set('recordPurpose', selectedPurpose);
      if (selectedCountry !== 'all') params.set('country', selectedCountry);
      if (selectedIndustry !== 'all') params.set('industry', selectedIndustry);

      const downloadUrl = `/api/dataset/export?${params.toString()}`;
      window.location.href = downloadUrl;
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  const countries = Object.keys(stats?.distributions.countries || {});
  const industries = Object.keys(stats?.distributions.industries || {});

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Download size={20} className="text-zinc-800" />
            <span>تصدير سجلات مجموعة البيانات (Export Dataset)</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            تصدير سجلات الحملات والمنشورات التسويقية المعتمدة بصيغ CSV أو JSONL المتوافقة مع التحليلات وحزم الذكاء الاصطناعي.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <ShieldCheck size={15} />
          <span>{approvedCount} سجل معتمد متاح للتصدير</span>
        </div>
      </div>

      {/* Main Export Configuration Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Step 1: Export Scope */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-900">
            نطاق وحالة السجلات المطلوب تصديرها:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                onlyApproved
                  ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={onlyApproved}
                onChange={() => setOnlyApproved(true)}
                className="mt-0.5 text-zinc-900"
              />
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>تصدير السجلات المعتمدة فقط (Export Approved Records — موصى به)</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  يستبعد السجلات غير المراجعة والمرفوضة، لضمان أعلى موثوقية وجودة في البيانات المصدرة.
                </p>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                !onlyApproved
                  ? 'bg-zinc-100 border-zinc-400 text-zinc-950'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={!onlyApproved}
                onChange={() => setOnlyApproved(false)}
                className="mt-0.5 text-zinc-900"
              />
              <div className="space-y-1">
                <div className="font-bold">تصدير جميع السجلات (بما فيها قيد المراجعة)</div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  تصدير كامل قاعدة البيانات لأغراض التدقيق الداخلي والأرشفة الشاملة.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Format Choice */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-900">
            صيغة الملف المصدر (Export Format):
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`p-3.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between ${
                exportFormat === 'csv'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <FileSpreadsheet size={15} />
                  <span>CSV (جدول إكسل ومجدول)</span>
                </div>
                <div className={`text-[10px] ${exportFormat === 'csv' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                  ترميز UTF-8 مع BOM لدعم كامل للغة العربية في Excel
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('jsonl')}
              className={`p-3.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between ${
                exportFormat === 'jsonl'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <FileCode size={15} />
                  <span>JSONL (سطر لكل سجل JSON)</span>
                </div>
                <div className={`text-[10px] ${exportFormat === 'jsonl' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                  المعيار القياسي لتدريب وتغذية نماذج الذكاء الاصطناعي و RAG
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Optional Filter Filters */}
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <Filter size={13} />
            <span>تصفية اختيارية للملف المصدر:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 text-[11px] mb-1">نوع السجل (Purpose)</label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 bg-white"
              >
                <option value="all">كل الأغراض (المحتوى والمراجع)</option>
                <option value="marketing_content">✍️ محتوى تسويقي فقط (Content)</option>
                <option value="marketing_reference">📚 مراجع تسويقية فقط (References)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 text-[11px] mb-1">السوق / الدولة</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 bg-white"
              >
                <option value="all">كل الأسواق</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 text-[11px] mb-1">قطاع الصناعة</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 bg-white"
              >
                <option value="all">كل القطاعات</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Explicit Action Callout */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold text-xs text-emerald-950">
              عدد السجلات التي سيشملها ملف التصدير:
            </div>
            <div className="text-sm font-mono font-bold text-emerald-900 mt-0.5">
              {eligibleCount} سجل تسويقي
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerExport}
            disabled={isExporting || eligibleCount === 0}
            className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Download size={15} />
            <span>
              {isExporting ? 'جارٍ تجهيز وتحميل الملف...' : 'تصدير السجلات المعتمدة (Export Approved Records)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
