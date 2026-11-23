export type EngineId =
  | 'brand_strategy'
  | 'idea_generator'
  | 'content_writer'
  | 'content_adapter';

export type EngineType =
  | 'Brand Strategy'
  | 'Idea Generator'
  | 'Content Writer'
  | 'Content Adapter';

export interface PromptVersionRecord {
  version: string;
  systemPrompt: string;
  notes: string;
  timestamp: string;
}

export interface PromptRecord {
  id: string;
  engineId: EngineId;
  name: string;
  engine: EngineType;
  systemPrompt: string;
  notes: string;
  version: string;
  updatedAt: string;
  versions?: PromptVersionRecord[];
}

export interface EngineDraft {
  systemPrompt: string;
  promptName: string;
  promptVersion: string;
  activePromptId: string | null;
  promptNotes: string;
  hasUnsavedChanges: boolean;
}

export interface ClientBrief {
  brandName: string;
  country: string;
  industry: string;
  targetAudience: string;
  marketingObjective: string;
  languageDialect: string;
  clientBrief: string;
  additionalContext: string;
  isSynthetic?: boolean;
}

export interface TestBriefTemplate {
  id: string;
  name: string;
  country: string;
  industry: string;
  languageDialect: string;
  brandName: string;
  targetAudience: string;
  marketingObjective: string;
  clientBrief: string;
  additionalContext: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface ReferenceExample {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
}

// ==========================================
// SEQUENTIAL APPROVAL WORKFLOW INTERFACES
// ==========================================

export interface StrategyVersion {
  version: number;
  content: string;
  timestamp: string;
  isApproved: boolean;
  rejectionReasons?: string[];
  rejectionFeedback?: string;
  modelUsed?: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  strategicPurpose: string;
  audienceInsight: string;
  suggestedHook: string;
  contentPillar: string;
  modelUsed?: string;
}

export type ContentFormatType = 'carousel' | 'static_post' | 'video_script';

export interface ContentDeliverable {
  id: string;
  ideaId: string;
  ideaTitle: string;
  format: ContentFormatType;
  content: string;
  originalContent: string;
  isEdited: boolean;
  isApproved: boolean;
  status: 'pending' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
  updatedAt: string;
  modelUsed?: string;
}

export interface WorkflowProjectState {
  currentStage: number; // 1 to 5
  strategyVersions: StrategyVersion[];
  approvedStrategy: string | null;
  ideas: ContentIdea[];
  selectedIdeaIds: string[];
  ideasApproved: boolean;
  ideaFormats: Record<string, ContentFormatType[]>;
  formatsConfirmed: boolean;
  deliverables: ContentDeliverable[];
  planRunId?: string; // Unique execution run identifier for race condition isolation
  planName?: string; // Optional user label for current plan/strategy variation
  selectedModel?: string; // Model configured for this project/run
  activeModelUsed?: string; // Model used in the latest execution
  useHumanReferences?: boolean; // User-controlled toggle for injecting approved references
  lastReferencesUsed?: {
    count: number;
    sampleTitles: string[];
    usedAtStage?: string;
  };
}

export interface AIModelOption {
  id: string;
  name: string;
  desc: string;
  badge: string;
  isDefault?: boolean;
}

export const SUPPORTED_AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    desc: 'النموذج القياسي الموصى به: فائق السرعة، استيعاب استراتيجي عالي، وإنتاج نصوص تسويقية متقنة',
    badge: 'موصى به (Recommended)',
    isDefault: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    desc: 'نموذج فائق الخفة والسرعة: مثالي للتجارب السريعة وتوليد الأفكار الفورية بأقل استهلاك',
    badge: 'خفيف وسريع',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'نموذج فائق الاعتمادية والسرعة للمهام المتعددة وتوليد المحتوى الإعلاني المتنوع',
    badge: 'متعدد الاستخدامات',
  },
];

export interface Project {
  id: string; // Stable identifier, e.g. 'sample-egypt-burger', 'proj-12345'
  name: string; // Display name
  brief: ClientBrief;
  selectedModel: string; // Independent model configuration for this project
  updatedAt: string;
  isDefault?: boolean;
}

export interface ProjectSavedPlan {
  id: string;
  projectId: string;
  planName?: string;
  name?: string;
  createdAt: string;
  strategyContent?: string;
  strategy?: string;
  selectedModel: string;
  ideasCount?: number;
  ideas?: ContentIdea[];
  deliverablesCount: number;
  notes?: string;
  planRunId?: string;
}

// Evaluations
export interface CriterionEval {
  score: number;
  explanation: string;
  suggestion: string;
}

export interface AIEvaluation {
  criteria: {
    complianceWithPrompt: CriterionEval;
    relevanceToBrief: CriterionEval;
    marketingQuality: CriterionEval;
    originalityAndDiff: CriterionEval;
    brandVoiceAndDialect: CriterionEval;
    clarityAndReadability: CriterionEval;
    accuracyNoUnsupportedClaims: CriterionEval;
  };
  overallSummary: string;
  overallWeightedScore: number;
  weights: Record<string, number>;
  evaluatedAt: string;
}

export interface HumanEvaluation {
  score: number;
  feedback: string;
  status: 'approved' | 'rejected' | 'pending';
  evaluatedAt: string;
}

export interface ExperimentRun {
  id: string;
  timestamp: string;
  engineId: EngineId;
  engine: EngineType;
  promptId?: string;
  promptName: string;
  promptVersion: string;
  systemPrompt: string;
  brief: ClientBrief;
  referenceExamples: ReferenceExample[];
  model: string;
  output: string;
  durationMs: number;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  aiEvaluation?: AIEvaluation;
  humanEvaluation?: HumanEvaluation;
}

// ==========================================
// DATASET MANAGER TYPES & CANONICAL SCHEMA
// ==========================================

export type MarketTier = 'Tier A' | 'Tier B' | 'Tier C' | 'Unassigned';

export type DatasetReviewStatus = 'pending' | 'approved' | 'rejected';

export type SourceVerificationStatus = 'unverified' | 'verified' | 'disputed';

export type LicenseStatus =
  | 'unknown'
  | 'pending_verification'
  | 'permission_required'
  | 'reuse_permitted'
  | 'restricted'
  | 'public_domain';

export interface AISuggestionItem {
  value: string;
  confidence: number; // 0 to 1
}

export interface AISuggestions {
  country?: AISuggestionItem;
  dialect?: AISuggestionItem;
  industry?: AISuggestionItem;
  contentType?: AISuggestionItem;
  objective?: AISuggestionItem;
  marketTier?: AISuggestionItem;
  model: string;
  suggestedAt: string;
  isAccepted?: boolean;
}

export interface PerformanceMetrics {
  definitions?: string;
  values: Record<string, number | string>;
  source?: string;
  observationDate?: string;
}

export interface MarketingDatasetRecord {
  // Identity
  id: string;
  sourceId?: string;
  sourceUrl?: string | null;
  sourcePlatform?: string | null;
  sourceTitle?: string | null;
  batchId: string;
  importedAt: string;
  contentFingerprint: string; // SHA-256 hash of normalized content

  // Marketing Content or Reference
  recordPurpose?: 'marketing_content' | 'marketing_reference';
  content: string;
  contentSummary?: string | null; // For marketing_reference or strategic overview
  language: string; // 'ar', 'en', etc.
  country: string; // e.g., 'مصر', 'السعودية', 'الإمارات'
  dialect: string; // e.g., 'مصري عامي', 'سعودي', 'فصحى معاصرة'
  industry: string; // e.g., 'مطاعم وأغذية', 'أزياء', 'عقارات'
  contentType: string; // e.g., 'كاروسيل', 'بوست ثابت', 'سكريبت فيديو'
  marketingObjective: string; // e.g., 'زيادة المبيعات', 'الوعي بالعلامة'
  contentPillar?: string | null;
  brandName?: string | null;
  publicationDate?: string | null;

  // Provenance, Licensing & Trust
  sourceVerificationStatus: SourceVerificationStatus;
  licenseStatus: LicenseStatus;
  licenseName?: string | null;
  permissionNotes?: string | null;
  dataQualityScore: number; // 0 to 100
  classificationConfidence?: number;
  humanReviewStatus: DatasetReviewStatus;
  reviewerNotes?: string | null;
  rejectionReason?: string | null;
  reviewerId?: string | null;
  reviewedAt?: string | null;

  // Market Classification
  marketTier: MarketTier;

  // AI Classification Suggestions (Stored with provenance)
  aiSuggestions?: AISuggestions | null;

  // Optional Performance Information
  performanceMetrics?: PerformanceMetrics | null;

  // Original Imported Raw Record for auditing
  rawRecord?: Record<string, any>;
}

export interface ImportBatchRecord {
  id: string;
  fileName: string;
  fileFormat: 'csv' | 'jsonl' | 'zip';
  importedAt: string;
  importedBy: string;
  totalDetected: number;
  insertedCount: number;
  skippedDuplicatesCount: number;
  invalidCount: number;
  failedCount: number;
  status: 'completed' | 'partial' | 'failed';
  notes?: string;
  filesIncludedInZip?: string[];
}

export interface ValidationIssue {
  rowIndex: number;
  field?: string;
  severity: 'error' | 'warning';
  message: string;
  sampleValue?: any;
}

export interface DuplicateMatchInfo {
  matchType: 'exact' | 'likely' | 'possible';
  matchedRecordId: string;
  matchedBy: 'source_id' | 'source_url' | 'content_fingerprint';
  matchedSnippet: string;
}

export interface PreviewRecordItem {
  index: number;
  record: Partial<MarketingDatasetRecord>;
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  duplicateMatch?: DuplicateMatchInfo | null;
}

export interface ImportPreviewResponse {
  fileName: string;
  fileFormat: 'csv' | 'jsonl' | 'zip';
  totalDetected: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  potentialMatchCount: number;
  detectedFields: string[];
  missingRequiredFields: string[];
  unknownFields: string[];
  suggestedFieldMappings: Record<string, string>;
  previewRecords: PreviewRecordItem[];
  allValidationIssues: ValidationIssue[];
  archiveFilesFound?: {
    name: string;
    size: number;
    format: string;
    selected: boolean;
    validType: boolean;
  }[];
}

export interface DatasetStatsResponse {
  totalRecords: number;
  marketingContentCount: number;
  marketingReferenceCount: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  qualityIssuesCount: number;
  duplicatesFlaggedCount: number;
  unknownLicenseCount: number;
  distributions: {
    countries: Record<string, number>;
    industries: Record<string, number>;
    dialects: Record<string, number>;
    contentTypes: Record<string, number>;
    objectives: Record<string, number>;
    marketTiers: Record<string, number>;
    licenses: Record<string, number>;
  };
}

export interface DatasetFilterState {
  searchQuery: string;
  recordPurpose?: string;
  country: string;
  dialect: string;
  industry: string;
  contentType: string;
  marketingObjective: string;
  marketTier: string;
  reviewStatus: string;
  sourceStatus: string;
  licenseStatus: string;
  batchId: string;
  sortBy: 'importedAt' | 'dataQualityScore' | 'content';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

