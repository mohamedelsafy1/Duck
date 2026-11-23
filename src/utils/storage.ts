import {
  EngineId,
  EngineType,
  PromptRecord,
  EngineDraft,
  ExperimentRun,
  TestBriefTemplate,
} from '../types.ts';

export const ENGINE_LIST: { id: EngineId; name: EngineType; label: string; desc: string }[] = [
  {
    id: 'brand_strategy',
    name: 'Brand Strategy',
    label: 'Brand Strategy',
    desc: 'استراتيجية العلامة التجارية وتموضعها ورسائلها الجوهرية',
  },
  {
    id: 'idea_generator',
    name: 'Idea Generator',
    label: 'Idea Generator',
    desc: 'توليد أفكار إبداعية للحملات التسويقية والزوايا الإعلانية',
  },
  {
    id: 'content_writer',
    name: 'Content Writer',
    label: 'Content Writer',
    desc: 'كتابة نصوص تسويقية، منشورات، إعلانات، ومقالات إقناعية',
  },
  {
    id: 'content_adapter',
    name: 'Content Adapter',
    label: 'Content Adapter',
    desc: 'تكييف وتوطين المحتوى لثقافات ولهجات وأسواق مختلفة',
  },
];

export function engineTypeToId(type: string): EngineId {
  switch (type) {
    case 'Brand Strategy':
    case 'brand_strategy':
      return 'brand_strategy';
    case 'Idea Generator':
    case 'idea_generator':
      return 'idea_generator';
    case 'Content Writer':
    case 'content_writer':
      return 'content_writer';
    case 'Content Adapter':
    case 'content_adapter':
      return 'content_adapter';
    default:
      return 'brand_strategy';
  }
}

export function engineIdToType(id: EngineId): EngineType {
  switch (id) {
    case 'brand_strategy':
      return 'Brand Strategy';
    case 'idea_generator':
      return 'Idea Generator';
    case 'content_writer':
      return 'Content Writer';
    case 'content_adapter':
      return 'Content Adapter';
  }
}

const ENGINE_PROMPTS_KEY = 'ai_marketing_lab_prompts_by_engine_v2';
const ENGINE_DRAFTS_KEY = 'ai_marketing_lab_drafts_v2';
const CUSTOM_BRIEFS_KEY = 'ai_marketing_lab_custom_briefs_v1';
const HISTORY_STORAGE_KEY = 'ai_marketing_lab_history';
const LEGACY_PROMPTS_KEY = 'ai_marketing_lab_prompts';

export const DEFAULT_SAMPLE_BRIEFS: TestBriefTemplate[] = [
  {
    id: 'sample-egypt-burger',
    name: 'مطعم برجر مصري (وجبة محدودة)',
    country: 'مصر (القاهرة والجيزة)',
    industry: 'مطاعم ومأكولات سريعة (Fast Food)',
    languageDialect: 'مصري عامي شبابي',
    brandName: 'برجر المعلم (El-Moallam Burgers)',
    targetAudience: 'شباب وطلاب ومهنيين من 18 إلى 30 سنة من محبي تجارب الأكل السريع',
    marketingObjective: 'زيادة طلبات التوصيل عبر السوشيال ميديا وخلق تريند في القاهرة',
    clientBrief:
      'حملة ترويجية لإطلاق وجبة برجر دبل تشيز جديدة ومحدودة الوقت بسعر منافس. نركز على الشهية البصرية العالية، القيمة الممتازة مقابل السعر، واستخدام هوك إعلاني مصري جذاب ومضحك يخطف الانتباه فوراً.',
    additionalContext:
      'التركيز على حجم السندوتش والجبنة السايحة وخدمة التوصيل الساخن السريع، وتجنب النبرة الرسمية الجافة.',
    isDefault: true,
  },
  {
    id: 'sample-egypt-coffee',
    name: 'مقهى مختص مصري (مشروبات مثلجة)',
    country: 'مصر (القاهرة الجديدة والمعادي)',
    industry: 'مقاهي وقهوة مختصة (Specialty Coffee)',
    languageDialect: 'مصري عامي راقٍ وبسيط',
    brandName: 'بُن وحكاية (Bonn & Hekaya)',
    targetAudience: 'طلاب الجامعات والمصممون والموظفون الشباب (19–32 سنة)',
    marketingObjective: 'زيادة الزيارات المباشرة للفرع وبناء هوية براند متمايزة',
    clientBrief:
      'إطلاق قائمة مشروبات مثلجة جديدة (Iced Specialty Coffee) لفصل الصيف، بمحتوى سوشيال ميديا عفوي وخفيف الظل يبرز هدوء المكان وتجربة الجلسة المريحة بنبرة براند واضحة ومميزة.',
    additionalContext:
      'تسليط الضوء على هدوء المكان ومناسبته للعمل والمذاكرة مع جودة حبوب البن المستوردة من إثيوبيا وكولومبيا.',
    isDefault: true,
  },
  {
    id: 'sample-egypt-fashion',
    name: 'براند ستريت وير مصري (كولكشن الشتاء)',
    country: 'مصر (القاهرة والإسكندرية والمنصورة)',
    industry: 'أزياء وملابس شبابية (Streetwear Fashion)',
    languageDialect: 'مصري عامي شبابي معاصر',
    brandName: 'كاريزما ستريت (Karyzma Streetwear)',
    targetAudience: 'الشباب والبنات من 18 إلى 28 سنة المهتمين بالموضة العصرية والـ Hip-Hop',
    marketingObjective: 'زيادة المبيعات المباشرة والتفاعل الحماسي مع موعد الإطلاق الجديد',
    clientBrief:
      'إطلاق مجموعة هوديز وتيشيرتات أوفر سايز لشتاء 2026 باستخدام مصطلحات شبابية مصرية دارجة ومفهوم حملة جريء يربط بين روح شوارع القاهرة وأحدث صيحات الستريت وير العالمية.',
    additionalContext:
      'التركيز على خامة القطن المصري الفاخر 100% والتطريز المتقن والكمية المحدودة (Limited Drop) لخلق حالة من الاستعجال والندرة.',
    isDefault: true,
  },
  {
    id: 'sample-saudi-restaurant',
    name: 'مطعم سعودي (عروض عطلة نهاية الأسبوع)',
    country: 'المملكة العربية السعودية (الرياض وجدة)',
    industry: 'مطاعم وضيافة سعودية أصيلة',
    languageDialect: 'سعودي أصيل وطبيعي',
    brandName: 'مضايف الديرة (Madaif Al-Deerah)',
    targetAudience: 'العائلات والشباب وجمعات الأصدقاء في عطلة نهاية الأسبوع',
    marketingObjective: 'زيادة حجوزات الطاولات وطلبات البوكسات العائلية في الويكند',
    clientBrief:
      'إعداد حملة ترويجية لولائم عطلة نهاية الأسبوع بنكهات سعودية أصيلة، باستخدام لهجة سعودية طبيعية تبتعد تماماً عن القوالب النمطية المبتذلة، مع وصف شهي للأطباق ودعوة واضحة للحجز المسبق.',
    additionalContext:
      'التركيز على بهجة جمعة العائلة والأصحاب والضيافة الكريمة، مع تقديم بوكسات مخصصة لجمعات الاستراحات والمخيمات والشاليهات.',
    isDefault: true,
  },
  {
    id: 'sample-bahrain-coffee',
    name: 'براند قهوة بحريني (مشروب موسمي)',
    country: 'مملكة البحرين (المنامة والمحرق)',
    industry: 'قهوة مختصة ومحمصة حرفية',
    languageDialect: 'بحريني / خليجي طبيعي دافئ',
    brandName: 'دانة كافيه ومحمصة (Dana Roastery)',
    targetAudience: 'المهنيون والشباب وعشاق التذوق الحرفي وأجواء المقاهي الهادئة',
    marketingObjective: 'الترويج لمشروب موسمي مبتكر بنكهة الهيل والزعفران والقهوة الباردة',
    clientBrief:
      'تقديم مشروب القهوة الباردة الموسمية الجديدة بنبرة دافئة ومعاصرة تعبر عن روح الضيافة البحرينية الأصيلة والممزوجة بحرفية المقاهي العالمية الحديثة.',
    additionalContext:
      'إبراز حرفية التحميص المحلي وطرق التحضير المبتكرة مع جلسات مريحة وتجربة راقية تناسب لقاءات العمل والأصدقاء.',
    isDefault: true,
  },
  {
    id: 'sample-kuwait-ecommerce',
    name: 'متجر أزياء إلكتروني كويتي (تخفيضات سريعة)',
    country: 'دولة الكويت',
    industry: 'تجارة إلكترونية وأزياء',
    languageDialect: 'كويتي حديث ومقنع',
    brandName: 'أورا فاشن (Aura Kuwait)',
    targetAudience: 'الشباب والشابات من 18 إلى 35 سنة من محبي التسوق الرقمي السريع والقطع العصرية',
    marketingObjective: 'زيادة معدلات التحويل والمبيعات خلال تخفيضات لفترة محدودة (Flash Sale 48h)',
    clientBrief:
      'صياغة حملة إعلانية رقمية تبرز العرض الحصري وتنوع القطع العصرية وتناغمها مع الذوق الكويتي، مع حث العملاء على الطلب أونلاين فوراً عبر التطبيق والموقع مع خدمة التوصيل خلال ساعتين.',
    additionalContext:
      'إبراز سهولة الدفع بالكي نت (K-Net) وسياسة الاستبدال الفوري المجاني، والتأكيد على انتهاء العرض خلال 48 ساعة فقط.',
    isDefault: true,
  },
];

// Initial default empty drafts for each engine
export function getDefaultDraft(engineId: EngineId): EngineDraft {
  const meta = ENGINE_LIST.find((e) => e.id === engineId);
  return {
    systemPrompt: '',
    promptName: `${meta?.label || 'البرومبت'} - مسودة`,
    promptVersion: '1.0',
    activePromptId: null,
    promptNotes: '',
    hasUnsavedChanges: false,
  };
}

// -------------------------------------------------------------
// PROMPTS PERSISTENCE PER ENGINE
// -------------------------------------------------------------

export function getAllEnginePrompts(): Record<EngineId, PromptRecord[]> {
  const initialMap: Record<EngineId, PromptRecord[]> = {
    brand_strategy: [],
    idea_generator: [],
    content_writer: [],
    content_adapter: [],
  };

  try {
    const raw = localStorage.getItem(ENGINE_PROMPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const e of ENGINE_LIST) {
        if (Array.isArray(parsed[e.id])) {
          initialMap[e.id] = parsed[e.id];
        }
      }
      return initialMap;
    }

    // Check for legacy single-collection storage to migrate without loss
    const legacyRaw = localStorage.getItem(LEGACY_PROMPTS_KEY);
    if (legacyRaw) {
      const legacyPrompts: any[] = JSON.parse(legacyRaw);
      if (Array.isArray(legacyPrompts) && legacyPrompts.length > 0) {
        legacyPrompts.forEach((p) => {
          const eId: EngineId = engineTypeToId(p.engineId || p.engine || 'Brand Strategy');
          initialMap[eId].push({
            id: p.id || `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            engineId: eId,
            engine: engineIdToType(eId),
            name: p.name || 'برومبت محفوظ',
            systemPrompt: p.systemPrompt || '',
            notes: p.notes || '',
            version: p.version || '1.0',
            updatedAt: p.updatedAt || new Date().toISOString(),
            versions: p.versions || [
              {
                version: p.version || '1.0',
                systemPrompt: p.systemPrompt || '',
                notes: p.notes || '',
                timestamp: p.updatedAt || new Date().toISOString(),
              },
            ],
          });
        });
        // Save the migrated structure
        localStorage.setItem(ENGINE_PROMPTS_KEY, JSON.stringify(initialMap));
      }
    }
  } catch (err) {
    console.error('Failed to load prompts by engine:', err);
  }

  return initialMap;
}

export function getPromptsForEngine(engineId: EngineId): PromptRecord[] {
  const all = getAllEnginePrompts();
  return all[engineId] || [];
}

export function savePromptForEngine(prompt: PromptRecord): PromptRecord[] {
  const all = getAllEnginePrompts();
  const currentList = all[prompt.engineId] || [];
  const idx = currentList.findIndex((p) => p.id === prompt.id);

  let updatedList: PromptRecord[];
  if (idx >= 0) {
    // Preserve existing version records
    const existingVersions = currentList[idx].versions || [];
    const hasCurrentVer = existingVersions.some((v) => v.version === prompt.version);
    const newVersions = hasCurrentVer
      ? existingVersions.map((v) =>
          v.version === prompt.version
            ? { ...v, systemPrompt: prompt.systemPrompt, notes: prompt.notes, timestamp: new Date().toISOString() }
            : v
        )
      : [
          {
            version: prompt.version,
            systemPrompt: prompt.systemPrompt,
            notes: prompt.notes,
            timestamp: new Date().toISOString(),
          },
          ...existingVersions,
        ];

    updatedList = [...currentList];
    updatedList[idx] = {
      ...prompt,
      versions: newVersions,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updatedList = [
      {
        ...prompt,
        versions: [
          {
            version: prompt.version,
            systemPrompt: prompt.systemPrompt,
            notes: prompt.notes,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      ...currentList,
    ];
  }

  all[prompt.engineId] = updatedList;
  localStorage.setItem(ENGINE_PROMPTS_KEY, JSON.stringify(all));
  return updatedList;
}

export function deletePromptForEngine(engineId: EngineId, id: string): PromptRecord[] {
  const all = getAllEnginePrompts();
  const currentList = all[engineId] || [];
  const updatedList = currentList.filter((p) => p.id !== id);
  all[engineId] = updatedList;
  localStorage.setItem(ENGINE_PROMPTS_KEY, JSON.stringify(all));
  return updatedList;
}

export function renamePromptForEngine(engineId: EngineId, id: string, newName: string): PromptRecord[] {
  const all = getAllEnginePrompts();
  const currentList = all[engineId] || [];
  const idx = currentList.findIndex((p) => p.id === id);
  if (idx >= 0) {
    currentList[idx] = {
      ...currentList[idx],
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    };
    all[engineId] = [...currentList];
    localStorage.setItem(ENGINE_PROMPTS_KEY, JSON.stringify(all));
  }
  return all[engineId];
}

export function duplicatePromptForEngine(engineId: EngineId, id: string): PromptRecord[] {
  const all = getAllEnginePrompts();
  const currentList = all[engineId] || [];
  const target = currentList.find((p) => p.id === id);
  if (target) {
    const duplicated: PromptRecord = {
      ...target,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${target.name} (نسخة مكررة)`,
      updatedAt: new Date().toISOString(),
      versions: target.versions ? [...target.versions] : [],
    };
    all[engineId] = [duplicated, ...currentList];
    localStorage.setItem(ENGINE_PROMPTS_KEY, JSON.stringify(all));
  }
  return all[engineId];
}

// -------------------------------------------------------------
// DRAFTS PERSISTENCE PER ENGINE
// -------------------------------------------------------------

export function getAllEngineDrafts(): Record<EngineId, EngineDraft> {
  const drafts: Record<EngineId, EngineDraft> = {
    brand_strategy: getDefaultDraft('brand_strategy'),
    idea_generator: getDefaultDraft('idea_generator'),
    content_writer: getDefaultDraft('content_writer'),
    content_adapter: getDefaultDraft('content_adapter'),
  };

  try {
    const raw = localStorage.getItem(ENGINE_DRAFTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const e of ENGINE_LIST) {
        if (parsed[e.id]) {
          drafts[e.id] = parsed[e.id];
        }
      }
    }
  } catch (err) {
    console.error('Failed to load drafts by engine:', err);
  }

  return drafts;
}

export function saveDraftForEngine(engineId: EngineId, draft: EngineDraft): void {
  try {
    const drafts = getAllEngineDrafts();
    drafts[engineId] = draft;
    localStorage.setItem(ENGINE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.error('Failed to save draft for engine:', err);
  }
}

// -------------------------------------------------------------
// CUSTOM TEST BRIEF TEMPLATES
// -------------------------------------------------------------

export function getCustomBriefTemplates(): TestBriefTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_BRIEFS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom brief templates:', err);
    return [];
  }
}

export function getAllBriefTemplates(): TestBriefTemplate[] {
  const custom = getCustomBriefTemplates();
  return [...DEFAULT_SAMPLE_BRIEFS, ...custom];
}

export function saveCustomBriefTemplate(template: TestBriefTemplate): TestBriefTemplate[] {
  try {
    const existing = getCustomBriefTemplates();
    const idx = existing.findIndex((b) => b.id === template.id);
    let updated: TestBriefTemplate[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = { ...template, isDefault: false };
    } else {
      updated = [{ ...template, isDefault: false, createdAt: new Date().toISOString() }, ...existing];
    }
    localStorage.setItem(CUSTOM_BRIEFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save custom brief template:', err);
    return getCustomBriefTemplates();
  }
}

export function deleteCustomBriefTemplate(id: string): TestBriefTemplate[] {
  try {
    const existing = getCustomBriefTemplates();
    const filtered = existing.filter((b) => b.id !== id);
    localStorage.setItem(CUSTOM_BRIEFS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete custom brief template:', err);
    return getCustomBriefTemplates();
  }
}

export function duplicateCustomBriefTemplate(template: TestBriefTemplate): TestBriefTemplate[] {
  try {
    const newTemplate: TestBriefTemplate = {
      ...template,
      id: `custom-brief-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${template.name} (نسخة)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    return saveCustomBriefTemplate(newTemplate);
  } catch (err) {
    console.error('Failed to duplicate brief template:', err);
    return getCustomBriefTemplates();
  }
}

// -------------------------------------------------------------
// EXPERIMENT RUNS HISTORY
// -------------------------------------------------------------

export function getExperimentHistory(): ExperimentRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
    return [];
  }
}

export function saveExperimentRun(run: ExperimentRun): ExperimentRun[] {
  try {
    const existing = getExperimentHistory();
    const index = existing.findIndex((r) => r.id === run.id);
    let updated: ExperimentRun[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = run;
    } else {
      updated = [run, ...existing];
    }
    if (updated.length > 50) {
      updated = updated.slice(0, 50);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save experiment run to localStorage', e);
    return getExperimentHistory();
  }
}

export function deleteExperimentRun(id: string): ExperimentRun[] {
  try {
    const existing = getExperimentHistory();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error('Failed to delete experiment from localStorage', e);
    return getExperimentHistory();
  }
}

export function clearExperimentHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}

// -------------------------------------------------------------
// PROJECT-SPECIFIC AI MODEL PERSISTENCE
// -------------------------------------------------------------

const ACTIVE_PROJECT_STORAGE_KEY = 'ai_marketing_lab_active_project_id_v2';
const PROJECT_MODELS_STORAGE_KEY = 'ai_marketing_lab_project_models_v1';
const PROJECT_WORKFLOW_PREFIX = 'ai_marketing_lab_workflow_proj_';
const PROJECT_SAVED_PLANS_KEY = 'ai_marketing_lab_project_plans_v1';

export const DEFAULT_AI_MODEL = 'gemini-3.8-flash';

export function getAllProjectModels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PROJECT_MODELS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load project models from localStorage:', e);
    return {};
  }
}

export function getProjectModel(projectId: string): string {
  if (!projectId) return DEFAULT_AI_MODEL;
  const models = getAllProjectModels();
  return models[projectId] || DEFAULT_AI_MODEL;
}

export function setProjectModel(projectId: string, model: string): void {
  if (!projectId || !model) return;
  try {
    const models = getAllProjectModels();
    models[projectId] = model;
    localStorage.setItem(PROJECT_MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch (e) {
    console.error('Failed to save project model to localStorage:', e);
  }
}

// -------------------------------------------------------------
// ACTIVE PROJECT MANAGEMENT
// -------------------------------------------------------------

export function getActiveProjectId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SAMPLE_BRIEFS[0]?.id || 'sample-egypt-burger';
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id);
  } catch (e) {
    console.error(e);
  }
}

export function getAllProjects(): import('../types.ts').Project[] {
  const templates = getAllBriefTemplates();
  const models = getAllProjectModels();

  return templates.map((t) => ({
    id: t.id,
    name: t.name || t.brandName || 'مشروع بدون اسم',
    brief: {
      brandName: t.brandName || '',
      country: t.country || '',
      industry: t.industry || '',
      targetAudience: t.targetAudience || '',
      marketingObjective: t.marketingObjective || '',
      languageDialect: t.languageDialect || '',
      clientBrief: t.clientBrief || '',
      additionalContext: t.additionalContext || '',
      isSynthetic: false,
    },
    selectedModel: models[t.id] || DEFAULT_AI_MODEL,
    updatedAt: t.createdAt || new Date().toISOString(),
    isDefault: t.isDefault,
  }));
}

export function getProjectById(id: string): import('../types.ts').Project | undefined {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id);
}

// -------------------------------------------------------------
// SEQUENTIAL WORKFLOW STATE PERSISTENCE (PROJECT-SCOPED)
// -------------------------------------------------------------

const LEGACY_WORKFLOW_STORAGE_KEY = 'ai_marketing_lab_workflow_v1';

export function getDefaultWorkflowState(projectId?: string): import('../types.ts').WorkflowProjectState {
  const targetId = projectId || getActiveProjectId();
  const currentModel = getProjectModel(targetId);

  return {
    currentStage: 1,
    strategyVersions: [],
    approvedStrategy: null,
    ideas: [],
    selectedIdeaIds: [],
    ideasApproved: false,
    ideaFormats: {},
    formatsConfirmed: false,
    deliverables: [],
    planRunId: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    selectedModel: currentModel,
    activeModelUsed: undefined,
    useHumanReferences: false,
    lastReferencesUsed: undefined,
  };
}

export function getWorkflowStateForProject(projectId: string): import('../types.ts').WorkflowProjectState {
  const targetId = projectId || getActiveProjectId();
  const currentModel = getProjectModel(targetId);

  try {
    const key = `${PROJECT_WORKFLOW_PREFIX}${targetId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultWorkflowState(targetId),
        ...parsed,
        selectedModel: currentModel,
      };
    }

    // Check legacy global storage fallback if this is the active project
    const legacyRaw = localStorage.getItem(LEGACY_WORKFLOW_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      return {
        ...getDefaultWorkflowState(targetId),
        ...legacyParsed,
        selectedModel: currentModel,
      };
    }
  } catch (err) {
    console.error('Failed to load workflow state for project:', err);
  }

  return getDefaultWorkflowState(targetId);
}

export function saveWorkflowStateForProject(
  projectId: string,
  state: import('../types.ts').WorkflowProjectState
): void {
  const targetId = projectId || getActiveProjectId();
  try {
    const key = `${PROJECT_WORKFLOW_PREFIX}${targetId}`;
    localStorage.setItem(key, JSON.stringify(state));
    // Also update legacy key for backward compatibility
    localStorage.setItem(LEGACY_WORKFLOW_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save workflow state for project:', err);
  }
}

export function resetWorkflowStateForProject(
  projectId: string
): import('../types.ts').WorkflowProjectState {
  const targetId = projectId || getActiveProjectId();
  const freshState = getDefaultWorkflowState(targetId);
  saveWorkflowStateForProject(targetId, freshState);
  return freshState;
}

export function getSavedWorkflowState(): import('../types.ts').WorkflowProjectState {
  return getWorkflowStateForProject(getActiveProjectId());
}

export function saveWorkflowState(state: import('../types.ts').WorkflowProjectState): void {
  saveWorkflowStateForProject(getActiveProjectId(), state);
}

// -------------------------------------------------------------
// PROJECT SAVED PLANS (Multi-plan experiment support)
// -------------------------------------------------------------

export function getAllProjectSavedPlans(): import('../types.ts').ProjectSavedPlan[] {
  try {
    const raw = localStorage.getItem(PROJECT_SAVED_PLANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load project plans:', e);
    return [];
  }
}

export function getSavedPlansForProject(projectId: string): import('../types.ts').ProjectSavedPlan[] {
  const all = getAllProjectSavedPlans();
  return all.filter((p) => p.projectId === projectId);
}

export function saveProjectPlan(plan: import('../types.ts').ProjectSavedPlan): import('../types.ts').ProjectSavedPlan[] {
  try {
    const all = getAllProjectSavedPlans();
    const existingIdx = all.findIndex((p) => p.id === plan.id);
    let updated: import('../types.ts').ProjectSavedPlan[];
    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = plan;
    } else {
      updated = [plan, ...all];
    }
    localStorage.setItem(PROJECT_SAVED_PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save project plan:', e);
    return getAllProjectSavedPlans();
  }
}

export function deleteProjectPlan(planId: string): import('../types.ts').ProjectSavedPlan[] {
  try {
    const all = getAllProjectSavedPlans();
    const filtered = all.filter((p) => p.id !== planId);
    localStorage.setItem(PROJECT_SAVED_PLANS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error('Failed to delete project plan:', e);
    return getAllProjectSavedPlans();
  }
}


