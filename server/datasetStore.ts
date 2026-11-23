import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  MarketingDatasetRecord,
  ImportBatchRecord,
  DatasetStatsResponse,
  DatasetFilterState,
  DuplicateMatchInfo,
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATASET_FILE = path.join(DATA_DIR, 'marketing_datasets.json');
const BATCHES_FILE = path.join(DATA_DIR, 'import_batches.json');

// Ensure data directory exists
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATASET_FILE)) {
    // Seed with realistic high-quality marketing sample records
    const initialRecords: MarketingDatasetRecord[] = [
      {
        id: 'rec-sample-001',
        sourceId: 'SRC-EGY-091',
        sourceUrl: 'https://example.com/campaigns/burger-feast-2026',
        sourcePlatform: 'Instagram & Facebook',
        sourceTitle: 'حملة إطلاق دبل تشيز برجر المعلم',
        batchId: 'batch-initial-seed',
        importedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        contentFingerprint: computeFingerprint('دبل تشيز سايحة مع صوص المعلم السري! اطلب وجبتك دلوقتي قبل نفاذ الكمية واستمتع بخصم 20% مع كود المعلم.'),
        content: 'دبل تشيز سايحة مع صوص المعلم السري! اطلب وجبتك دلوقتي قبل نفاذ الكمية واستمتع بخصم 20% مع كود المعلم. متوفر في كل فروع القاهرة والجيزة والتوصيل لحد باب بيتك في نص ساعة.',
        language: 'ar',
        country: 'مصر',
        dialect: 'مصري عامي شبابي',
        industry: 'مطاعم وأغذية',
        contentType: 'بوست ثابت',
        marketingObjective: 'زيادة المبيعات المباشرة',
        contentPillar: 'العروض والقيمة التنافسية',
        brandName: 'برجر المعلم',
        publicationDate: '2026-02-15',
        sourceVerificationStatus: 'verified',
        licenseStatus: 'reuse_permitted',
        licenseName: 'Internal Marketing License',
        permissionNotes: 'مصرح للاستخدام الداخلي والأمثلة المرجعية',
        dataQualityScore: 95,
        classificationConfidence: 0.96,
        humanReviewStatus: 'approved',
        reviewerNotes: 'محتوى ممتاز بنبرة مصرية واضحة وهوك بيعي قوي',
        rejectionReason: null,
        reviewerId: 'lead_strategist@duckprompts.com',
        reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        marketTier: 'Tier A',
        aiSuggestions: null,
        performanceMetrics: {
          definitions: 'ROAS ومعدل النقر CTR',
          values: { ctr: '3.4%', roas: 4.2, orders: 1240 },
          source: 'Meta Ads Manager',
          observationDate: '2026-02-28',
        },
      },
      {
        id: 'rec-sample-002',
        sourceId: 'SRC-KSA-044',
        sourceUrl: 'https://example.com/cases/riyadh-perfume-luxury',
        sourcePlatform: 'X (Twitter)',
        sourceTitle: 'تدشين عطر سدرة الرياض الفاخر',
        batchId: 'batch-initial-seed',
        importedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        contentFingerprint: computeFingerprint('نفحات من خشب الصندل والعود الكمبودي المعتق تأسر الحواس في ليلة شتوية دافئة. سدرة الرياض: عطر يروي أصل الهيبة.'),
        content: 'نفحات من خشب الصندل والعود الكمبودي المعتق تأسر الحواس في ليلة شتوية دافئة. سدرة الرياض: عطر يروي أصل الهيبة ويترك بصمتك في كل مجلس. متاح الآن في بوتيكات الرياض وجدة مع شحن فاخر لكافة أنحاء المملكة.',
        language: 'ar',
        country: 'السعودية',
        dialect: 'سعودي / خليجي فخم',
        industry: 'عطور ومستحضرات تجميل',
        contentType: 'كاروسيل',
        marketingObjective: 'بناء الوعي والتموضع الفاخر',
        contentPillar: 'هوية البراند والتراث الأصيل',
        brandName: 'سدرة للعود والعطور',
        publicationDate: '2026-01-20',
        sourceVerificationStatus: 'verified',
        licenseStatus: 'reuse_permitted',
        licenseName: 'Brand Archive Agreement',
        permissionNotes: 'مرخص وموثق كأفضل ممارسة لحملات العطور الخليجية',
        dataQualityScore: 98,
        classificationConfidence: 0.98,
        humanReviewStatus: 'approved',
        reviewerNotes: 'صياغة ممتازة ومطابقة للمستهدف الخليجي الراقي',
        rejectionReason: null,
        reviewerId: 'lead_strategist@duckprompts.com',
        reviewedAt: new Date(Date.now() - 86400000).toISOString(),
        marketTier: 'Tier A',
        aiSuggestions: null,
      },
      {
        id: 'rec-sample-003',
        sourceId: 'SRC-UAE-112',
        sourceUrl: 'https://example.com/tech/dubai-fintech-launch',
        sourcePlatform: 'LinkedIn',
        sourceTitle: 'إطلاق تطبيق سداد للشركات الناشئة',
        batchId: 'batch-initial-seed',
        importedAt: new Date(Date.now() - 86400000).toISOString(),
        contentFingerprint: computeFingerprint('إدارة فواتير ومصروفات شركتك لم تكن يوماً بهذه السهولة. وفّر ما يصل إلى 40% من وقت فريقك المحاسبي مع حلول الذكاء الاصطناعي المالية من سداد.'),
        content: 'إدارة فواتير ومصروفات شركتك لم تكن يوماً بهذه السهولة. وفّر ما يصل إلى 40% من وقت فريقك المحاسبي مع حلول الذكاء الاصطناعي المالية من سداد. ابدأ تجربتك المجانية لمدة 30 يوماً واكتشف قوة الأتمتة المالية الحديثة في الإمارات.',
        language: 'ar',
        country: 'الإمارات',
        dialect: 'فصحى معاصرة للأعمال',
        industry: 'تقنية وبرمجيات (B2B SaaS)',
        contentType: 'مقال ومحتوى تحليلي',
        marketingObjective: 'توليد عملاء محتملين (Leads)',
        contentPillar: 'حل المشكلات ودراسات الحالة',
        brandName: 'سداد فينتك (Saddad)',
        publicationDate: '2026-03-01',
        sourceVerificationStatus: 'unverified',
        licenseStatus: 'pending_verification',
        licenseName: null,
        permissionNotes: 'في انتظار التحقق من ترخيص الاستخدام التجاري',
        dataQualityScore: 78,
        classificationConfidence: 0.89,
        humanReviewStatus: 'pending',
        reviewerNotes: 'سجل جديد تم استيراده ويحتاج لمراجعة الترخيص وتحديد الفئة',
        rejectionReason: null,
        reviewerId: null,
        reviewedAt: null,
        marketTier: 'Tier B',
        aiSuggestions: {
          country: { value: 'الإمارات', confidence: 0.92 },
          dialect: { value: 'فصحى معاصرة للأعمال', confidence: 0.95 },
          industry: { value: 'تقنية وبرمجيات (B2B SaaS)', confidence: 0.97 },
          contentType: { value: 'مقال ومحتوى تحليلي', confidence: 0.88 },
          objective: { value: 'توليد عملاء محتملين (Leads)', confidence: 0.91 },
          marketTier: { value: 'Tier B', confidence: 0.85 },
          model: 'gemini-3.8-flash',
          suggestedAt: new Date().toISOString(),
        },
      },
      {
        id: 'rec-sample-004',
        sourceId: 'SRC-EGY-033',
        sourceUrl: null,
        sourcePlatform: 'TikTok',
        sourceTitle: 'سكريبت ريلز ملابس أوفر سايز',
        batchId: 'batch-initial-seed',
        importedAt: new Date().toISOString(),
        contentFingerprint: computeFingerprint('أكبر غلطة بتعملها وإنت بتشتري هودي شتوي! 3 حاجات لازم تركز عليهم عشان اللوك يطلع مظبوط مش مبهوق.'),
        content: 'أكبر غلطة بتعملها وإنت بتشتري هودي شتوي! 3 حاجات لازم تركز عليهم عشان اللوك يطلع مظبوط مش مبهوق: 1- مقاس الكتف الساقط. 2- تقفيل الزعبوط ومسكة الرقبة. 3- وزن القطن (ما يقلش عن 450 جرام). شير مع صاحبك اللي بيلبس خيمة وتابعنا لتفاصيل كولكشن كاريزما الجديد.',
        language: 'ar',
        country: 'مصر',
        dialect: 'مصري عامي شبابي',
        industry: 'أزياء وملابس شبابية',
        contentType: 'سكريبت فيديو',
        marketingObjective: 'تفاعل وبناء جمهور أورجانيك',
        contentPillar: 'محتوى تعليمي ترفيهي (Edutainment)',
        brandName: 'كاريزما ستريت',
        publicationDate: null,
        sourceVerificationStatus: 'unverified',
        licenseStatus: 'unknown',
        licenseName: null,
        permissionNotes: 'المصدر غير محدد برابط مباشر - يحتاج تدقيق المصدر',
        dataQualityScore: 65,
        classificationConfidence: 0.82,
        humanReviewStatus: 'pending',
        reviewerNotes: null,
        rejectionReason: null,
        reviewerId: null,
        reviewedAt: null,
        marketTier: 'Tier C',
        aiSuggestions: null,
      },
    ];
    fs.writeFileSync(DATASET_FILE, JSON.stringify(initialRecords, null, 2), 'utf-8');
  }
  if (!fs.existsSync(BATCHES_FILE)) {
    const initialBatches: ImportBatchRecord[] = [
      {
        id: 'batch-initial-seed',
        fileName: 'seed_verified_marketing_records.jsonl',
        fileFormat: 'jsonl',
        importedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        importedBy: 'system_initializer',
        totalDetected: 4,
        insertedCount: 4,
        skippedDuplicatesCount: 0,
        invalidCount: 0,
        failedCount: 0,
        status: 'completed',
        notes: 'دفعة البيانات المرجعية الأولية المعتمدة للمنصة',
      },
    ];
    fs.writeFileSync(BATCHES_FILE, JSON.stringify(initialBatches, null, 2), 'utf-8');
  }
}

// Deterministic content fingerprint (SHA-256 of normalized whitespace text)
export function computeFingerprint(text: string): string {
  if (!text) return '';
  const normalized = text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

// Conservative URL normalizer
export function normalizeUrl(urlStr?: string | null): string {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    const parsed = new URL(urlStr.trim());
    // Lowercase hostname and remove trailing slash
    let clean = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}`;
    if (parsed.search) {
      clean += parsed.search;
    }
    return clean;
  } catch (e) {
    return urlStr.trim().toLowerCase().replace(/\/+$/, '');
  }
}

// Read all records safely
export function getAllDatasetRecords(): MarketingDatasetRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DATASET_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading dataset file:', err);
    return [];
  }
}

// Write records atomically
function saveAllDatasetRecords(records: MarketingDatasetRecord[]) {
  ensureStorage();
  const tmpFile = `${DATASET_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATASET_FILE);
}

// Read all batches safely
export function getAllImportBatches(): ImportBatchRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(BATCHES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading batches file:', err);
    return [];
  }
}

// Save batch record atomically
function saveBatchRecord(batch: ImportBatchRecord) {
  ensureStorage();
  const batches = getAllImportBatches();
  batches.unshift(batch);
  const tmpFile = `${BATCHES_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(batches, null, 2), 'utf-8');
  fs.renameSync(tmpFile, BATCHES_FILE);
}

// Duplicate detection logic against existing records
export function checkDuplicate(
  candidate: { content: string; sourceId?: string; sourceUrl?: string | null },
  existingRecords: MarketingDatasetRecord[]
): DuplicateMatchInfo | null {
  const candidateFingerprint = computeFingerprint(candidate.content);
  const candidateUrl = normalizeUrl(candidate.sourceUrl);
  const candidateSourceId = candidate.sourceId?.trim().toLowerCase();

  for (const existing of existingRecords) {
    // 1. Exact duplicate by fingerprint
    if (candidateFingerprint && existing.contentFingerprint === candidateFingerprint) {
      return {
        matchType: 'exact',
        matchedRecordId: existing.id,
        matchedBy: 'content_fingerprint',
        matchedSnippet: existing.content.slice(0, 100),
      };
    }

    // 2. Exact match by sourceId
    if (candidateSourceId && existing.sourceId && existing.sourceId.trim().toLowerCase() === candidateSourceId) {
      return {
        matchType: 'exact',
        matchedRecordId: existing.id,
        matchedBy: 'source_id',
        matchedSnippet: existing.content.slice(0, 100),
      };
    }

    // 3. Likely duplicate by normalized URL
    if (candidateUrl && existing.sourceUrl && normalizeUrl(existing.sourceUrl) === candidateUrl) {
      return {
        matchType: 'likely',
        matchedRecordId: existing.id,
        matchedBy: 'source_url',
        matchedSnippet: existing.content.slice(0, 100),
      };
    }
  }

  return null;
}

// Insert confirmed records in a batch
export function persistConfirmedImport(
  newRecords: MarketingDatasetRecord[],
  batchRecord: ImportBatchRecord
): { inserted: number; skipped: number; total: number } {
  const existing = getAllDatasetRecords();
  const existingFingerprints = new Set(existing.map((r) => r.contentFingerprint));
  const existingSourceIds = new Set(
    existing.map((r) => r.sourceId?.trim().toLowerCase()).filter(Boolean)
  );

  const toInsert: MarketingDatasetRecord[] = [];
  let skippedDuplicates = 0;

  for (const record of newRecords) {
    const isDupFingerprint = existingFingerprints.has(record.contentFingerprint);
    const isDupSourceId = record.sourceId && existingSourceIds.has(record.sourceId.trim().toLowerCase());

    if (isDupFingerprint || isDupSourceId) {
      skippedDuplicates++;
      continue;
    }

    toInsert.push(record);
    existingFingerprints.add(record.contentFingerprint);
    if (record.sourceId) {
      existingSourceIds.add(record.sourceId.trim().toLowerCase());
    }
  }

  const updatedRecords = [...toInsert, ...existing];
  saveAllDatasetRecords(updatedRecords);

  const finalBatch: ImportBatchRecord = {
    ...batchRecord,
    insertedCount: toInsert.length,
    skippedDuplicatesCount: skippedDuplicates,
    status: toInsert.length > 0 ? (skippedDuplicates > 0 ? 'partial' : 'completed') : 'completed',
  };
  saveBatchRecord(finalBatch);

  return {
    inserted: toInsert.length,
    skipped: skippedDuplicates,
    total: updatedRecords.length,
  };
}

// Update single record
export function updateDatasetRecord(
  id: string,
  updates: Partial<MarketingDatasetRecord>
): MarketingDatasetRecord | null {
  const records = getAllDatasetRecords();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const current = records[index];
  const updated: MarketingDatasetRecord = {
    ...current,
    ...updates,
    id: current.id, // Immutable ID
    batchId: current.batchId, // Immutable batch
    contentFingerprint: updates.content ? computeFingerprint(updates.content) : current.contentFingerprint,
  };

  records[index] = updated;
  saveAllDatasetRecords(records);
  return updated;
}

// Bulk Review (approve or reject)
export function bulkReviewRecords(
  ids: string[],
  status: 'approved' | 'rejected',
  reason?: string,
  notes?: string,
  reviewerId: string = 'reviewer@duckprompts.com'
): { affected: number } {
  const records = getAllDatasetRecords();
  let affected = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < records.length; i++) {
    if (ids.includes(records[i].id)) {
      records[i] = {
        ...records[i],
        humanReviewStatus: status,
        rejectionReason: status === 'rejected' ? (reason || 'مرفوض بدون سبب محدد') : null,
        reviewerNotes: notes !== undefined ? notes : records[i].reviewerNotes,
        reviewerId,
        reviewedAt: now,
      };
      affected++;
    }
  }

  if (affected > 0) {
    saveAllDatasetRecords(records);
  }

  return { affected };
}

// Delete records
export function deleteDatasetRecords(ids: string[]): { deleted: number } {
  const records = getAllDatasetRecords();
  const filtered = records.filter((r) => !ids.includes(r.id));
  const deleted = records.length - filtered.length;
  if (deleted > 0) {
    saveAllDatasetRecords(filtered);
  }
  return { deleted };
}

// Calculate Statistics
export function calculateDatasetStats(): DatasetStatsResponse {
  const records = getAllDatasetRecords();

  let pendingReview = 0;
  let approved = 0;
  let rejected = 0;
  let qualityIssuesCount = 0;
  let duplicatesFlaggedCount = 0;
  let unknownLicenseCount = 0;
  let marketingContentCount = 0;
  let marketingReferenceCount = 0;

  const distributions = {
    countries: {} as Record<string, number>,
    industries: {} as Record<string, number>,
    dialects: {} as Record<string, number>,
    contentTypes: {} as Record<string, number>,
    objectives: {} as Record<string, number>,
    marketTiers: {} as Record<string, number>,
    licenses: {} as Record<string, number>,
  };

  const fingerprintsSeen = new Set<string>();

  for (const r of records) {
    if (r.recordPurpose === 'marketing_reference') {
      marketingReferenceCount++;
    } else {
      marketingContentCount++;
    }

    if (r.humanReviewStatus === 'approved') approved++;
    else if (r.humanReviewStatus === 'rejected') rejected++;
    else pendingReview++;

    // Fair quality issue detection
    if (r.recordPurpose === 'marketing_reference') {
      if (
        r.dataQualityScore < 70 ||
        !r.contentSummary ||
        r.contentSummary.trim().length < 20 ||
        (!r.sourceUrl && !r.sourceId && !r.sourcePlatform)
      ) {
        qualityIssuesCount++;
      }
    } else {
      if (r.dataQualityScore < 70 || !r.content || r.content.trim().length < 20 || !r.sourceUrl) {
        qualityIssuesCount++;
      }
    }

    if (r.contentFingerprint && fingerprintsSeen.has(r.contentFingerprint)) {
      duplicatesFlaggedCount++;
    } else if (r.contentFingerprint) {
      fingerprintsSeen.add(r.contentFingerprint);
    }

    if (r.licenseStatus === 'unknown' || r.licenseStatus === 'pending_verification') {
      unknownLicenseCount++;
    }

    // Accumulate distributions
    const country = r.country?.trim() || 'غير محدد';
    distributions.countries[country] = (distributions.countries[country] || 0) + 1;

    const industry = r.industry?.trim() || 'غير محدد';
    distributions.industries[industry] = (distributions.industries[industry] || 0) + 1;

    const dialect = r.dialect?.trim() || 'غير محدد';
    distributions.dialects[dialect] = (distributions.dialects[dialect] || 0) + 1;

    const cType = r.contentType?.trim() || 'غير محدد';
    distributions.contentTypes[cType] = (distributions.contentTypes[cType] || 0) + 1;

    const obj = r.marketingObjective?.trim() || 'غير محدد';
    distributions.objectives[obj] = (distributions.objectives[obj] || 0) + 1;

    const tier = r.marketTier?.trim() || 'Unassigned';
    distributions.marketTiers[tier] = (distributions.marketTiers[tier] || 0) + 1;

    const lic = r.licenseStatus || 'unknown';
    distributions.licenses[lic] = (distributions.licenses[lic] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    marketingContentCount,
    marketingReferenceCount,
    pendingReview,
    approved,
    rejected,
    qualityIssuesCount,
    duplicatesFlaggedCount,
    unknownLicenseCount,
    distributions,
  };
}

// Query & Filter records
export function queryDatasetRecords(filters: Partial<DatasetFilterState>): {
  records: MarketingDatasetRecord[];
  total: number;
  page: number;
  pageSize: number;
} {
  let list = getAllDatasetRecords();

  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    list = list.filter(
      (r) =>
        (r.content && r.content.toLowerCase().includes(q)) ||
        (r.contentSummary && r.contentSummary.toLowerCase().includes(q)) ||
        (r.brandName && r.brandName.toLowerCase().includes(q)) ||
        (r.sourceTitle && r.sourceTitle.toLowerCase().includes(q)) ||
        (r.sourceId && r.sourceId.toLowerCase().includes(q)) ||
        (r.industry && r.industry.toLowerCase().includes(q))
    );
  }

  if (filters.recordPurpose && filters.recordPurpose !== 'all') {
    list = list.filter((r) => {
      const p = r.recordPurpose || 'marketing_content';
      return p === filters.recordPurpose;
    });
  }

  if (filters.country && filters.country !== 'all') {
    list = list.filter((r) => r.country === filters.country);
  }

  if (filters.dialect && filters.dialect !== 'all') {
    list = list.filter((r) => r.dialect === filters.dialect);
  }

  if (filters.industry && filters.industry !== 'all') {
    list = list.filter((r) => r.industry === filters.industry);
  }

  if (filters.contentType && filters.contentType !== 'all') {
    list = list.filter((r) => r.contentType === filters.contentType);
  }

  if (filters.marketingObjective && filters.marketingObjective !== 'all') {
    list = list.filter((r) => r.marketingObjective === filters.marketingObjective);
  }

  if (filters.marketTier && filters.marketTier !== 'all') {
    list = list.filter((r) => r.marketTier === filters.marketTier);
  }

  if (filters.reviewStatus && filters.reviewStatus !== 'all') {
    list = list.filter((r) => r.humanReviewStatus === filters.reviewStatus);
  }

  if (filters.sourceStatus && filters.sourceStatus !== 'all') {
    list = list.filter((r) => r.sourceVerificationStatus === filters.sourceStatus);
  }

  if (filters.licenseStatus && filters.licenseStatus !== 'all') {
    list = list.filter((r) => r.licenseStatus === filters.licenseStatus);
  }

  if (filters.batchId && filters.batchId !== 'all') {
    list = list.filter((r) => r.batchId === filters.batchId);
  }

  // Sort
  const sortBy = filters.sortBy || 'importedAt';
  const sortOrder = filters.sortOrder || 'desc';

  list.sort((a, b) => {
    let valA = (a as any)[sortBy];
    let valB = (b as any)[sortBy];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const total = list.length;
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, filters.pageSize || 10);
  const start = (page - 1) * pageSize;
  const paginated = list.slice(start, start + pageSize);

  return {
    records: paginated,
    total,
    page,
    pageSize,
  };
}

// ==========================================
// APPROVED HUMAN REFERENCE RETRIEVAL FOR AI GENERATION
// ==========================================

export interface EngineRetrievalOptions {
  country?: string;
  dialect?: string;
  industry?: string;
  contentType?: string;
  objective?: string;
  recordPurpose?: 'marketing_content' | 'marketing_reference' | 'all';
  minQualityScore?: number;
  limit?: number;
}

export function queryEligibleRecordsForEngine(options: EngineRetrievalOptions = {}): MarketingDatasetRecord[] {
  const allRecords = getAllDatasetRecords();
  const minScore = options.minQualityScore ?? 65;
  const limit = options.limit ?? 5;

  return allRecords
    .filter((r) => {
      // 1. Mandatory approval check: only approved human-verified records
      if (r.humanReviewStatus !== 'approved') return false;

      // 2. Mandatory license permission check: only explicitly permitted or public domain
      if (r.licenseStatus !== 'reuse_permitted' && r.licenseStatus !== 'public_domain') {
        return false;
      }

      // 3. Minimum quality score
      if (r.dataQualityScore < minScore) return false;

      // 4. Record purpose filter
      if (options.recordPurpose && options.recordPurpose !== 'all') {
        const purpose = r.recordPurpose || 'marketing_content';
        if (purpose !== options.recordPurpose) return false;
      }

      // 5. Optional metadata filters
      if (options.country && r.country && !r.country.includes(options.country) && !options.country.includes(r.country)) {
        return false;
      }
      if (options.dialect && r.dialect && !r.dialect.includes(options.dialect) && !options.dialect.includes(r.dialect)) {
        return false;
      }
      if (options.industry && r.industry && !r.industry.includes(options.industry) && !options.industry.includes(r.industry)) {
        return false;
      }
      if (options.contentType && r.contentType && r.contentType !== options.contentType) {
        return false;
      }
      if (options.objective && r.marketingObjective && r.marketingObjective !== options.objective) {
        return false;
      }

      return true;
    })
    .slice(0, limit);
}

/**
 * Smart retrieval of approved human references for a given client brief
 * Prioritizes records matching dialect, industry, country, and objective.
 */
export function getApprovedReferencesForBrief(
  brief: {
    country?: string;
    dialect?: string;
    languageDialect?: string;
    industry?: string;
    contentType?: string;
    marketingObjective?: string;
  },
  options: { limitContent?: number; limitReference?: number } = {}
): {
  contentExamples: MarketingDatasetRecord[];
  referenceCases: MarketingDatasetRecord[];
} {
  const allRecords = getAllDatasetRecords();
  const limitContent = options.limitContent ?? 3;
  const limitReference = options.limitReference ?? 2;

  // Filter only approved & permitted records
  const eligible = allRecords.filter(
    (r) =>
      r.humanReviewStatus === 'approved' &&
      (r.licenseStatus === 'reuse_permitted' || r.licenseStatus === 'public_domain')
  );

  const dialect = brief.dialect || brief.languageDialect || '';
  const country = brief.country || '';
  const industry = brief.industry || '';
  const objective = brief.marketingObjective || '';

  // Score relevance to brief
  const scored = eligible.map((r) => {
    let relevance = 0;
    if (dialect && r.dialect && (r.dialect.includes(dialect) || dialect.includes(r.dialect))) relevance += 4;
    if (country && r.country && (r.country.includes(country) || country.includes(r.country))) relevance += 3;
    if (industry && r.industry && (r.industry.includes(industry) || industry.includes(r.industry))) relevance += 3;
    if (objective && r.marketingObjective && (r.marketingObjective.includes(objective) || objective.includes(r.marketingObjective))) relevance += 2;
    if (r.dataQualityScore >= 90) relevance += 1;
    return { record: r, relevance };
  });

  scored.sort((a, b) => b.relevance - a.relevance || b.record.dataQualityScore - a.record.dataQualityScore);

  const contentExamples: MarketingDatasetRecord[] = [];
  const referenceCases: MarketingDatasetRecord[] = [];

  for (const item of scored) {
    const isReference = item.record.recordPurpose === 'marketing_reference';
    if (isReference) {
      if (referenceCases.length < limitReference) {
        referenceCases.push(item.record);
      }
    } else {
      if (contentExamples.length < limitContent && item.record.content && item.record.content.trim().length >= 10) {
        contentExamples.push(item.record);
      }
    }

    if (contentExamples.length >= limitContent && referenceCases.length >= limitReference) {
      break;
    }
  }

  return { contentExamples, referenceCases };
}
