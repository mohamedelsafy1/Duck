import React, { useState, useEffect, useRef } from 'react';
import {
  EngineId,
  EngineType,
  EngineDraft,
  PromptRecord,
  PromptVersionRecord,
  ClientBrief,
  ReferenceExample,
  ExperimentRun,
  StrategyVersion,
  ContentIdea,
  ContentFormatType,
  ContentDeliverable,
  WorkflowProjectState,
  Project,
  AIModelOption,
  SUPPORTED_AI_MODELS,
  ProjectSavedPlan,
} from './types.ts';
import {
  ENGINE_LIST,
  engineTypeToId,
  engineIdToType,
  getAllEnginePrompts,
  savePromptForEngine,
  deletePromptForEngine,
  renamePromptForEngine,
  duplicatePromptForEngine,
  getAllEngineDrafts,
  saveDraftForEngine,
  getExperimentHistory,
  saveExperimentRun,
  deleteExperimentRun,
  clearExperimentHistory,
  getSavedWorkflowState,
  saveWorkflowState,
  getDefaultWorkflowState,
  DEFAULT_SAMPLE_BRIEFS,
  getAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  getProjectModel,
  setProjectModel,
  getWorkflowStateForProject,
  saveWorkflowStateForProject,
  resetWorkflowStateForProject,
  saveProjectPlan,
  getProjectById,
} from './utils/storage.ts';
import { WorkflowProgressBar } from './components/workflow/WorkflowProgressBar.tsx';
import { Stage1BrandStrategyView } from './components/workflow/Stage1BrandStrategyView.tsx';
import { Stage2ContentIdeasView } from './components/workflow/Stage2ContentIdeasView.tsx';
import { Stage3IdeaSelectionView } from './components/workflow/Stage3IdeaSelectionView.tsx';
import { Stage4FormatSelectionView } from './components/workflow/Stage4FormatSelectionView.tsx';
import { Stage5ContentProductionView } from './components/workflow/Stage5ContentProductionView.tsx';
import { HumanReferencesWorkflowBar } from './components/workflow/HumanReferencesWorkflowBar.tsx';
import { ReferencesInspectionModal } from './components/workflow/ReferencesInspectionModal.tsx';
import { ResetWorkflowModal } from './components/workflow/ResetWorkflowModal.tsx';
import { ProjectModelSelector } from './components/workflow/ProjectModelSelector.tsx';
import { Stage1PromptEditor } from './components/Stage1PromptEditor.tsx';
import { Stage2TestInputs } from './components/Stage2TestInputs.tsx';
import { SavedPromptsModal } from './components/SavedPromptsModal.tsx';
import { ExperimentHistoryModal } from './components/ExperimentHistoryModal.tsx';
import { DatasetManagerView } from './components/dataset/DatasetManagerView.tsx';
import {
  FileText,
  Lightbulb,
  CheckSquare,
  LayoutGrid,
  PenTool,
  FolderOpen,
  History,
  Sliders,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Settings2,
  X,
  Sparkles,
  Database,
} from 'lucide-react';

const CLIENT_BRIEF_STORAGE_KEY = 'ai_marketing_lab_brief_v1';

export default function App() {
  // Primary Top-level navigation ('workflow' or 'dataset')
  const [mainNav, setMainNav] = useState<'workflow' | 'dataset'>('workflow');

  // Multi-Project & Model Management
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => getActiveProjectId());

  const activeProject: Project =
    projects.find((p) => p.id === activeProjectId) || projects[0] || {
      id: 'sample-egypt-burger',
      name: 'مشروع افتراضي',
      brief: {
        brandName: '',
        country: '',
        industry: '',
        targetAudience: '',
        marketingObjective: '',
        languageDialect: '',
        clientBrief: '',
        additionalContext: '',
        isSynthetic: false,
      },
      selectedModel: 'gemini-3.8-flash',
      updatedAt: new Date().toISOString(),
    };

  const activeProjectModel = activeProject.selectedModel || getProjectModel(activeProjectId);

  // Workflow Project State (Strict sequential 5-stage approval, scoped per active project)
  const [workflowState, setWorkflowState] = useState<WorkflowProjectState>(() =>
    getWorkflowStateForProject(activeProjectId)
  );

  // Reset Workflow Modal state & feedback toast
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetToast, setResetToast] = useState<string | null>(null);

  // In-flight request cancellation & race condition avoidance
  const abortControllerRef = useRef<AbortController | null>(null);
  const activePlanRunIdRef = useRef<string>(workflowState.planRunId || `plan-${Date.now()}`);

  // Keep activePlanRunIdRef in sync with workflowState.planRunId
  useEffect(() => {
    if (workflowState.planRunId) {
      activePlanRunIdRef.current = workflowState.planRunId;
    }
  }, [workflowState.planRunId]);

  // Active view: 'workflow' (the primary 5-stage approval workspace) or 'prompt_editor' / 'brief_editor'
  const [activeModalView, setActiveModalView] = useState<
    'none' | 'brief_editor' | 'prompt_editor' | 'saved_prompts' | 'history'
  >('none');

  // Client Brief (linked to active project)
  const [brief, setBrief] = useState<ClientBrief>(() => {
    const proj = getProjectById(activeProjectId);
    if (proj?.brief?.brandName) return proj.brief;
    try {
      const raw = localStorage.getItem(CLIENT_BRIEF_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    const sample = DEFAULT_SAMPLE_BRIEFS[0];
    if (sample) {
      return {
        brandName: sample.brandName,
        country: sample.country,
        industry: sample.industry,
        targetAudience: sample.targetAudience,
        marketingObjective: sample.marketingObjective,
        languageDialect: sample.languageDialect,
        clientBrief: sample.clientBrief,
        additionalContext: sample.additionalContext,
        isSynthetic: false,
      };
    }
    return {
      brandName: '',
      country: '',
      industry: '',
      targetAudience: '',
      marketingObjective: '',
      languageDialect: '',
      clientBrief: '',
      additionalContext: '',
      isSynthetic: false,
    };
  });

  // Reference Examples
  const [referenceExamples, setReferenceExamples] = useState<ReferenceExample[]>([]);

  // Engine Prompts & Drafts (Independent per engine)
  const [activeEngineId, setActiveEngineId] = useState<EngineId>('brand_strategy');
  const [draftsByEngine, setDraftsByEngine] = useState<Record<EngineId, EngineDraft>>(() =>
    getAllEngineDrafts()
  );
  const [promptsByEngine, setPromptsByEngine] = useState<Record<EngineId, PromptRecord[]>>(() =>
    getAllEnginePrompts()
  );

  // History & Health
  const [history, setHistory] = useState<ExperimentRun[]>(() => getExperimentHistory());
  const [apiHealth, setApiHealth] = useState<{ configured: boolean; message?: string } | null>(null);

  // Loading & Error states
  const [isStrategyGenerating, setIsStrategyGenerating] = useState(false);
  const [isStrategyRevising, setIsStrategyRevising] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const [isIdeasGenerating, setIsIdeasGenerating] = useState(false);
  const [isShowMoreLoading, setIsShowMoreLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);

  const [isProductionBatchRunning, setIsProductionBatchRunning] = useState(false);
  const [regeneratingDeliverableId, setRegeneratingDeliverableId] = useState<string | null>(null);
  const [showReferencesModal, setShowReferencesModal] = useState(false);

  const handleToggleHumanReferences = (enabled: boolean) => {
    setWorkflowState((prev) => ({
      ...prev,
      useHumanReferences: enabled,
    }));
  };

  // Switch project handler
  const handleSwitchProject = (newProjectId: string) => {
    if (newProjectId === activeProjectId) return;

    // 1. Abort in-flight requests for the previous project
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Persist current project workflow state before switching
    saveWorkflowStateForProject(activeProjectId, workflowState);

    // 3. Update active project
    setActiveProjectIdState(newProjectId);
    setActiveProjectId(newProjectId);

    const targetProject = projects.find((p) => p.id === newProjectId);
    if (targetProject) {
      setBrief(targetProject.brief);
    }

    // 4. Load workflow state for target project
    const targetState = getWorkflowStateForProject(newProjectId);
    setWorkflowState(targetState);
    activePlanRunIdRef.current = targetState.planRunId || `plan-${Date.now()}`;

    // 5. Reset loading & transient error states
    setIsStrategyGenerating(false);
    setIsStrategyRevising(false);
    setStrategyError(null);
    setIsIdeasGenerating(false);
    setIsShowMoreLoading(false);
    setIdeasError(null);
    setIsProductionBatchRunning(false);
    setRegeneratingDeliverableId(null);
  };

  // Model selection handler for active project
  const handleSelectModel = (newModelId: string) => {
    setProjectModel(activeProjectId, newModelId);

    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectId ? { ...p, selectedModel: newModelId } : p))
    );

    setWorkflowState((prev) => ({
      ...prev,
      selectedModel: newModelId,
    }));
  };

  // Persist workflow state whenever it updates for active project
  useEffect(() => {
    saveWorkflowStateForProject(activeProjectId, workflowState);
  }, [activeProjectId, workflowState]);

  // Persist brief whenever it updates
  useEffect(() => {
    localStorage.setItem(CLIENT_BRIEF_STORAGE_KEY, JSON.stringify(brief));
  }, [brief]);

  // Check API health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiHealth(data))
      .catch((err) => {
        console.warn('Could not reach backend health check:', err);
        setApiHealth({ configured: false, message: 'تعذر الاتصال بخادم التطبيق.' });
      });
  }, []);

  const currentEngineMeta = ENGINE_LIST.find((e) => e.id === activeEngineId) || ENGINE_LIST[0];
  const currentDraft = draftsByEngine[activeEngineId];
  const currentSavedPrompts = promptsByEngine[activeEngineId] || [];

  const updateActiveDraft = (updates: Partial<EngineDraft>) => {
    setDraftsByEngine((prev) => {
      const updatedDraft: EngineDraft = {
        ...prev[activeEngineId],
        ...updates,
      };
      saveDraftForEngine(activeEngineId, updatedDraft);
      return {
        ...prev,
        [activeEngineId]: updatedDraft,
      };
    });
  };

  // -------------------------------------------------------------
  // STAGE 1: BRAND STRATEGY ACTIONS
  // -------------------------------------------------------------

  const handleGenerateBrandStrategy = async () => {
    if (!brief.brandName.trim()) {
      alert('يرجى تحديد اسم البراند وبيانات الموجز أولاً.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const currentRunId = activePlanRunIdRef.current;

    setIsStrategyGenerating(true);
    setStrategyError(null);

    try {
      const activeExamples = referenceExamples.filter((e) => e.enabled);
      const res = await fetch('/api/workflow/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          systemPrompt: draftsByEngine['brand_strategy'].systemPrompt,
          brief,
          referenceExamples: activeExamples,
          useHumanReferences: Boolean(workflowState.useHumanReferences),
          model: activeProjectModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توليد استراتيجية البراند.');
      }

      if (activePlanRunIdRef.current !== currentRunId) return;

      const modelUsed = data.model || activeProjectModel;
      const newVersion: StrategyVersion = {
        version: workflowState.strategyVersions.length + 1,
        content: data.strategy,
        timestamp: new Date().toISOString(),
        isApproved: false,
        modelUsed,
      };

      setWorkflowState((prev) => ({
        ...prev,
        currentStage: 1,
        strategyVersions: [...prev.strategyVersions, newVersion],
        activeModelUsed: modelUsed,
        // If a new strategy is generated, downstream stages are reset
        approvedStrategy: null,
        ideasApproved: false,
        formatsConfirmed: false,
        lastReferencesUsed: data.usedHumanReferences
          ? {
              count: data.injectedReferencesCount,
              sampleTitles: data.injectedReferencesSample || [],
              usedAtStage: 'استراتيجية البراند (Brand Strategy)',
            }
          : undefined,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setStrategyError(err?.message || 'حدث خطأ أثناء الاتصال بالنموذج.');
    } finally {
      if (activePlanRunIdRef.current === currentRunId) {
        setIsStrategyGenerating(false);
      }
    }
  };

  const handleReviseBrandStrategy = async (reasons: string[], customFeedback: string) => {
    const latestVersion =
      workflowState.strategyVersions[workflowState.strategyVersions.length - 1];
    if (!latestVersion) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const currentRunId = activePlanRunIdRef.current;

    setIsStrategyRevising(true);
    setStrategyError(null);

    try {
      const res = await fetch('/api/workflow/revise-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          systemPrompt: draftsByEngine['brand_strategy'].systemPrompt,
          brief,
          previousStrategy: latestVersion.content,
          revisionReasons: reasons,
          customFeedback,
          useHumanReferences: Boolean(workflowState.useHumanReferences),
          model: activeProjectModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إعادة صياغة الاستراتيجية.');
      }

      if (activePlanRunIdRef.current !== currentRunId) return;

      const modelUsed = data.model || activeProjectModel;
      const revisedVersion: StrategyVersion = {
        version: workflowState.strategyVersions.length + 1,
        content: data.strategy,
        timestamp: new Date().toISOString(),
        isApproved: false,
        rejectionReasons: reasons,
        rejectionFeedback: customFeedback,
        modelUsed,
      };

      setWorkflowState((prev) => ({
        ...prev,
        strategyVersions: [...prev.strategyVersions, revisedVersion],
        activeModelUsed: modelUsed,
        // Any revision invalidates downstream approval!
        approvedStrategy: null,
        ideasApproved: false,
        formatsConfirmed: false,
        lastReferencesUsed: data.usedHumanReferences
          ? {
              count: data.injectedReferencesCount,
              sampleTitles: data.injectedReferencesSample || [],
              usedAtStage: 'مراجعة وتعديل الاستراتيجية',
            }
          : undefined,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setStrategyError(err?.message || 'حدث خطأ أثناء إعادة صياغة الاستراتيجية.');
    } finally {
      if (activePlanRunIdRef.current === currentRunId) {
        setIsStrategyRevising(false);
      }
    }
  };

  const handleApproveStrategy = (strategyContent: string) => {
    setWorkflowState((prev) => ({
      ...prev,
      approvedStrategy: strategyContent,
      strategyApproved: true,
      currentStage: 2, // Unlock Stage 2: Content Ideas
    }));
  };

  // -------------------------------------------------------------
  // STAGE 2: CONTENT IDEAS ACTIONS
  // -------------------------------------------------------------

  const handleGenerateIdeas = async (count: number = 10) => {
    if (!workflowState.approvedStrategy) {
      alert('يجب اعتماد استراتيجية البراند أولاً قبل توليد الأفكار.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const currentRunId = activePlanRunIdRef.current;

    setIsIdeasGenerating(true);
    setIdeasError(null);

    try {
      const res = await fetch('/api/workflow/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          systemPrompt: draftsByEngine['idea_generator'].systemPrompt,
          brief,
          approvedStrategy: workflowState.approvedStrategy,
          count,
          useHumanReferences: Boolean(workflowState.useHumanReferences),
          model: activeProjectModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توليد أفكار المحتوى.');
      }

      if (activePlanRunIdRef.current !== currentRunId) return;

      const modelUsed = data.model || activeProjectModel;
      const formattedIdeas = (data.ideas || []).map((idea: any) => ({
        ...idea,
        modelUsed,
      }));

      setWorkflowState((prev) => ({
        ...prev,
        ideas: formattedIdeas,
        selectedIdeaIds: formattedIdeas.slice(0, Math.min(3, formattedIdeas.length)).map((i: any) => i.id),
        ideasApproved: false,
        formatsConfirmed: false,
        activeModelUsed: modelUsed,
        lastReferencesUsed: data.usedHumanReferences
          ? {
              count: data.injectedReferencesCount,
              sampleTitles: data.injectedReferencesSample || [],
              usedAtStage: 'توليد أفكار المحتوى (Content Ideas)',
            }
          : undefined,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setIdeasError(err?.message || 'حدث خطأ أثناء توليد الأفكار.');
    } finally {
      if (activePlanRunIdRef.current === currentRunId) {
        setIsIdeasGenerating(false);
      }
    }
  };

  const handleShowMoreIdeas = async (count: number = 5) => {
    if (!workflowState.approvedStrategy) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const currentRunId = activePlanRunIdRef.current;

    setIsShowMoreLoading(true);
    setIdeasError(null);

    try {
      const existingTitles = workflowState.ideas.map((i) => i.title);
      const res = await fetch('/api/workflow/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          systemPrompt: draftsByEngine['idea_generator'].systemPrompt,
          brief,
          approvedStrategy: workflowState.approvedStrategy,
          count,
          existingIdeaTitles: existingTitles,
          useHumanReferences: Boolean(workflowState.useHumanReferences),
          model: activeProjectModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل جلب أفكار إضافية.');
      }

      if (activePlanRunIdRef.current !== currentRunId) return;

      const modelUsed = data.model || activeProjectModel;
      const newIdeas = (data.ideas || []).map((idea: any) => ({
        ...idea,
        modelUsed,
      }));

      setWorkflowState((prev) => ({
        ...prev,
        ideas: [...prev.ideas, ...newIdeas],
        activeModelUsed: modelUsed,
        lastReferencesUsed: data.usedHumanReferences
          ? {
              count: data.injectedReferencesCount,
              sampleTitles: data.injectedReferencesSample || [],
              usedAtStage: 'توليد أفكار إضافية',
            }
          : prev.lastReferencesUsed,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setIdeasError(err?.message || 'حدث خطأ أثناء جلب أفكار إضافية.');
    } finally {
      if (activePlanRunIdRef.current === currentRunId) {
        setIsShowMoreLoading(false);
      }
    }
  };

  const handleToggleIdeaSelection = (id: string) => {
    setWorkflowState((prev) => {
      const isSelected = prev.selectedIdeaIds.includes(id);
      const updated = isSelected
        ? prev.selectedIdeaIds.filter((item) => item !== id)
        : [...prev.selectedIdeaIds, id];
      return {
        ...prev,
        selectedIdeaIds: updated,
      };
    });
  };

  const handleSelectAllIdeas = () => {
    setWorkflowState((prev) => ({
      ...prev,
      selectedIdeaIds: prev.ideas.map((i) => i.id),
    }));
  };

  const handleDeselectAllIdeas = () => {
    setWorkflowState((prev) => ({
      ...prev,
      selectedIdeaIds: [],
    }));
  };

  // -------------------------------------------------------------
  // STAGE 3: IDEA SELECTION CONFIRMATION
  // -------------------------------------------------------------

  const handleConfirmIdeaSelection = () => {
    if (workflowState.selectedIdeaIds.length === 0) {
      alert('يرجى اختيار فكرة واحدة على الأقل للاعتماد.');
      return;
    }

    setWorkflowState((prev) => {
      // Default initial format mapping if not set yet
      const initialFormats: Record<string, ContentFormatType[]> = { ...prev.ideaFormats };
      prev.selectedIdeaIds.forEach((id) => {
        if (!initialFormats[id] || initialFormats[id].length === 0) {
          initialFormats[id] = ['carousel']; // default
        }
      });

      return {
        ...prev,
        ideasApproved: true,
        ideaFormats: initialFormats,
        currentStage: 4, // Unlock Stage 4: Content Format Selection
      };
    });
  };

  // -------------------------------------------------------------
  // STAGE 4: FORMAT SELECTION ACTIONS
  // -------------------------------------------------------------

  const handleToggleIdeaFormat = (ideaId: string, format: ContentFormatType) => {
    setWorkflowState((prev) => {
      const currentFormats = prev.ideaFormats[ideaId] || [];
      const updated = currentFormats.includes(format)
        ? currentFormats.filter((f) => f !== format)
        : [...currentFormats, format];
      return {
        ...prev,
        ideaFormats: {
          ...prev.ideaFormats,
          [ideaId]: updated,
        },
      };
    });
  };

  const handleSetIdeaFormats = (ideaId: string, formats: ContentFormatType[]) => {
    setWorkflowState((prev) => ({
      ...prev,
      ideaFormats: {
        ...prev.ideaFormats,
        [ideaId]: formats,
      },
    }));
  };

  const handleApplyBulkFormats = (formats: ContentFormatType[]) => {
    setWorkflowState((prev) => {
      const updated: Record<string, ContentFormatType[]> = {};
      prev.selectedIdeaIds.forEach((id) => {
        updated[id] = [...formats];
      });
      return {
        ...prev,
        ideaFormats: updated,
      };
    });
  };

  const handleConfirmFormatsAndStartProduction = async () => {
    const selectedIdeas = workflowState.ideas.filter((i) =>
      workflowState.selectedIdeaIds.includes(i.id)
    );

    // Build planned deliverables list
    const plannedDeliverables: ContentDeliverable[] = [];
    selectedIdeas.forEach((idea) => {
      const formats = workflowState.ideaFormats[idea.id] || [];
      formats.forEach((fmt) => {
        plannedDeliverables.push({
          id: `deliv-${idea.id}-${fmt}`,
          ideaId: idea.id,
          ideaTitle: idea.title,
          format: fmt,
          content: '',
          originalContent: '',
          isEdited: false,
          isApproved: false,
          status: 'pending',
          updatedAt: new Date().toISOString(),
        });
      });
    });

    if (plannedDeliverables.length === 0) {
      alert('يرجى تحديد قالب واحد على الأقل لفكرة واحدة لبدء الإنتاج.');
      return;
    }

    setWorkflowState((prev) => ({
      ...prev,
      formatsConfirmed: true,
      deliverables: plannedDeliverables,
      currentStage: 5, // Unlock Stage 5: Content Production
    }));

    // Trigger initial batch generation of pending deliverables
    setTimeout(() => {
      generatePendingDeliverables(plannedDeliverables);
    }, 100);
  };

  // -------------------------------------------------------------
  // STAGE 5: CONTENT PRODUCTION ACTIONS
  // -------------------------------------------------------------

  const generateSingleDeliverableItem = async (
    deliv: ContentDeliverable
  ): Promise<{ content: string; modelUsed: string }> => {
    const matchedIdea = workflowState.ideas.find((i) => i.id === deliv.ideaId);
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const res = await fetch('/api/workflow/produce-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ac.signal,
      body: JSON.stringify({
        systemPrompt: draftsByEngine['content_writer'].systemPrompt,
        brief,
        approvedStrategy: workflowState.approvedStrategy,
        idea: matchedIdea,
        format: deliv.format,
        useHumanReferences: Boolean(workflowState.useHumanReferences),
        model: activeProjectModel,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل توليد المخرج.');
    }
    if (data.usedHumanReferences) {
      setWorkflowState((prev) => ({
        ...prev,
        lastReferencesUsed: {
          count: data.injectedReferencesCount,
          sampleTitles: data.injectedReferencesSample || [],
          usedAtStage: `إنتاج المحتوى (${deliv.format})`,
        },
      }));
    }
    return {
      content: data.content,
      modelUsed: data.model || activeProjectModel,
    };
  };

  const generatePendingDeliverables = async (initialList?: ContentDeliverable[]) => {
    setIsProductionBatchRunning(true);
    const currentList = initialList || workflowState.deliverables;
    const currentRunId = activePlanRunIdRef.current;

    for (const item of currentList) {
      if (activePlanRunIdRef.current !== currentRunId) break;
      if (item.status === 'completed' && item.content) {
        continue; // preserve already completed!
      }

      setWorkflowState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((d) =>
          d.id === item.id ? { ...d, status: 'generating' } : d
        ),
      }));

      try {
        const result = await generateSingleDeliverableItem(item);
        if (activePlanRunIdRef.current !== currentRunId) break;

        setWorkflowState((prev) => ({
          ...prev,
          deliverables: prev.deliverables.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  content: result.content,
                  originalContent: result.content,
                  modelUsed: result.modelUsed,
                  status: 'completed',
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      } catch (err: any) {
        if (err.name === 'AbortError' || activePlanRunIdRef.current !== currentRunId) break;
        console.error(`Error generating deliverable ${item.id}:`, err);
        setWorkflowState((prev) => ({
          ...prev,
          deliverables: prev.deliverables.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  status: 'error',
                  errorMessage: err?.message || 'فشل التوليد',
                }
              : d
          ),
        }));
      }
    }

    if (activePlanRunIdRef.current === currentRunId) {
      setIsProductionBatchRunning(false);
    }
  };

  const handleRegenerateDeliverable = async (id: string) => {
    const target = workflowState.deliverables.find((d) => d.id === id);
    if (!target) return;

    setRegeneratingDeliverableId(id);

    try {
      const result = await generateSingleDeliverableItem(target);
      setWorkflowState((prev) => ({
        ...prev,
        deliverables: prev.deliverables.map((d) =>
          d.id === id
            ? {
                ...d,
                content: result.content,
                originalContent: result.content,
                modelUsed: result.modelUsed,
                isEdited: false,
                status: 'completed',
                updatedAt: new Date().toISOString(),
              }
            : d
        ),
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      alert(`فشل إعادة توليد هذا المخرج: ${err?.message || 'خطأ غير معروف'}`);
    } finally {
      setRegeneratingDeliverableId(null);
    }
  };

  const handleUpdateDeliverableContent = (id: string, newContent: string) => {
    setWorkflowState((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d) =>
        d.id === id
          ? {
              ...d,
              content: newContent,
              isEdited: true,
              updatedAt: new Date().toISOString(),
            }
          : d
      ),
    }));
  };

  const handleToggleDeliverableApproved = (id: string) => {
    setWorkflowState((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d) =>
        d.id === id ? { ...d, isApproved: !d.isApproved } : d
      ),
    }));
  };

  // Initiate reset: show confirmation modal only if meaningful transient data exists
  const handleInitiateResetWorkflow = () => {
    const hasStrategy = workflowState.strategyVersions.length > 0;
    const hasIdeas = workflowState.ideas.length > 0;
    const hasDeliverables = workflowState.deliverables.length > 0;

    if (hasStrategy || hasIdeas || hasDeliverables || workflowState.currentStage > 1) {
      setIsResetModalOpen(true);
    } else {
      // Direct reset when no meaningful user data would be lost
      handleExecuteReset(false);
    }
  };

  // Execute reset: clear transient workflow state, preserve persistent project data & models
  const handleExecuteReset = (saveToHistoryFirst: boolean) => {
    // 1. Cancel in-flight requests immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Optionally save previous plan into project history
    if (saveToHistoryFirst) {
      const activeStrategyText =
        workflowState.approvedStrategy ||
        workflowState.strategyVersions[workflowState.strategyVersions.length - 1]?.content ||
        '';

      const newPlanId = `plan-${Date.now()}`;
      const savedPlanRecord: ProjectSavedPlan = {
        id: newPlanId,
        projectId: activeProjectId,
        planRunId: workflowState.planRunId || `run-${Date.now()}`,
        name: `خطة ${activeProject.name} (${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})`,
        createdAt: new Date().toISOString(),
        selectedModel: activeProjectModel,
        strategy: activeStrategyText,
        ideas: workflowState.ideas.filter((i) => workflowState.selectedIdeaIds.includes(i.id)),
        deliverablesCount: workflowState.deliverables.filter((d) => d.status === 'completed').length,
        notes: 'خطة محفوظة مسبقاً قبل إعادة تعيين مسار العمل',
      };
      saveProjectPlan(savedPlanRecord);

      // Also record in ExperimentRun history so it is accessible in history modal
      const runRecord: ExperimentRun = {
        id: newPlanId,
        timestamp: new Date().toISOString(),
        engineId: 'brand_strategy',
        engine: 'Brand Strategy',
        promptName: `خطة مشروع: ${activeProject.name}`,
        promptVersion: '1.0',
        systemPrompt: draftsByEngine['brand_strategy'].systemPrompt,
        brief,
        referenceExamples: [],
        output: activeStrategyText,
        model: activeProjectModel,
        durationMs: 1000,
      };
      saveExperimentRun(runRecord);
      setHistory(getExperimentHistory());
    }

    // 3. Reset workflow state for this project
    const freshState = resetWorkflowStateForProject(activeProjectId);
    freshState.selectedModel = activeProjectModel;
    freshState.useHumanReferences = workflowState.useHumanReferences;
    setWorkflowState(freshState);
    activePlanRunIdRef.current = freshState.planRunId || `plan-${Date.now()}`;

    // 4. Reset loading & transient error states
    setIsStrategyGenerating(false);
    setIsStrategyRevising(false);
    setStrategyError(null);
    setIsIdeasGenerating(false);
    setIsShowMoreLoading(false);
    setIdeasError(null);
    setIsProductionBatchRunning(false);
    setRegeneratingDeliverableId(null);

    // 5. Close modal & show user feedback
    setIsResetModalOpen(false);
    setResetToast(
      saveToHistoryFirst
        ? 'تم حفظ الخطة السابقة في السجل بنجاح، وإعادة تعيين سير العمل لبدء استراتيجية جديدة!'
        : 'تمت إعادة تعيين مسار العمل بنجاح. يمكنك الآن بدء استراتيجية جديدة.'
    );
    setTimeout(() => setResetToast(null), 4000);
  };

  // -------------------------------------------------------------
  // PROMPT LIBRARY ACTIONS
  // -------------------------------------------------------------

  const handleSavePrompt = () => {
    if (!currentDraft.promptName.trim()) {
      alert('يرجى كتابة اسم للبرومبت قبل الحفظ.');
      return;
    }
    const id = currentDraft.activePromptId || `prompt-${Date.now()}`;
    const record: PromptRecord = {
      id,
      engineId: activeEngineId,
      engine: currentEngineMeta.name,
      name: currentDraft.promptName.trim(),
      systemPrompt: currentDraft.systemPrompt,
      notes: currentDraft.promptNotes.trim(),
      version: currentDraft.promptVersion || '1.0',
      updatedAt: new Date().toISOString(),
    };

    const updatedList = savePromptForEngine(record);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));

    updateActiveDraft({
      activePromptId: id,
      hasUnsavedChanges: false,
    });
  };

  const handleSaveNewVersion = () => {
    if (!currentDraft.promptName.trim()) {
      alert('يرجى كتابة اسم للبرومبت قبل الحفظ.');
      return;
    }
    const currentVerNum = parseFloat(currentDraft.promptVersion) || 1.0;
    const nextVer = (currentVerNum + 0.1).toFixed(1);
    const id = currentDraft.activePromptId || `prompt-${Date.now()}`;

    const record: PromptRecord = {
      id,
      engineId: activeEngineId,
      engine: currentEngineMeta.name,
      name: currentDraft.promptName.trim(),
      systemPrompt: currentDraft.systemPrompt,
      notes: currentDraft.promptNotes.trim(),
      version: nextVer,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = savePromptForEngine(record);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));

    updateActiveDraft({
      activePromptId: id,
      promptVersion: nextVer,
      hasUnsavedChanges: false,
    });
  };

  const handleSaveNewPromptFromModal = (name: string, notes: string) => {
    const id = `prompt-${Date.now()}`;
    const record: PromptRecord = {
      id,
      engineId: activeEngineId,
      engine: currentEngineMeta.name,
      name,
      systemPrompt: currentDraft.systemPrompt,
      notes,
      version: '1.0',
      updatedAt: new Date().toISOString(),
    };

    const updatedList = savePromptForEngine(record);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));

    updateActiveDraft({
      promptName: name,
      promptNotes: notes,
      promptVersion: '1.0',
      activePromptId: id,
      hasUnsavedChanges: false,
    });
  };

  const handleOverwritePrompt = (id: string) => {
    const target = currentSavedPrompts.find((p) => p.id === id);
    if (!target) return;

    const record: PromptRecord = {
      ...target,
      systemPrompt: currentDraft.systemPrompt,
      notes: currentDraft.promptNotes,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = savePromptForEngine(record);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));

    updateActiveDraft({
      activePromptId: id,
      hasUnsavedChanges: false,
    });
  };

  const handleRenamePrompt = (id: string, newName: string) => {
    const updatedList = renamePromptForEngine(activeEngineId, id, newName);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));
    if (currentDraft.activePromptId === id) {
      updateActiveDraft({ promptName: newName });
    }
  };

  const handleDuplicatePrompt = (id: string) => {
    const updatedList = duplicatePromptForEngine(activeEngineId, id);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));
  };

  const handleDeletePrompt = (id: string) => {
    const updatedList = deletePromptForEngine(activeEngineId, id);
    setPromptsByEngine((prev) => ({
      ...prev,
      [activeEngineId]: updatedList,
    }));
    if (currentDraft.activePromptId === id) {
      updateActiveDraft({
        activePromptId: null,
        hasUnsavedChanges: true,
      });
    }
  };

  const handleSelectPrompt = (p: PromptRecord) => {
    updateActiveDraft({
      promptName: p.name,
      promptVersion: p.version,
      systemPrompt: p.systemPrompt,
      promptNotes: p.notes || '',
      activePromptId: p.id,
      hasUnsavedChanges: false,
    });
  };

  const handleRestoreVersion = (p: PromptRecord, versionRecord: PromptVersionRecord) => {
    updateActiveDraft({
      promptName: p.name,
      promptVersion: versionRecord.version,
      systemPrompt: versionRecord.systemPrompt,
      promptNotes: versionRecord.notes || '',
      activePromptId: p.id,
      hasUnsavedChanges: false,
    });
  };

  // Selected ideas subset
  const selectedIdeasSubset = workflowState.ideas.filter((i) =>
    workflowState.selectedIdeaIds.includes(i.id)
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2022] flex flex-col font-sans selection:bg-[#EAEAEA]">
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Strategic Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-zinc-900 leading-tight">
                  AI Marketing Lab
                </h1>
                <span className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  سير العمل التسويقي التتابعي
                </span>
                {brief.brandName && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[160px]">
                    {brief.brandName}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">
                مستشار استراتيجي تفاعلي يعمل خطوة بخطوة وفق اعتماد صريح لكل مرحلة.
              </p>
            </div>
          </div>

          {/* Project & Model Selector */}
          <ProjectModelSelector
            projects={projects}
            activeProject={activeProject}
            onSwitchProject={handleSwitchProject}
            onOpenProjectBrief={() => setActiveModalView('brief_editor')}
            onSelectModel={handleSelectModel}
            activeModelId={activeProjectModel}
          />

          {/* Primary View Switcher: Workflow Workspace vs Dataset Manager */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setMainNav('workflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mainNav === 'workflow'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sliders size={13} />
              <span>سير العمل التسويقي</span>
            </button>

            <button
              type="button"
              onClick={() => setMainNav('dataset')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mainNav === 'dataset'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Database size={13} />
              <span>مدير مجموعات البيانات (Dataset Manager)</span>
            </button>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 md:gap-2.5">
            {/* Brief & Templates Quick Opener */}
            <button
              type="button"
              onClick={() => setActiveModalView('brief_editor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition text-xs font-semibold cursor-pointer"
              title="تعديل بيانات العميل أو اختيار نموذج جاهز من النماذج الستة"
            >
              <FileSpreadsheet size={14} className="text-zinc-600" />
              <span>موجز العميل والنماذج</span>
            </button>

            {/* Prompt Engines & Library */}
            <button
              type="button"
              onClick={() => setActiveModalView('prompt_editor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition text-xs font-semibold cursor-pointer"
              title="محرر البرومبتات المستقلة للمحركات الأربعة"
            >
              <Settings2 size={14} className="text-zinc-600" />
              <span>محرر البرومبتات</span>
            </button>

            {/* Saved Prompts for Active Engine */}
            <button
              type="button"
              onClick={() => setActiveModalView('saved_prompts')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition text-xs font-medium cursor-pointer"
            >
              <FolderOpen size={14} />
              <span className="hidden sm:inline">المكتبة</span>
              {currentSavedPrompts.length > 0 && (
                <span className="bg-zinc-200 text-zinc-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {currentSavedPrompts.length}
                </span>
              )}
            </button>

            {/* Clearly Accessible Reset Workflow Action */}
            <button
              type="button"
              onClick={handleInitiateResetWorkflow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition text-xs font-semibold cursor-pointer shadow-2xs"
              title="إعادة تعيين سير العمل وبدء استراتيجية أو خطة جديدة لنفس المشروع"
            >
              <RotateCcw size={13} />
              <span>إعادة تعيين / خطة جديدة</span>
            </button>
          </div>
        </div>

        {/* Transient Reset Feedback Toast Banner */}
        {resetToast && (
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-medium shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150 border-t border-emerald-800">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>{resetToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setResetToast(null)}
                className="text-emerald-200 hover:text-white p-0.5 cursor-pointer text-[11px]"
              >
                إغلاق ✕
              </button>
            </div>
          </div>
        )}

        {/* 5-STAGE STRICT SEQUENTIAL APPROVAL PROGRESS BAR (Only in Workflow mode) */}
        {mainNav === 'workflow' && (
          <WorkflowProgressBar
            currentStage={workflowState.currentStage}
            strategyApproved={Boolean(workflowState.approvedStrategy)}
            ideasApproved={workflowState.ideasApproved}
            formatsConfirmed={workflowState.formatsConfirmed}
            productionCompleted={
              workflowState.deliverables.length > 0 &&
              workflowState.deliverables.every((d) => d.status === 'completed')
            }
            onSelectStage={(stageNum) =>
              setWorkflowState((prev) => ({ ...prev, currentStage: stageNum }))
            }
          />
        )}
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Missing API Key Warning */}
        {apiHealth && !apiHealth.configured && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs md:text-sm text-amber-900 flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-700" />
            <div className="space-y-0.5">
              <div className="font-bold">تنبيه: مفتاح Gemini API غير مهيأ في الخادم</div>
              <div className="text-amber-800 text-xs leading-relaxed">
                {apiHealth.message || 'يرجى تهيئة متغير البيئة GEMINI_API_KEY لتشغيل مراحل الذكاء الاصطناعي.'}
              </div>
            </div>
          </div>
        )}

        {/* Render Dataset Manager or Sequential Workflow */}
        {mainNav === 'dataset' ? (
          <DatasetManagerView />
        ) : (
          <>
            {/* Global Human References Controller & Transparency Bar */}
            <HumanReferencesWorkflowBar
              useHumanReferences={Boolean(workflowState.useHumanReferences)}
              onToggleHumanReferences={handleToggleHumanReferences}
              lastReferencesUsed={workflowState.lastReferencesUsed}
              onOpenInspectModal={() => setShowReferencesModal(true)}
            />

            {/* STAGE 1: COMPLETE BRAND STRATEGY */}
            {workflowState.currentStage === 1 && (
              <Stage1BrandStrategyView
                brief={brief}
                systemPrompt={draftsByEngine['brand_strategy'].systemPrompt}
                referenceExamples={referenceExamples}
                strategyVersions={workflowState.strategyVersions}
                approvedStrategy={workflowState.approvedStrategy}
                useHumanReferences={Boolean(workflowState.useHumanReferences)}
                onToggleHumanReferences={handleToggleHumanReferences}
                onApproveStrategy={handleApproveStrategy}
                onGenerateNewStrategy={handleGenerateBrandStrategy}
                onReviseStrategy={handleReviseBrandStrategy}
                onSelectVersionToView={(idx) => {}}
                onOpenBriefEditor={() => setActiveModalView('brief_editor')}
                isGenerating={isStrategyGenerating}
                isRevising={isStrategyRevising}
                errorMessage={strategyError}
                selectedModelName={
                  SUPPORTED_AI_MODELS.find((m) => m.id === activeProjectModel)?.name ||
                  activeProjectModel
                }
                onResetWorkflow={handleInitiateResetWorkflow}
              />
            )}

            {/* STAGE 2: GENERATE CONTENT IDEAS */}
            {workflowState.currentStage === 2 && (
              <Stage2ContentIdeasView
                brief={brief}
                approvedStrategy={workflowState.approvedStrategy}
                ideas={workflowState.ideas}
                selectedIdeaIds={workflowState.selectedIdeaIds}
                ideasApproved={workflowState.ideasApproved}
                onToggleIdea={handleToggleIdeaSelection}
                onSelectAllIdeas={handleSelectAllIdeas}
                onDeselectAllIdeas={handleDeselectAllIdeas}
                onGenerateIdeas={handleGenerateIdeas}
                onShowMoreIdeas={handleShowMoreIdeas}
                onApproveSelectedIdeas={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 3 }))
                }
                onBackToStrategy={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 1 }))
                }
                isGenerating={isIdeasGenerating}
                isShowMoreLoading={isShowMoreLoading}
                errorMessage={ideasError}
                selectedModelName={
                  SUPPORTED_AI_MODELS.find((m) => m.id === activeProjectModel)?.name ||
                  activeProjectModel
                }
              />
            )}

            {/* STAGE 3: IDEA SELECTION REVIEW */}
            {workflowState.currentStage === 3 && (
              <Stage3IdeaSelectionView
                ideas={workflowState.ideas}
                selectedIdeaIds={workflowState.selectedIdeaIds}
                ideasApproved={workflowState.ideasApproved}
                onToggleIdea={handleToggleIdeaSelection}
                onConfirmIdeaSelection={handleConfirmIdeaSelection}
                onBackToIdeas={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 2 }))
                }
                onProceedToFormats={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 4 }))
                }
              />
            )}

            {/* STAGE 4: CONTENT FORMAT SELECTION */}
            {workflowState.currentStage === 4 && (
              <Stage4FormatSelectionView
                selectedIdeas={selectedIdeasSubset}
                ideaFormats={workflowState.ideaFormats}
                onToggleIdeaFormat={handleToggleIdeaFormat}
                onSetIdeaFormats={handleSetIdeaFormats}
                onApplyBulkFormats={handleApplyBulkFormats}
                onConfirmFormatsAndStartProduction={handleConfirmFormatsAndStartProduction}
                onBackToSelection={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 3 }))
                }
              />
            )}

            {/* STAGE 5: CONTENT PRODUCTION */}
            {workflowState.currentStage === 5 && (
              <Stage5ContentProductionView
                deliverables={workflowState.deliverables}
                onUpdateDeliverableContent={handleUpdateDeliverableContent}
                onToggleDeliverableApproved={handleToggleDeliverableApproved}
                onRegenerateDeliverable={handleRegenerateDeliverable}
                onGenerateAllPendingDeliverables={() => generatePendingDeliverables()}
                onBackToFormats={() =>
                  setWorkflowState((prev) => ({ ...prev, currentStage: 4 }))
                }
                isGeneratingBatch={isProductionBatchRunning}
                regeneratingId={regeneratingDeliverableId}
                selectedModelName={
                  SUPPORTED_AI_MODELS.find((m) => m.id === activeProjectModel)?.name ||
                  activeProjectModel
                }
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div>
            AI Marketing Lab — مختبر برومبتات التسويق الذكي © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>منهجية سير العمل التتابعي مع الاعتماد الصريح (Approval-Based Workflow)</span>
            <span>•</span>
            <span>دعم RTL كامل</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: CLIENT BRIEF & TEST BRIEF TEMPLATES */}
      {activeModalView === 'brief_editor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-zinc-800" />
                <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                  موجز العميل والنماذج الجاهزة للتجربة (Client Brief & Test Briefs)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalView('none')}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <Stage2TestInputs
                brief={brief}
                setBrief={setBrief}
                referenceExamples={referenceExamples}
                setReferenceExamples={setReferenceExamples}
                onNext={() => setActiveModalView('none')}
                onBack={() => setActiveModalView('none')}
              />
            </div>

            <div className="p-3.5 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalView('none')}
                className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                إغلاق والعودة لسير العمل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROMPT ENGINES & SYSTEM PROMPTS EDITOR */}
      {activeModalView === 'prompt_editor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-zinc-800" />
                <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                  محرر البرومبتات المستقلة للمحركات الأربعة (Independent Prompt Engines)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalView('none')}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <Stage1PromptEditor
                engineId={activeEngineId}
                engine={currentEngineMeta.name}
                onSwitchEngine={(newId) => setActiveEngineId(newId)}
                systemPrompt={currentDraft.systemPrompt}
                setSystemPrompt={(text) =>
                  updateActiveDraft({ systemPrompt: text, hasUnsavedChanges: true })
                }
                promptNotes={currentDraft.promptNotes}
                setPromptNotes={(notes) =>
                  updateActiveDraft({ promptNotes: notes, hasUnsavedChanges: true })
                }
                promptName={currentDraft.promptName}
                setPromptName={(name) =>
                  updateActiveDraft({ promptName: name, hasUnsavedChanges: true })
                }
                promptVersion={currentDraft.promptVersion}
                activePromptId={currentDraft.activePromptId}
                hasUnsavedChanges={currentDraft.hasUnsavedChanges}
                onSavePrompt={handleSavePrompt}
                onSaveNewVersion={handleSaveNewVersion}
                onOpenSavedModal={() => setActiveModalView('saved_prompts')}
                onNext={() => setActiveModalView('none')}
              />
            </div>

            <div className="p-3.5 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalView('none')}
                className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                إغلاق والعودة لسير العمل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SAVED PROMPTS FOR ACTIVE ENGINE */}
      <SavedPromptsModal
        isOpen={activeModalView === 'saved_prompts'}
        onClose={() => setActiveModalView('none')}
        engineId={activeEngineId}
        engineName={currentEngineMeta.name}
        savedPrompts={currentSavedPrompts}
        currentDraftText={currentDraft.systemPrompt}
        onSelectPrompt={handleSelectPrompt}
        onSaveNewPrompt={handleSaveNewPromptFromModal}
        onOverwritePrompt={handleOverwritePrompt}
        onRenamePrompt={handleRenamePrompt}
        onDuplicatePrompt={handleDuplicatePrompt}
        onDeletePrompt={handleDeletePrompt}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* MODAL 4: EXPERIMENT HISTORY */}
      <ExperimentHistoryModal
        isOpen={activeModalView === 'history'}
        onClose={() => setActiveModalView('none')}
        history={history}
        onLoadRun={(run) => {
          setActiveModalView('none');
        }}
        onDeleteRun={(id) => {
          const updated = deleteExperimentRun(id);
          setHistory(updated);
        }}
        onClearAll={() => {
          clearExperimentHistory();
          setHistory([]);
        }}
      />

      {/* MODAL 5: HUMAN REFERENCES INSPECTION & TOGGLE */}
      <ReferencesInspectionModal
        isOpen={showReferencesModal}
        onClose={() => setShowReferencesModal(false)}
        brief={brief}
        lastReferencesUsed={workflowState.lastReferencesUsed}
        useHumanReferences={Boolean(workflowState.useHumanReferences)}
        onToggleHumanReferences={handleToggleHumanReferences}
      />

      {/* MODAL 6: RESET WORKFLOW & MULTI-STRATEGY CONFIRMATION */}
      <ResetWorkflowModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleExecuteReset}
        projectName={activeProject.name}
        selectedModelName={
          SUPPORTED_AI_MODELS.find((m) => m.id === activeProjectModel)?.name || activeProjectModel
        }
        currentStage={workflowState.currentStage}
        hasStrategy={workflowState.strategyVersions.length > 0}
        hasIdeas={workflowState.ideas.length > 0}
        hasDeliverables={workflowState.deliverables.length > 0}
      />
    </div>
  );
}
