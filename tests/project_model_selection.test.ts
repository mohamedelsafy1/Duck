import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

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
  getProjectModel,
  setProjectModel,
  getAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  DEFAULT_AI_MODEL,
} from '../src/utils/storage.ts';
import { resolveAndValidateModel, VALID_MODELS } from '../server/api.ts';

describe('Project AI Model Selection Isolation & Execution Pipeline', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  test('default model is returned when no explicit selection has been made', () => {
    const model = getProjectModel('sample-egypt-burger');
    assert.equal(model, DEFAULT_AI_MODEL);
    assert.equal(model, 'gemini-3.8-flash');
  });

  test('project A and project B maintain independent AI models', () => {
    const projectA = 'sample-egypt-burger';
    const projectB = 'sample-saudi-coffee';
    const projectC = 'sample-uae-realestate';

    // Configure distinct models for each project
    setProjectModel(projectA, 'gemini-3.8-flash');
    setProjectModel(projectB, 'gemini-3.1-flash-lite');
    setProjectModel(projectC, 'gemini-2.5-flash');

    // Verify Project A selection
    assert.equal(getProjectModel(projectA), 'gemini-3.8-flash');
    // Verify Project B selection
    assert.equal(getProjectModel(projectB), 'gemini-3.1-flash-lite');
    // Verify Project C selection
    assert.equal(getProjectModel(projectC), 'gemini-2.5-flash');

    // Updating Project B must NOT alter Project A or C
    setProjectModel(projectB, 'gemini-2.5-flash');
    assert.equal(getProjectModel(projectA), 'gemini-3.8-flash');
    assert.equal(getProjectModel(projectB), 'gemini-2.5-flash');
    assert.equal(getProjectModel(projectC), 'gemini-2.5-flash');
  });

  test('getAllProjects properly injects each project configured model', () => {
    const projectA = 'sample-egypt-burger';
    const projectB = 'sample-egypt-coffee';

    setProjectModel(projectA, 'gemini-3.1-flash-lite');
    setProjectModel(projectB, 'gemini-2.5-flash');

    const allProjects = getAllProjects();
    const loadedA = allProjects.find((p) => p.id === projectA);
    const loadedB = allProjects.find((p) => p.id === projectB);

    assert.ok(loadedA);
    assert.ok(loadedB);
    assert.equal(loadedA.selectedModel, 'gemini-3.1-flash-lite');
    assert.equal(loadedB.selectedModel, 'gemini-2.5-flash');
  });

  test('switching active project retains and restores each project model selection', () => {
    setActiveProjectId('sample-egypt-burger');
    setProjectModel('sample-egypt-burger', 'gemini-3.8-flash');

    setActiveProjectId('sample-egypt-coffee');
    setProjectModel('sample-egypt-coffee', 'gemini-3.1-flash-lite');

    // Switch back to project 1
    setActiveProjectId('sample-egypt-burger');
    assert.equal(getActiveProjectId(), 'sample-egypt-burger');
    assert.equal(getProjectModel(getActiveProjectId()), 'gemini-3.8-flash');

    // Switch back to project 2
    setActiveProjectId('sample-egypt-coffee');
    assert.equal(getActiveProjectId(), 'sample-egypt-coffee');
    assert.equal(getProjectModel(getActiveProjectId()), 'gemini-3.1-flash-lite');
  });

  test('page reload simulation preserves saved model configuration across all projects', () => {
    setProjectModel('proj-1', 'gemini-2.5-flash');
    setProjectModel('proj-2', 'gemini-3.1-flash-lite');

    // Verify localStorage has the raw JSON
    const stored = JSON.parse(memoryStore.get('ai_marketing_lab_project_models_v1') || '{}');
    assert.equal(stored['proj-1'], 'gemini-2.5-flash');
    assert.equal(stored['proj-2'], 'gemini-3.1-flash-lite');

    // Simulate new session/component reload
    assert.equal(getProjectModel('proj-1'), 'gemini-2.5-flash');
    assert.equal(getProjectModel('proj-2'), 'gemini-3.1-flash-lite');
  });

  test('rapid project switching does not corrupt or mix model configurations', () => {
    const projs = ['proj-a', 'proj-b', 'proj-c'];
    const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

    projs.forEach((p, idx) => setProjectModel(p, models[idx]));

    // Rapidly switch between projects 20 times
    for (let i = 0; i < 20; i++) {
      const targetProj = projs[i % 3];
      setActiveProjectId(targetProj);
      const activeModel = getProjectModel(getActiveProjectId());
      assert.equal(activeModel, models[i % 3], `Project ${targetProj} must retain model ${models[i % 3]}`);
    }
  });

  test('AI request construction uses the project configured model', () => {
    const projectModel = 'gemini-3.1-flash-lite';
    setProjectModel('sample-egypt-burger', projectModel);

    // Simulate building request body as implemented in App.tsx
    const activeModel = getProjectModel('sample-egypt-burger');
    const requestPayload = {
      systemPrompt: 'أنت مستشار استراتيجي',
      brief: { brandName: 'برجر المعلم' },
      model: activeModel,
    };

    assert.equal(requestPayload.model, 'gemini-3.1-flash-lite');

    // Verify server validation validates this payload model
    const validation = resolveAndValidateModel(requestPayload.model);
    assert.equal(validation.valid, true);
    assert.equal(validation.model, 'gemini-3.1-flash-lite');
  });
});
