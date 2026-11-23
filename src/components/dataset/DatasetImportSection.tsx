import React, { useState, useRef } from 'react';
import {
  ImportPreviewResponse,
  PreviewRecordItem,
  ValidationIssue,
} from '../../types.ts';
import {
  UploadCloud,
  FileText,
  Archive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Download,
  Check,
  Filter,
  Layers,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface DatasetImportSectionProps {
  onImportSuccess: () => void;
}

export const DatasetImportSection: React.FC<DatasetImportSectionProps> = ({
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase A State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContentRaw, setFileContentRaw] = useState<string>('');
  const [isBase64, setIsBase64] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Field Mapping State
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(false);

  // User-adjusted record purposes in preview
  const [purposeOverrides, setPurposeOverrides] = useState<Record<number, 'marketing_content' | 'marketing_reference'>>({});

  // ZIP Archive Selection State
  const [selectedFilesInZip, setSelectedFilesInZip] = useState<string[]>([]);

  // Preview Filter Tab
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all');

  // Phase B State
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [excludeInvalid, setExcludeInvalid] = useState<boolean>(true);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    batchId: string;
    totalDetected: number;
    insertedCount: number;
    skippedDuplicatesCount: number;
    invalidCount: number;
    totalInDatabase: number;
    message: string;
  } | null>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setPreviewData(null);
    setImportResult(null);
    setSelectedFile(file);

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isJsonl = file.name.toLowerCase().endsWith('.jsonl') || file.name.toLowerCase().endsWith('.ndjson');

    if (!isZip && !isCsv && !isJsonl) {
      setValidationError('صيغة الملف غير مدعومة. يرجى اختيار ملف CSV أو JSONL أو أرشيف ZIP مضغوط.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setValidationError('حجم الملف يتجاوز الحد المسموح به (25 ميجابايت).');
      return;
    }

    try {
      if (isZip) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setFileContentRaw(base64);
          setIsBase64(true);
          runValidationPreview(file.name, 'zip', base64, true, {});
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          setFileContentRaw(text);
          setIsBase64(false);
          runValidationPreview(file.name, isCsv ? 'csv' : 'jsonl', text, false, {});
        };
        reader.readAsText(file, 'UTF-8');
      }
    } catch (err: any) {
      setValidationError(`فشل قراءة الملف: ${err?.message || 'خطأ'}`);
    }
  };

  // Run Phase A preview and validation
  const runValidationPreview = async (
    fileName: string,
    fileFormat: 'csv' | 'jsonl' | 'zip',
    content: string,
    base64Flag: boolean,
    mappings: Record<string, string>,
    zipSelection?: string[]
  ) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const res = await fetch('/api/dataset/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileFormat,
          fileContent: content,
          isBase64: base64Flag,
          customMappings: mappings,
          selectedFilesInZip: zipSelection,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل فحص ومعاينة الملف.');
      }

      setPreviewData(data);
      if (data.archiveFilesFound) {
        setSelectedFilesInZip(
          data.archiveFilesFound.filter((f: any) => f.selected).map((f: any) => f.name)
        );
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(err?.message || 'حدث خطأ أثناء معاينة وفحص الملف.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle re-validating after ZIP file toggle
  const handleToggleZipFile = (filename: string) => {
    if (!selectedFile || !fileContentRaw) return;
    const updated = selectedFilesInZip.includes(filename)
      ? selectedFilesInZip.filter((f) => f !== filename)
      : [...selectedFilesInZip, filename];

    setSelectedFilesInZip(updated);
    runValidationPreview(
      selectedFile.name,
      'zip',
      fileContentRaw,
      isBase64,
      customMappings,
      updated
    );
  };

  // Handle field mapping updates
  const handleMapField = (rawField: string, canonicalField: string) => {
    const updated = { ...customMappings };
    if (canonicalField === 'ignore') {
      delete updated[rawField];
    } else {
      updated[rawField] = canonicalField;
    }
    setCustomMappings(updated);
    if (selectedFile && fileContentRaw) {
      runValidationPreview(
        selectedFile.name,
        previewData?.fileFormat || 'csv',
        fileContentRaw,
        isBase64,
        updated,
        selectedFilesInZip
      );
    }
  };

  // Phase B: Confirm Import
  const handleConfirmImport = async () => {
    if (!previewData || !selectedFile || !fileContentRaw) return;

    setIsConfirming(true);
    setValidationError(null);

    try {
      // Send raw records to backend confirm-import endpoint
      const rawRowsToSend = previewData.previewRecords.map((item) => item.record.rawRecord || item.record);

      const res = await fetch('/api/dataset/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: previewData.fileName,
          fileFormat: previewData.fileFormat,
          rawRows: rawRowsToSend,
          customMappings,
          purposeOverrides,
          skipDuplicates,
          excludeInvalid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تأكيد الاستيراد.');
      }

      setImportResult(data);
      onImportSuccess();
    } catch (err: any) {
      console.error(err);
      setValidationError(err?.message || 'حدث خطأ أثناء حفظ السجلات في قاعدة البيانات.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Download error report
  const handleDownloadErrorReport = () => {
    if (!previewData || previewData.allValidationIssues.length === 0) return;
    const json = JSON.stringify(previewData.allValidationIssues, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_validation_errors_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset import flow
  const handleResetImport = () => {
    setSelectedFile(null);
    setFileContentRaw('');
    setPreviewData(null);
    setValidationError(null);
    setCustomMappings({});
    setPurposeOverrides({});
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Process preview records dynamically based on purpose overrides
  const processedPreviewRecords: PreviewRecordItem[] = (previewData?.previewRecords || []).map((item) => {
    const override = purposeOverrides[item.index];
    const currentPurpose: 'marketing_content' | 'marketing_reference' =
      override ||
      item.record.recordPurpose ||
      (item.record.content && item.record.content.trim().length >= 5 ? 'marketing_content' : 'marketing_reference');

    const hasMeaningfulContent = Boolean(
      item.record.content &&
      typeof item.record.content === 'string' &&
      item.record.content.trim().length >= 5 &&
      item.record.content.trim().toLowerCase() !== 'n/a'
    );

    const hasMeaningfulSummary = Boolean(
      item.record.contentSummary &&
      typeof item.record.contentSummary === 'string' &&
      item.record.contentSummary.trim().length >= 5 &&
      item.record.contentSummary.trim().toLowerCase() !== 'n/a'
    );

    const hasTraceableSource = Boolean(
      (item.record.sourceUrl && item.record.sourceUrl.trim().length > 3) ||
      (item.record.sourceId && item.record.sourceId.trim().length > 0) ||
      (item.record.sourcePlatform && item.record.sourcePlatform.trim().length > 0)
    );

    let errors = [...item.errors];
    let warnings = [...item.warnings];

    if (currentPurpose === 'marketing_reference') {
      // Content is optional for references
      errors = errors.filter(
        (e) => !e.message.includes('المحتوى التسويقي') && e.field !== 'content'
      );
      if (!hasMeaningfulSummary && !errors.some((e) => e.field === 'contentSummary')) {
        errors.push({
          rowIndex: item.index,
          field: 'contentSummary',
          severity: 'error',
          message: 'سجل المرجع التسويقي (Reference) يتطلب توفير ملخص واضح للفكرة أو المفهوم التسويقي.',
        });
      }
      if (!hasTraceableSource && !errors.some((e) => e.field === 'sourceUrl')) {
        errors.push({
          rowIndex: item.index,
          field: 'sourceUrl',
          severity: 'error',
          message: 'سجل المرجع التسويقي يتطلب توثيق مصدر موثق (رابط، معرف، أو منصة).',
        });
      }
    } else {
      // Marketing content requires content
      if (!hasMeaningfulContent && !errors.some((e) => e.field === 'content')) {
        errors.push({
          rowIndex: item.index,
          field: 'content',
          severity: 'error',
          message: 'سجل المحتوى التسويقي (Content) يتطلب نص محتوى أصلي غير فارغ.',
        });
      }
    }

    const isValid = errors.filter((e) => e.severity === 'error').length === 0;

    return {
      ...item,
      record: {
        ...item.record,
        recordPurpose: currentPurpose,
      },
      isValid,
      errors,
      warnings,
    };
  });

  const handleSetAllPurpose = (purpose: 'marketing_content' | 'marketing_reference') => {
    if (!previewData) return;
    const updated: Record<number, 'marketing_content' | 'marketing_reference'> = {};
    previewData.previewRecords.forEach((r) => {
      updated[r.index] = purpose;
    });
    setPurposeOverrides(updated);
  };

  const handleResetPurposeOverrides = () => {
    setPurposeOverrides({});
  };

  // Filter preview records for active tab
  const filteredPreview = processedPreviewRecords.filter((item) => {
    if (activeTab === 'valid') return item.isValid;
    if (activeTab === 'invalid') return !item.isValid;
    if (activeTab === 'duplicates') return Boolean(item.duplicateMatch);
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Instructions */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-zinc-900 flex items-center gap-2">
            <UploadCloud size={20} className="text-zinc-800" />
            <span>استيراد وفحص مجموعات البيانات (Two-Phase Dataset Import)</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            عملية ثنائية المرحلة تضمن فحص وتدقيق كل صف والتأكد من سلامة التشفير ومطابقة الحقول قبل الحفظ الفعلي.
          </p>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={handleResetImport}
            className="px-3.5 py-1.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>ملف جديد</span>
          </button>
        )}
      </div>

      {/* Validation / Global Error Banner */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">خطأ في عملية الاستيراد:</div>
            <div>{validationError}</div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION RESULT */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 md:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-emerald-900">
              تم تثبيت واستيراد البيانات في قاعدة البيانات بنجاح!
            </h4>
            <p className="text-xs text-emerald-800 max-w-lg mx-auto">
              {importResult.message}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2 text-right">
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-zinc-500">السجلات المكتشفة</div>
              <div className="text-base font-bold text-zinc-900 font-mono">{importResult.totalDetected}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-emerald-700">سجلات أُضيفت حديثاً</div>
              <div className="text-base font-bold text-emerald-800 font-mono">{importResult.insertedCount}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-amber-700">تكرارات تم تخطيها</div>
              <div className="text-base font-bold text-amber-800 font-mono">{importResult.skippedDuplicatesCount}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-zinc-500">إجمالي السجلات الحالية</div>
              <div className="text-base font-bold text-zinc-900 font-mono">{importResult.totalInDatabase}</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetImport}
              className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition cursor-pointer"
            >
              استيراد ملف إضافي ←
            </button>
          </div>
        </div>
      )}

      {/* DROPZONE / FILE SELECTOR (If no file selected or want to pick) */}
      {!selectedFile && !importResult && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl p-8 md:p-12 text-center space-y-4 cursor-pointer transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.jsonl,.ndjson,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
            <UploadCloud size={28} />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm md:text-base font-bold text-zinc-900">
              اختر ملف مجموعة البيانات لرفعه وفحصه
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              ندعم صيغ <strong>CSV</strong>، <strong>JSONL</strong>، وأرشيف <strong>ZIP</strong> الذي يحتوي على ملفات مدعومة. ندعم اللغة العربية بتشفير UTF-8 التام.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-400">
            <span className="px-2.5 py-1 rounded bg-zinc-100 font-mono">.csv</span>
            <span className="px-2.5 py-1 rounded bg-zinc-100 font-mono">.jsonl</span>
            <span className="px-2.5 py-1 rounded bg-zinc-100 font-mono">.zip (مع فحص الحماية)</span>
          </div>
        </div>
      )}

      {/* LOADING SPINNER */}
      {isValidating && (
        <div className="p-12 text-center space-y-3 bg-white border border-zinc-200 rounded-2xl">
          <div className="inline-block w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-zinc-700">
            جارٍ فحص ومعاينة السجلات، مطابقة الأعمدة، والتحقق من التكرارات...
          </div>
        </div>
      )}

      {/* PHASE A: PREVIEW AND VALIDATION RESULTS */}
      {previewData && !isValidating && !importResult && (
        <div className="space-y-5">
          {/* File Summary Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                {previewData.fileFormat === 'zip' ? (
                  <Archive size={20} className="text-amber-600" />
                ) : (
                  <FileText size={20} className="text-blue-600" />
                )}
                <div>
                  <div className="font-bold text-xs md:text-sm text-zinc-900">
                    {previewData.fileName}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    صيغة {previewData.fileFormat.toUpperCase()} • {previewData.detectedFields.length} أعمدة مكتشفة
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMappingPanel(!showMappingPanel)}
                  className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal size={13} />
                  <span>تخصيص مطابقة الحقول ({Object.keys(customMappings).length})</span>
                </button>

                {previewData.allValidationIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>تقرير الأخطاء ({previewData.allValidationIssues.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div className="text-[11px] text-zinc-500">إجمالي الصفوف</div>
                <div className="text-lg font-bold text-zinc-900 font-mono">
                  {previewData.totalDetected}
                </div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-800">صفوف صالحة للاستيراد</div>
                <div className="text-lg font-bold text-emerald-800 font-mono">
                  {previewData.validCount}
                </div>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                <div className="text-[11px] text-rose-800">صفوف غير صالحة</div>
                <div className="text-lg font-bold text-rose-800 font-mono">
                  {previewData.invalidCount}
                </div>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <div className="text-[11px] text-amber-800">تكرارات محددة</div>
                <div className="text-lg font-bold text-amber-800 font-mono">
                  {previewData.duplicateCount + previewData.potentialMatchCount}
                </div>
              </div>
            </div>

            {/* ZIP Archive Content Checklist if applicable */}
            {previewData.archiveFilesFound && previewData.archiveFilesFound.length > 0 && (
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                  <span>الملفات الموجودة داخل أرشيف ZIP المضغوط:</span>
                  <span className="text-[11px] text-zinc-500 font-normal">
                    يمكنك تحديد أو استبعاد أي ملف قبل الفحص
                  </span>
                </div>
                <div className="space-y-1.5">
                  {previewData.archiveFilesFound.map((f, i) => (
                    <label
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-white border border-zinc-200 text-xs cursor-pointer hover:bg-zinc-50"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFilesInZip.includes(f.name)}
                          onChange={() => handleToggleZipFile(f.name)}
                          disabled={!f.validType}
                          className="rounded text-zinc-900"
                        />
                        <span className={`font-mono text-[11px] ${!f.validType ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                          {f.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {Math.round(f.size / 1024)} كيلوبايت • {f.validType ? f.format.toUpperCase() : 'غير مدعوم'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Required Fields Alert */}
            {previewData.missingRequiredFields.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <strong>تنبيه نقص حقول إلزامية:</strong> لم يتم العثور على عمود {previewData.missingRequiredFields.join(', ')}. يرجى استخدام تخصيص مطابقة الحقول أدناه لربط العمود الصحيح.
                </div>
              </div>
            )}

            {/* Unknown Fields Mapping Panel */}
            {showMappingPanel && (
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3 text-xs">
                <div className="font-bold text-zinc-900">
                  ربط وتخصيص مطابقة أعمدة الملف (Field Mapping):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {previewData.detectedFields.map((field) => (
                    <div
                      key={field}
                      className="p-2.5 bg-white rounded-lg border border-zinc-200 flex items-center justify-between gap-2"
                    >
                      <span className="font-mono text-zinc-700 truncate">{field}</span>
                      <select
                        value={customMappings[field] || ''}
                        onChange={(e) => handleMapField(field, e.target.value)}
                        className="text-xs bg-zinc-50 border border-zinc-300 rounded px-2 py-1"
                      >
                        <option value="">مطابقة تلقائية (Auto)</option>
                        <option value="content">المحتوى الأصلي (content / content_text)</option>
                        <option value="contentSummary">ملخص المحتوى / نبذة الفكرة (content_summary)</option>
                        <option value="recordPurpose">نوع السجل / الغرض (record_purpose)</option>
                        <option value="brandName">اسم البراند (brandName)</option>
                        <option value="country">الدولة / السوق (country)</option>
                        <option value="dialect">اللهجة (dialect)</option>
                        <option value="industry">الصناعة (industry)</option>
                        <option value="contentType">نوع المحتوى (contentType)</option>
                        <option value="marketingObjective">الهدف التسويقي (marketingObjective)</option>
                        <option value="sourceUrl">رابط المصدر (sourceUrl)</option>
                        <option value="sourceId">معرف المصدر (sourceId)</option>
                        <option value="marketTier">تصنيف السوق (marketTier)</option>
                        <option value="licenseStatus">الترخيص (licenseStatus)</option>
                        <option value="ignore">تجاهل هذا العمود (Ignore)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Table Tabs & Actions */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50">
              <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  جميع المعاينات ({processedPreviewRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('valid')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'valid'
                      ? 'bg-emerald-700 text-white'
                      : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  الصالحة فقط ({processedPreviewRecords.filter((r) => r.isValid).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invalid')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'invalid'
                      ? 'bg-rose-700 text-white'
                      : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  غير الصالحة ({processedPreviewRecords.filter((r) => !r.isValid).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('duplicates')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'duplicates'
                      ? 'bg-amber-700 text-white'
                      : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  التكرارات المحتملة ({processedPreviewRecords.filter((r) => r.duplicateMatch).length})
                </button>
              </div>

              {/* Bulk Record Purpose Adjustment Controls */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-[11px] text-zinc-500 font-medium">تعديل الغرض للعينة:</span>
                <button
                  type="button"
                  onClick={() => handleSetAllPurpose('marketing_reference')}
                  className="px-2.5 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                  title="تعيين كافة سجلات العينة كـ مراجع تسويقية (تجاوز شرط المحتوى الكامل إذا وجد ملخص ومصدر)"
                >
                  📚 الكل مراجع (References)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllPurpose('marketing_content')}
                  className="px-2.5 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                  title="تعيين كافة سجلات العينة كـ محتوى تسويقي أصلي"
                >
                  ✍️ الكل محتوى (Content)
                </button>
                {Object.keys(purposeOverrides).length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetPurposeOverrides}
                    className="px-2 py-1 text-zinc-500 hover:text-zinc-800 text-[11px] underline cursor-pointer"
                  >
                    استعادة الاستنتاج
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px]">
                  <tr>
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">حالة السجل</th>
                    <th className="p-3 min-w-[150px]">نوع السجل (Purpose)</th>
                    <th className="p-3 max-w-[280px]">المحتوى / الملخص</th>
                    <th className="p-3">السوق / اللهجة</th>
                    <th className="p-3">الصناعة / القالب</th>
                    <th className="p-3">المصدر / الترخيص</th>
                    <th className="p-3">الملاحظات والأخطاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPreview.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                        لا توجد سجلات تطابق الفلتر المحدد في العينة المعاينة.
                      </td>
                    </tr>
                  ) : (
                    filteredPreview.map((item) => (
                      <tr
                        key={item.index}
                        className={`hover:bg-zinc-50/60 transition ${
                          !item.isValid ? 'bg-rose-50/20' : item.duplicateMatch ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="p-3 font-mono text-zinc-400 text-[11px]">{item.index}</td>
                        <td className="p-3 whitespace-nowrap">
                          {item.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                              <CheckCircle2 size={12} />
                              صالح
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200">
                              <XCircle size={12} />
                              غير صالح
                            </span>
                          )}
                          {item.duplicateMatch && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                                مكرر ({item.duplicateMatch.matchType})
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <select
                              value={item.record.recordPurpose}
                              onChange={(e) => {
                                const val = e.target.value as 'marketing_content' | 'marketing_reference';
                                setPurposeOverrides((prev) => ({ ...prev, [item.index]: val }));
                              }}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition ${
                                item.record.recordPurpose === 'marketing_reference'
                                  ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                                  : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
                              }`}
                            >
                              <option value="marketing_content">✍️ محتوى تسويقي</option>
                              <option value="marketing_reference">📚 مرجع تسويقي</option>
                            </select>
                            {purposeOverrides[item.index] && (
                              <div className="text-[10px] text-zinc-400 font-medium">معدّل يدوياً</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-zinc-800 leading-relaxed max-w-[300px]">
                          {item.record.recordPurpose === 'marketing_reference' ? (
                            <div>
                              <div className="text-[10px] text-purple-800 font-bold mb-0.5">الملخص المرجعي:</div>
                              <div className="line-clamp-2 text-zinc-700">
                                {item.record.contentSummary || (
                                  <span className="text-rose-600 italic">ملخص مفقود</span>
                                )}
                              </div>
                              {item.record.content && (
                                <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                                  نص متاح: {item.record.content}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="line-clamp-2">
                                {item.record.content || (
                                  <span className="text-rose-600 italic">محتوى فارغ</span>
                                )}
                              </div>
                            </div>
                          )}
                          {item.record.brandName && (
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                              البراند: {item.record.brandName}
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-zinc-600 text-[11px]">
                          <div>{item.record.country || 'غير محدد'}</div>
                          <div className="text-zinc-400 text-[10px]">{item.record.dialect || 'لهجة غير محددة'}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-zinc-600 text-[11px]">
                          <div>{item.record.industry || 'غير محدد'}</div>
                          <div className="text-zinc-400 text-[10px]">{item.record.contentType || 'قالب غير محدد'}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-zinc-600 text-[11px]">
                          <div>{item.record.sourceUrl ? 'رابط متوفر' : 'بدون رابط'}</div>
                          <div className="text-zinc-400 text-[10px]">
                            {item.record.licenseStatus === 'reuse_permitted'
                              ? 'مرخص للاستخدام'
                              : 'غير مصرح أو قيد التحقق'}
                          </div>
                        </td>
                        <td className="p-3 text-xs">
                          {item.errors.map((err, eIdx) => (
                            <div key={eIdx} className="text-rose-700 text-[11px] font-medium">
                              • {err.message}
                            </div>
                          ))}
                          {item.warnings.map((warn, wIdx) => (
                            <div key={wIdx} className="text-amber-800 text-[10px]">
                              • {warn.message}
                            </div>
                          ))}
                          {item.errors.length === 0 && item.warnings.length === 0 && (
                            <span className="text-zinc-400 text-[11px]">لا توجد ملاحظات</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PHASE B CONFIRMATION ACTION BOX */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-700" />
                <span>المرحلة ب: مراجعة خيارات الاستيراد وتأكيد الحفظ (Confirm Import)</span>
              </h4>
              <p className="text-xs text-zinc-500">
                حدد سياسة التعامل مع السجلات المكررة والصفوف غير الصالحة، ثم اضغط على زر التأكيد لحفظ البيانات فعلياً في قاعدة البيانات.
              </p>
            </div>

            {/* Options Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-zinc-900 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-900">تخطي السجلات المكررة تلقائياً (موصى به)</div>
                  <div className="text-zinc-500 text-[11px]">
                    منع تكرار السجلات التي تطابق بصمة المحتوى أو معرف المصدر لسجلات موجودة بالفعل.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeInvalid}
                  onChange={(e) => setExcludeInvalid(e.target.checked)}
                  className="rounded text-zinc-900 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-900">استبعاد الصفوف غير الصالحة فقط واستيراد الصالحة</div>
                  <div className="text-zinc-500 text-[11px]">
                    عدم رفض كامل الملف إذا كانت بعض الصفوف فقط معيبة (يمكنك تحميل تقرير الأخطاء لمراجعتها).
                  </div>
                </div>
              </label>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
              <div className="text-xs text-zinc-500">
                جاهز لاستيراد <strong>{excludeInvalid ? processedPreviewRecords.filter((r) => r.isValid).length : processedPreviewRecords.length}</strong> سجلاً
                {skipDuplicates && previewData.duplicateCount > 0 && ` (مع تخطي ${previewData.duplicateCount} مكرر)`}.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetImport}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isConfirming || (excludeInvalid && processedPreviewRecords.filter((r) => r.isValid).length === 0)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ التثبيت في قاعدة البيانات...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>تأكيد الاستيراد والحفظ الفعلي (Confirm Import)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
