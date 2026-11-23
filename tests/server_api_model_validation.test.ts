import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAndValidateModel,
  VALID_MODELS,
  DEFAULT_MODEL,
} from '../server/api.ts';

describe('Server API Model Resolution and Validation', () => {
  test('returns DEFAULT_MODEL when model is undefined, null, or empty string', () => {
    const resUndefined = resolveAndValidateModel(undefined);
    assert.equal(resUndefined.valid, true);
    assert.equal(resUndefined.model, DEFAULT_MODEL);
    assert.equal(resUndefined.model, 'gemini-3.8-flash');

    const resEmpty = resolveAndValidateModel('   ');
    assert.equal(resEmpty.valid, true);
    assert.equal(resEmpty.model, DEFAULT_MODEL);
  });

  test('accepts all supported Gemini models without error', () => {
    for (const model of VALID_MODELS) {
      const res = resolveAndValidateModel(model);
      assert.equal(res.valid, true);
      assert.equal(res.model, model);
      assert.equal(res.error, undefined);
    }
  });

  test('rejects unsupported or invalid model identifiers with informative error', () => {
    const invalidModels = ['gpt-4', 'claude-3-5-sonnet', 'gemini-invalid-100', 'random_text'];

    for (const invalid of invalidModels) {
      const res = resolveAndValidateModel(invalid);
      assert.equal(res.valid, false);
      assert.equal(res.model, invalid);
      assert.ok(res.error);
      assert.ok(res.error.includes('غير مدعوم'));
      assert.ok(res.error.includes(VALID_MODELS.join(', ')));
    }
  });
});
