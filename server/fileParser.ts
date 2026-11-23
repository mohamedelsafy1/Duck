import JSZip from 'jszip';
import {
  MarketingDatasetRecord,
  ValidationIssue,
  PreviewRecordItem,
  ImportPreviewResponse,
  DuplicateMatchInfo,
  MarketTier,
  LicenseStatus,
  SourceVerificationStatus,
} from '../src/types.ts';
import {
  computeFingerprint,
  getAllDatasetRecords,
  checkDuplicate,
} from './datasetStore.ts';

// Limits for safety
const MAX_ARCHIVE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_UNCOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_RECORD_COUNT = 10000;

// Standard Arabic & English Column Aliases
const FIELD_ALIASES: Record<string, string[]> = {
  content: [
    'content',
    'content_text',
    'contenttext',
    'text',
    'المحتوى',
    'نص_المحتوى',
    'نص المحتوى',
    'النص',
    'post',
    'body',
    'copy',
    'copy_text',
    'caption',
    'منشور',
    'كابشن',
    'نص_المنشور',
    'نص المنشور',
    'نص_الإعلان',
    'نص الإعلان',
    'original_content',
    'originalcontent',
  ],
  contentSummary: [
    'contentsummary',
    'content_summary',
    'summary',
    'ملخص',
    'ملخص_المحتوى',
    'ملخص المحتوى',
    'نبذة',
    'نظرة_عامة',
    'نظرة عامة',
    'overview',
    'description',
    'الوصف',
    'شرح',
    'تفاصيل_الفكرة',
    'case_summary',
  ],
  recordPurpose: [
    'recordpurpose',
    'record_purpose',
    'purpose',
    'recordtype',
    'record_type',
    'type_of_record',
    'نوع_السجل',
    'نوع السجل',
    'الغرض',
    'تصنيف_السجل',
    'طبيعة_السجل',
    'role',
  ],
  brandName: ['brand', 'brandname', 'brand_name', 'اسم البراند', 'الماركة', 'العلامة التجارية', 'براند'],
  country: ['country', 'market', 'الدولة', 'السوق', 'البلد', 'الدولة المستهدفة'],
  dialect: ['dialect', 'اللهجة', 'اللهجة واللغة', 'languagedialect', 'language_dialect'],
  industry: ['industry', 'sector', 'category', 'المجال', 'الصناعة', 'القطاع', 'مجال العمل'],
  contentType: ['contenttype', 'content_type', 'type', 'format', 'نوع المحتوى', 'القالب', 'صيغة المحتوى'],
  marketingObjective: ['marketingobjective', 'marketing_objective', 'objective', 'goal', 'الهدف التسويقي', 'الهدف'],
  sourceUrl: ['sourceurl', 'source_url', 'url', 'link', 'رابط المصدر', 'الرابط', 'رابط المنشور', 'source'],
  sourceId: ['sourceid', 'source_id', 'id', 'معرف المصدر', 'الكود', 'كود المصدر', 'ref_id'],
  sourcePlatform: ['sourceplatform', 'source_platform', 'platform', 'المنصة', 'الناشر', 'شبكة التواصل'],
  sourceTitle: ['sourcetitle', 'source_title', 'title', 'عنوان المصدر', 'اسم الحملة', 'عنوان الحملة', 'campaign_title'],
  licenseStatus: ['licensestatus', 'license_status', 'license', 'الترخيص', 'حقوق الاستخدام', 'حالة الترخيص'],
  publicationDate: ['publicationdate', 'publication_date', 'date', 'تاريخ النشر', 'التاريخ'],
  marketTier: ['markettier', 'market_tier', 'tier', 'تصنيف السوق', 'الفئة', 'فئة السوق'],
};

// Normalize header key for alias matching
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s\-_]+/g, '');
}

// Find matched canonical field from alias
export function matchCanonicalField(header: string): string | null {
  const norm = normalizeKey(header);
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => normalizeKey(a) === norm)) {
      return canonical;
    }
  }
  return null;
}

// Robust CSV Line Splitter (handling quotes, commas, multiline)
export function parseCSV(csvText: string): Record<string, string>[] {
  const cleanText = csvText.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if pending
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const results: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const rowValues = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const headerName = headers[c] || `field_${c + 1}`;
      obj[headerName] = rowValues[c] !== undefined ? rowValues[c] : '';
    }
    results.push(obj);
  }

  return results;
}

// Parse JSONL (line by line)
export function parseJSONL(jsonlText: string): { records: Record<string, any>[]; errors: ValidationIssue[] } {
  const cleanText = jsonlText.replace(/^\uFEFF/, '');
  const lines = cleanText.split('\n');
  const records: Record<string, any>[] = [];
  const errors: ValidationIssue[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) continue;
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        records.push(parsed);
      } else {
        errors.push({
          rowIndex: idx + 1,
          severity: 'error',
          message: 'يجب أن يكون كل سطر في ملف JSONL كائناً (Object) صالحاً وليس مصفوفة أو قيمة مفردة.',
        });
      }
    } catch (e: any) {
      errors.push({
        rowIndex: idx + 1,
        severity: 'error',
        message: `خطأ في صياغة JSON في السطر ${idx + 1}: ${e?.message || 'تنسيق غير صالح'}`,
      });
    }
  }

  return { records, errors };
}

// Calculate Data Quality Score
export function evaluateQuality(rec: Partial<MarketingDatasetRecord>): number {
  let score = 40;

  if (rec.recordPurpose === 'marketing_reference') {
    // Reference record scoring: evaluated on summary clarity and source traceability
    if (rec.contentSummary && rec.contentSummary.trim().length >= 20) {
      score += 20;
      if (rec.contentSummary.trim().length >= 80) score += 10;
    }
    if (rec.sourceUrl && rec.sourceUrl.trim().startsWith('http')) {
      score += 15;
    } else if (rec.sourceId || rec.sourcePlatform) {
      score += 10;
    }
  } else {
    // Marketing content record scoring: evaluated on raw copy depth and source
    if (rec.content && rec.content.trim().length >= 20) {
      score += 20;
      if (rec.content.trim().length >= 80) score += 10;
    }
    if (rec.sourceUrl && rec.sourceUrl.trim().startsWith('http')) {
      score += 15;
    } else if (rec.sourceId) {
      score += 5;
    }
  }

  if (rec.country && rec.country.trim() !== '') score += 5;
  if (rec.dialect && rec.dialect.trim() !== '') score += 5;
  if (rec.industry && rec.industry.trim() !== '') score += 5;

  if (rec.licenseStatus === 'reuse_permitted' || rec.licenseStatus === 'public_domain') {
    score += 10;
  } else if (rec.licenseStatus === 'restricted' || rec.licenseStatus === 'unknown') {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

// Inspect ZIP Archive and extract safe supported CSV / JSONL files
export async function inspectAndExtractZip(
  zipBuffer: Buffer,
  selectedFilesToExtract?: string[]
): Promise<{
  filesFound: { name: string; size: number; format: string; selected: boolean; validType: boolean }[];
  combinedRawRows: { fileName: string; row: Record<string, any>; originalLine: number }[];
  issues: ValidationIssue[];
}> {
  if (zipBuffer.length > MAX_ARCHIVE_SIZE_BYTES) {
    throw new Error(`حجم ملف الأرشيف المضغوط يتجاوز الحد الأقصى المسموح به (${MAX_ARCHIVE_SIZE_BYTES / 1024 / 1024} ميجابايت).`);
  }

  const zip = await JSZip.loadAsync(zipBuffer);
  const filesFound: { name: string; size: number; format: string; selected: boolean; validType: boolean }[] = [];
  const combinedRawRows: { fileName: string; row: Record<string, any>; originalLine: number }[] = [];
  const issues: ValidationIssue[] = [];

  let totalUncompressedSize = 0;

  // 1. Inspect all entries first before extracting any content
  for (const [filename, fileEntry] of Object.entries(zip.files)) {
    if (fileEntry.dir) continue;

    // Reject path traversal and dangerous extensions
    if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
      issues.push({
        rowIndex: 0,
        field: filename,
        severity: 'error',
        message: `تم رفض الملف "${filename}" بسبب مسار غير آمن (Path Traversal Attempt).`,
      });
      continue;
    }

    const lower = filename.toLowerCase();
    const isCsv = lower.endsWith('.csv');
    const isJsonl = lower.endsWith('.jsonl') || lower.endsWith('.ndjson');
    const isValidType = isCsv || isJsonl;

    // Check suspicious executable extensions
    if (/\.(exe|sh|bat|cmd|vbs|jar|py|php|rb|msi|bin)$/i.test(lower)) {
      issues.push({
        rowIndex: 0,
        field: filename,
        severity: 'error',
        message: `تم حظر ملف تنفيذي مشبوه داخل الأرشيف: ${filename}`,
      });
      continue;
    }

    const uncompressedSize = (fileEntry as any)._data?.uncompressedSize || 0;
    totalUncompressedSize += uncompressedSize;

    if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE_BYTES) {
      throw new Error(`الحجم الإجمالي للملفات بعد فك الضغط يتجاوز الحد المسموح به (${MAX_UNCOMPRESSED_SIZE_BYTES / 1024 / 1024} ميجابايت).`);
    }

    const isSelected = selectedFilesToExtract ? selectedFilesToExtract.includes(filename) : isValidType;

    filesFound.push({
      name: filename,
      size: uncompressedSize,
      format: isCsv ? 'csv' : isJsonl ? 'jsonl' : 'unsupported',
      selected: isSelected,
      validType: isValidType,
    });
  }

  // 2. Extract only selected valid files
  for (const item of filesFound) {
    if (!item.selected || !item.validType) {
      if (!item.validType) {
        issues.push({
          rowIndex: 0,
          field: item.name,
          severity: 'warning',
          message: `الملف "${item.name}" ليس بصيغة CSV أو JSONL وتم استبعاده من المعالجة.`,
        });
      }
      continue;
    }

    const entry = zip.file(item.name);
    if (!entry) continue;

    const contentText = await entry.async('string');

    if (item.format === 'csv') {
      const parsedRows = parseCSV(contentText);
      parsedRows.forEach((r, idx) => {
        combinedRawRows.push({
          fileName: item.name,
          row: r,
          originalLine: idx + 2,
        });
      });
    } else if (item.format === 'jsonl') {
      const { records, errors } = parseJSONL(contentText);
      errors.forEach((err) => {
        issues.push({
          ...err,
          field: `${item.name}:${err.rowIndex}`,
        });
      });
      records.forEach((r, idx) => {
        combinedRawRows.push({
          fileName: item.name,
          row: r,
          originalLine: idx + 1,
        });
      });
    }
  }

  return { filesFound, combinedRawRows, issues };
}

// Helper to detect empty or placeholder text
export function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const s = text.trim().toLowerCase();
  return (
    s === '' ||
    s === 'n/a' ||
    s === 'na' ||
    s === 'none' ||
    s === 'null' ||
    s === 'undefined' ||
    s === '-' ||
    s === '--' ||
    s === 'test' ||
    s === 'تجربة' ||
    s === 'لا يوجد' ||
    s === 'فارغ' ||
    s === 'empty' ||
    s === '.'
  );
}

// Normalize record purpose string
export function normalizeRecordPurpose(val?: string | null): 'marketing_content' | 'marketing_reference' | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();
  if (
    s.includes('ref') ||
    s.includes('مرجع') ||
    s.includes('دراسة') ||
    s.includes('reference') ||
    s.includes('case') ||
    s.includes('استراتيجي')
  ) {
    return 'marketing_reference';
  }
  if (
    s.includes('content') ||
    s.includes('محتوى') ||
    s.includes('نص') ||
    s.includes('منشور') ||
    s.includes('copy') ||
    s.includes('post')
  ) {
    return 'marketing_content';
  }
  return null;
}

// Map raw record fields to canonical schema
export function mapRawRecordToCanonical(
  raw: Record<string, any>,
  customFieldMappings: Record<string, string> = {}
): {
  record: Partial<MarketingDatasetRecord>;
  unmappedFields: string[];
} {
  const mapped: Partial<MarketingDatasetRecord> = {
    language: 'ar',
    sourceVerificationStatus: 'unverified',
    licenseStatus: 'unknown',
    humanReviewStatus: 'pending',
    marketTier: 'Unassigned',
  };

  const unmapped: string[] = [];

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;
    const strVal = typeof value === 'string' ? value.trim() : String(value);

    // 1. Check custom user mappings first
    if (customFieldMappings[key]) {
      const target = customFieldMappings[key];
      if (target === 'recordPurpose') {
        mapped.recordPurpose = normalizeRecordPurpose(strVal) || (strVal as any);
      } else {
        (mapped as any)[target] = strVal;
      }
      continue;
    }

    // 2. Check canonical alias matching
    const canonicalKey = matchCanonicalField(key);
    if (canonicalKey) {
      if (canonicalKey === 'recordPurpose') {
        mapped.recordPurpose = normalizeRecordPurpose(strVal) || undefined;
      } else if (canonicalKey === 'contentSummary') {
        mapped.contentSummary = strVal;
      } else if (canonicalKey === 'marketTier') {
        const valUpper = strVal.toUpperCase();
        if (valUpper.includes('A')) mapped.marketTier = 'Tier A';
        else if (valUpper.includes('B')) mapped.marketTier = 'Tier B';
        else if (valUpper.includes('C')) mapped.marketTier = 'Tier C';
        else mapped.marketTier = 'Unassigned';
      } else if (canonicalKey === 'licenseStatus') {
        const lower = strVal.toLowerCase();
        if (lower.includes('permit') || lower.includes('مسموح') || lower.includes('reuse')) {
          mapped.licenseStatus = 'reuse_permitted';
        } else if (lower.includes('public') || lower.includes('عام')) {
          mapped.licenseStatus = 'public_domain';
        } else if (lower.includes('restrict') || lower.includes('مقيد') || lower.includes('حظر')) {
          mapped.licenseStatus = 'restricted';
        } else if (lower.includes('request') || lower.includes('مطلوب')) {
          mapped.licenseStatus = 'permission_required';
        } else {
          mapped.licenseStatus = 'pending_verification';
        }
      } else {
        (mapped as any)[canonicalKey] = strVal;
      }
    } else {
      unmapped.push(key);
    }
  }

  // Preserve raw record for auditability
  mapped.rawRecord = raw;

  return { record: mapped, unmappedFields: unmapped };
}

// Process and Validate Preview (Phase A)
export function processImportValidation(
  rawRows: Record<string, any>[],
  fileName: string,
  fileFormat: 'csv' | 'jsonl' | 'zip',
  customMappings: Record<string, string> = {},
  existingIssues: ValidationIssue[] = [],
  archiveFilesFound?: { name: string; size: number; format: string; selected: boolean; validType: boolean }[]
): ImportPreviewResponse {
  const existingRecords = getAllDatasetRecords();
  const allValidationIssues: ValidationIssue[] = [...existingIssues];
  const previewRecords: PreviewRecordItem[] = [];

  const detectedFieldsSet = new Set<string>();
  const unknownFieldsSet = new Set<string>();
  const suggestedFieldMappings: Record<string, string> = {};

  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let potentialMatchCount = 0;

  const totalDetected = rawRows.length;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const raw = rawRows[idx];
    const rowNum = idx + 1;

    Object.keys(raw).forEach((k) => detectedFieldsSet.add(k));

    const { record, unmappedFields } = mapRawRecordToCanonical(raw, customMappings);
    unmappedFields.forEach((f) => unknownFieldsSet.add(f));

    const rowErrors: ValidationIssue[] = [];
    const rowWarnings: ValidationIssue[] = [];

    // 1. Detect and resolve Record Purpose
    const hasMeaningfulContent = Boolean(
      record.content &&
      typeof record.content === 'string' &&
      record.content.trim().length >= 5 &&
      !isPlaceholderText(record.content)
    );

    const hasMeaningfulSummary = Boolean(
      record.contentSummary &&
      typeof record.contentSummary === 'string' &&
      record.contentSummary.trim().length >= 5 &&
      !isPlaceholderText(record.contentSummary)
    );

    const hasTraceableSource = Boolean(
      (record.sourceUrl && record.sourceUrl.trim().length > 3) ||
      (record.sourceId && record.sourceId.trim().length > 0) ||
      (record.sourcePlatform && record.sourcePlatform.trim().length > 0)
    );

    let resolvedPurpose: 'marketing_content' | 'marketing_reference';
    if (record.recordPurpose) {
      resolvedPurpose = record.recordPurpose;
    } else {
      // Inferred purpose rule:
      if (hasMeaningfulContent) {
        resolvedPurpose = 'marketing_content';
      } else if (hasMeaningfulSummary && hasTraceableSource) {
        resolvedPurpose = 'marketing_reference';
      } else {
        // Default to marketing_content (which will fail validation cleanly)
        resolvedPurpose = 'marketing_content';
      }
    }
    record.recordPurpose = resolvedPurpose;

    // 2. Validate based on resolved purpose
    if (resolvedPurpose === 'marketing_content') {
      if (!hasMeaningfulContent) {
        const issue: ValidationIssue = {
          rowIndex: rowNum,
          field: 'content',
          severity: 'error',
          message: 'حقل المحتوى التسويقي الأصلي (content / content_text) فارغ أو يحتوي على نص غير صالح أو نص مؤقت. وهو إلزامي لسجلات المحتوى القابلة لإعادة الاستخدام.',
          sampleValue: record.content,
        };
        rowErrors.push(issue);
        allValidationIssues.push(issue);
      }

      if (!hasTraceableSource) {
        const issue: ValidationIssue = {
          rowIndex: rowNum,
          field: 'sourceUrl',
          severity: 'warning',
          message: 'لا يوجد رابط مصدر أو معرف مرجعي للسجل. سيتم تصنيف المصدر كـ "غير موثق" (Unverified).',
        };
        rowWarnings.push(issue);
        allValidationIssues.push(issue);
        record.sourceVerificationStatus = 'unverified';
      }
    } else {
      // marketing_reference: content can be empty, but requires content_summary and traceable source
      if (!hasMeaningfulSummary) {
        const issue: ValidationIssue = {
          rowIndex: rowNum,
          field: 'contentSummary',
          severity: 'error',
          message: 'سجل المرجع التسويقي (marketing_reference) يتطلب وجود ملخص وافٍ للمحتوى (content_summary) يوضح تفاصيل الفكرة أو الحملة المرجعية.',
          sampleValue: record.contentSummary,
        };
        rowErrors.push(issue);
        allValidationIssues.push(issue);
      }

      if (!hasTraceableSource) {
        const issue: ValidationIssue = {
          rowIndex: rowNum,
          field: 'sourceUrl',
          severity: 'error',
          message: 'سجل المرجع التسويقي يتطلب توثيق مصدر واضح وقابل للتتبع (رابط source_url أو معرف source_id أو منصة النشر) لضمان مصداقية المرجع.',
          sampleValue: record.sourceUrl || record.sourceId || record.sourcePlatform,
        };
        rowErrors.push(issue);
        allValidationIssues.push(issue);
      }
    }

    // Fingerprint calculation (differentiates content vs reference)
    if (resolvedPurpose === 'marketing_reference') {
      const fpText = (record.content && record.content.trim()) ||
        `${record.contentSummary?.trim() || ''}::${record.sourceUrl || record.sourceId || record.sourcePlatform || ''}`;
      record.contentFingerprint = computeFingerprint(fpText);
    } else {
      record.contentFingerprint = record.content ? computeFingerprint(record.content) : '';
    }

    // Duplicate Detection against existing DB records
    let duplicateMatch: DuplicateMatchInfo | null = null;
    const testContent = record.content || record.contentSummary || '';
    if (testContent || record.sourceId || record.sourceUrl) {
      duplicateMatch = checkDuplicate(
        {
          content: testContent,
          sourceId: record.sourceId,
          sourceUrl: record.sourceUrl,
        },
        existingRecords
      );

      if (duplicateMatch) {
        if (duplicateMatch.matchType === 'exact') duplicateCount++;
        else potentialMatchCount++;

        rowWarnings.push({
          rowIndex: rowNum,
          field: duplicateMatch.matchedBy,
          severity: 'warning',
          message: `تطابق مكرر (${duplicateMatch.matchType === 'exact' ? 'تطابق تام' : 'تطابق محتمل'}) مع السجل ${duplicateMatch.matchedRecordId} عبر ${duplicateMatch.matchedBy}.`,
        });
      }
    }

    record.dataQualityScore = evaluateQuality(record);
    record.humanReviewStatus = 'pending'; // Always starts unapproved

    const isValid = rowErrors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    // Add to preview table (up to 100 representative items for table performance)
    if (idx < 100) {
      previewRecords.push({
        index: rowNum,
        record,
        isValid,
        errors: rowErrors,
        warnings: rowWarnings,
        duplicateMatch,
      });
    }
  }

  // Calculate missing required fields
  const missingRequiredFields: string[] = [];
  const hasContentField = Array.from(detectedFieldsSet).some((h) => matchCanonicalField(h) === 'content');
  const hasSummaryField = Array.from(detectedFieldsSet).some((h) => matchCanonicalField(h) === 'contentSummary');
  const hasMappedContent = Object.values(customMappings).includes('content') || Object.values(customMappings).includes('contentSummary');

  if (!hasContentField && !hasSummaryField && !hasMappedContent) {
    missingRequiredFields.push('content أو content_summary (المحتوى أو ملخص المرجع)');
  }

  // Populate suggested field mappings for unknown fields
  Array.from(unknownFieldsSet).forEach((unk) => {
    const matched = matchCanonicalField(unk);
    if (matched) {
      suggestedFieldMappings[unk] = matched;
    }
  });

  return {
    fileName,
    fileFormat,
    totalDetected,
    validCount,
    invalidCount,
    duplicateCount,
    potentialMatchCount,
    detectedFields: Array.from(detectedFieldsSet),
    missingRequiredFields,
    unknownFields: Array.from(unknownFieldsSet),
    suggestedFieldMappings,
    previewRecords,
    allValidationIssues,
    archiveFilesFound,
  };
}
