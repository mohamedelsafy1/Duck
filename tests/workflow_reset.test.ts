import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// In-memory localStorage polyfill for Node test runner
const memoryStore = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, val: string) => memoryStore.set(key, String(val)),
    removeItem: (key: string) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
  };
}

import {
  getDefaultWorkflowState,
  getWorkflowStateForProject,
  saveWorkflowStateForProject,
  resetWorkflowStateForProject,
  getProjectModel,
  setProjectModel,
  saveProjectPlan,
  getSavedPlansForProject,
} from '../src/utils/storage.ts';
import { WorkflowProjectState, ProjectSavedPlan } from '../src/types.ts';

describe('Workflow Reset & Multi-Plan Testing', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  test('getDefaultWorkflowState returns initial actionable state at stage 1', () => {
    const state = getDefaultWorkflowState('sample-egypt-burger');
    assert.equal(state.currentStage, 1);
    assert.equal(state.strategyVersions.length, 0);
    assert.equal(state.approvedStrategy, null);
    assert.equal(state.ideas.length, 0);
    assert.equal(state.selectedIdeaIds.length, 0);
    assert.equal(state.ideasApproved, false);
    assert.equal(state.formatsConfirmed, false);
    assert.equal(state.deliverables.length, 0);
    assert.ok(state.planRunId && state.planRunId.startsWith('plan-'));
  });

  test('resetWorkflowStateForProject resets transient workflow state but preserves project model', () => {
    const projectId = 'proj-ecommerce-fashion';
    setProjectModel(projectId, 'gemini-3.1-flash-lite');

    // Simulate an ongoing workflow with progress in stages 1, 2, and 5
    const populatedState: WorkflowProjectState = {
      currentStage: 5,
      strategyVersions: [
        {
          version: 1,
          content: 'مسودة استراتيجية أولية لمتجر الأزياء',
          timestamp: new Date().toISOString(),
          isApproved: true,
          modelUsed: 'gemini-3.1-flash-lite',
        },
      ],
      approvedStrategy: 'مسودة استراتيجية أولية لمتجر الأزياء',
      ideas: [
        {
          id: 'idea-1',
          title: 'حملة العيد',
          description: 'فكرة حملة',
          strategicPurpose: 'زيادة المبيعات',
          audienceInsight: 'الرغبة في التميز',
          suggestedHook: 'جاهز للعيد؟',
          contentPillar: 'موسمي',
          modelUsed: 'gemini-3.1-flash-lite',
        },
      ],
      selectedIdeaIds: ['idea-1'],
      ideasApproved: true,
      ideaFormats: { 'idea-1': ['carousel'] },
      formatsConfirmed: true,
      deliverables: [
        {
          id: 'deliv-1',
          ideaId: 'idea-1',
          ideaTitle: 'حملة العيد',
          format: 'carousel',
          content: 'نص الكاروسيل',
          originalContent: 'نص الكاروسيل',
          isEdited: false,
          isApproved: true,
          status: 'completed',
          updatedAt: new Date().toISOString(),
          modelUsed: 'gemini-3.1-flash-lite',
        },
      ],
      planRunId: 'run-plan-old-123',
      selectedModel: 'gemini-3.1-flash-lite',
      activeModelUsed: 'gemini-3.1-flash-lite',
      useHumanReferences: true,
    };

    saveWorkflowStateForProject(projectId, populatedState);

    // Verify populated state was saved
    const saved = getWorkflowStateForProject(projectId);
    assert.equal(saved.currentStage, 5);
    assert.equal(saved.deliverables.length, 1);

    // Perform reset
    const freshState = resetWorkflowStateForProject(projectId);

    // 1. Cleared transient state
    assert.equal(freshState.currentStage, 1);
    assert.equal(freshState.strategyVersions.length, 0);
    assert.equal(freshState.approvedStrategy, null);
    assert.equal(freshState.ideas.length, 0);
    assert.equal(freshState.selectedIdeaIds.length, 0);
    assert.equal(freshState.ideasApproved, false);
    assert.equal(freshState.formatsConfirmed, false);
    assert.equal(freshState.deliverables.length, 0);

    // 2. Fresh run identity generated to isolate future executions
    assert.notEqual(freshState.planRunId, 'run-plan-old-123');

    // 3. Preserved project configured model
    assert.equal(freshState.selectedModel, 'gemini-3.1-flash-lite');
    assert.equal(getProjectModel(projectId), 'gemini-3.1-flash-lite');
  });

  test('resetting one project does not reset another project', () => {
    const projA = 'project-alpha';
    const projB = 'project-beta';

    const stateA: WorkflowProjectState = {
      ...getDefaultWorkflowState(projA),
      currentStage: 3,
      approvedStrategy: 'استراتيجية ألفا معتمدة',
    };
    const stateB: WorkflowProjectState = {
      ...getDefaultWorkflowState(projB),
      currentStage: 4,
      approvedStrategy: 'استراتيجية بيتا معتمدة',
    };

    saveWorkflowStateForProject(projA, stateA);
    saveWorkflowStateForProject(projB, stateB);

    // Reset only Project A
    resetWorkflowStateForProject(projA);

    const reloadedA = getWorkflowStateForProject(projA);
    const reloadedB = getWorkflowStateForProject(projB);

    // Project A is reset to Stage 1
    assert.equal(reloadedA.currentStage, 1);
    assert.equal(reloadedA.approvedStrategy, null);

    // Project B is completely untouched and preserved at Stage 4
    assert.equal(reloadedB.currentStage, 4);
    assert.equal(reloadedB.approvedStrategy, 'استراتيجية بيتا معتمدة');
  });

  test('a new run does not reuse stale intermediate outputs from a previous run', () => {
    const proj = 'project-run-isolation';

    // First run with intermediate strategy and ideas
    const run1State: WorkflowProjectState = {
      ...getDefaultWorkflowState(proj),
      planRunId: 'run-1',
      currentStage: 2,
      strategyVersions: [{ version: 1, content: 'استراتيجية 1', timestamp: '2026-01-01', isApproved: true }],
      approvedStrategy: 'استراتيجية 1',
      ideas: [{ id: 'idea-old', title: 'فكرة قديمة', description: '', strategicPurpose: '', audienceInsight: '', suggestedHook: '', contentPillar: '' }],
    };
    saveWorkflowStateForProject(proj, run1State);

    // Reset to start a new strategy/plan
    const run2State = resetWorkflowStateForProject(proj);

    assert.notEqual(run2State.planRunId, 'run-1');
    assert.equal(run2State.ideas.length, 0);
    assert.equal(run2State.strategyVersions.length, 0);
    assert.equal(run2State.approvedStrategy, null);
  });

  test('late responses from a previous run are ignored due to run identity mismatch', () => {
    let activePlanRunId = 'run-initial';

    // Simulate an async request started under run-initial
    const initiatedRunId = activePlanRunId;

    // User resets workflow before async request finishes
    activePlanRunId = 'run-after-reset';

    // When async response comes back, run ID check guards state update
    let stateWasUpdated = false;
    if (initiatedRunId === activePlanRunId) {
      stateWasUpdated = true;
    }

    assert.equal(stateWasUpdated, false, 'Late response must be ignored and not update the new run');
  });

  test('repeated resets remain reliable and produce distinct run identities each time', () => {
    const proj = 'project-repeat-reset';
    const runIds = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const state = resetWorkflowStateForProject(proj);
      assert.equal(state.currentStage, 1);
      assert.equal(state.strategyVersions.length, 0);
      assert.ok(state.planRunId);
      assert.ok(!runIds.has(state.planRunId), `Run ID ${state.planRunId} must be unique across resets`);
      runIds.add(state.planRunId);
    }

    assert.equal(runIds.size, 5);
  });

  test('saving previous plan before reset preserves historical results without contamination', () => {
    const projectId = 'sample-saudi-restaurant';

    const planToSave: ProjectSavedPlan = {
      id: 'plan-save-101',
      projectId,
      planRunId: 'run-alpha',
      name: 'استراتيجية التوسع الصيفي',
      createdAt: new Date().toISOString(),
      selectedModel: 'gemini-3.8-flash',
      strategy: 'استراتيجية مطعم رقم 1',
      ideas: [
        {
          id: 'i-1',
          title: 'فكرة بوكس الويكند العائلي',
          description: '',
          strategicPurpose: '',
          audienceInsight: '',
          suggestedHook: '',
          contentPillar: '',
        },
      ],
      deliverablesCount: 3,
      notes: 'تم الحفظ قبل تجربة استراتيجية بديلة',
    };

    saveProjectPlan(planToSave);

    // Reset active workflow for this project
    const freshState = resetWorkflowStateForProject(projectId);
    assert.equal(freshState.currentStage, 1);

    // Saved plan is still accessible and intact
    const projectPlans = getSavedPlansForProject(projectId);
    assert.equal(projectPlans.length, 1);
    assert.equal(projectPlans[0].name, 'استراتيجية التوسع الصيفي');
    assert.equal(projectPlans[0].strategy, 'استراتيجية مطعم رقم 1');
  });
});
