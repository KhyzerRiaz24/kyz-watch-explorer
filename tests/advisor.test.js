import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../server/store.js';
import { answer, recommend, parsePreferences } from '../server/advisor.js';
const store = createStore();
const catalogue = store.all();
test.after(() => store.close());

test('regression: Rolex and Patek requests never exceed a strict budget', () => {
  assert.deepEqual(recommend('Rolex under 100', catalogue).watches, []);
  assert.deepEqual(recommend('Patek under 500', catalogue).watches, []);
  const results = recommend('Rolex under $25k', catalogue).watches;
  assert.equal(results.length, 2);
  assert.ok(results.every((w) => w.price <= 25000 && w.brand === 'Rolex'));
});
test('the letter k in Patek does not multiply a plain budget', () => {
  assert.equal(parsePreferences('Patek under 500').max, 500);
  assert.equal(parsePreferences('Rolex under 20k').max, 20000);
  assert.equal(parsePreferences('under 20,000').max, 20000);
});
test('ranges, minimums and styles enforce all requested constraints', () => {
  const result = recommend('between $15k and $50k Rolex travel', catalogue);
  assert.ok(result.watches.length > 0);
  assert.ok(
    result.watches.every(
      (w) => w.price >= 15000 && w.price <= 50000 && w.brand === 'Rolex' && w.style === 'Travel',
    ),
  );
  assert.ok(recommend('at least 100k Patek', catalogue).watches.every((w) => w.price >= 100000));
  assert.deepEqual(recommend('between 90k and 10k', catalogue).watches, []);
});
test('unsupported currencies require clarification instead of assuming exchange rates', async () => {
  const response = await answer('Rolex under £25000', catalogue);
  assert.equal(response.mode, 'catalogue');
  assert.equal(response.recommendations.length, 0);
  assert.match(response.reply, /US dollars/);
});
test('no credentials uses the built-in advisor and never calls a provider', async () => {
  const response = await answer('What is an automatic movement?', catalogue, {
    fetchImpl: () => {
      throw new Error('Network must not be used');
    },
  });
  assert.equal(response.mode, 'catalogue');
  assert.match(response.reply, /rotor/);
});
test('product matching stays deterministic even when an AI provider is configured', async () => {
  const response = await answer('Rolex under $25k', catalogue, {
    apiKey: 'test',
    model: 'fixture',
    fetchImpl: () => {
      throw new Error('Must not call AI for matching');
    },
  });
  assert.equal(response.mode, 'catalogue');
  assert.ok(response.recommendations.every((id) => store.get(id).price <= 25000));
});
test('AI provider failures return a useful labelled fallback without leaking errors', async () => {
  const response = await answer('What is an automatic movement?', catalogue, {
    apiKey: 'test',
    model: 'fixture',
    fetchImpl: async () => ({ ok: false }),
  });
  assert.equal(response.mode, 'fallback');
  assert.match(response.reply, /rotor/);
  assert.doesNotMatch(JSON.stringify(response), /Authorization|Bearer|test/);
});
test('AI output is extracted from response message items and storage is disabled', async () => {
  let body;
  const result = await answer('What is a mechanical watch?', catalogue, {
    apiKey: 'test',
    model: 'fixture',
    fetchImpl: async (_url, request) => {
      body = JSON.parse(request.body);
      return {
        ok: true,
        json: async () => ({
          output: [
            { type: 'reasoning' },
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'A mainspring powers the mechanism.' }],
            },
          ],
        }),
      };
    },
  });
  assert.equal(result.mode, 'ai');
  assert.equal(result.reply, 'A mainspring powers the mechanism.');
  assert.equal(body.store, false);
  assert.equal(body.model, 'fixture');
});
test('property: across budgets and brands every returned product meets its hard limit', () => {
  for (const brand of ['Rolex', 'Patek Philippe'])
    for (const budget of [0, 1, 100, 500, 10000, 14300, 22000, 25000, 50000, 100000, 500000]) {
      const result = recommend(`${brand} under ${budget}`, catalogue);
      assert.ok(result.watches.every((w) => w.brand === brand && w.price <= budget));
    }
});

test('named references cannot bypass any budget phrase or brand requirement', async () => {
  for (const phrase of ['at most 100', 'maximum 100', 'up to 100', 'under 100', 'budget of 100']) {
    const response = await answer(`Daytona ${phrase}`, catalogue);
    assert.deepEqual(response.recommendations, [], phrase);
  }
  assert.deepEqual((await answer('Rolex Nautilus', catalogue)).recommendations, []);
  assert.deepEqual((await answer('Nautilus under 150k', catalogue)).recommendations, ['nautilus']);
});

test('the verified Luna model uses bounded direct answers without changing other model defaults', async () => {
  for (const model of ['gpt-6-luna', 'another-configured-model']) {
    let request;
    await answer('What is a watch movement?', catalogue, {
      apiKey: 'fixture',
      model,
      fetchImpl: async (_url, options) => {
        request = options;
        return {
          ok: true,
          json: async () => ({
            output: [
              {
                type: 'message',
                content: [{ type: 'output_text', text: 'A movement powers the watch.' }],
              },
            ],
          }),
        };
      },
    });
    const body = JSON.parse(request.body);
    assert.equal(request.redirect, 'error');
    assert.equal(body.max_output_tokens, 700);
    assert.deepEqual(body.reasoning, model === 'gpt-6-luna' ? { effort: 'none' } : undefined);
  }
});
