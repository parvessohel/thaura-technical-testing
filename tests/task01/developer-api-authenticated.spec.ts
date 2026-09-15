import 'dotenv/config';
import { expect, test } from '@playwright/test';

const apiKey = process.env.THAURA_API_KEY;
const completionsUrl = 'https://backend.thaura.ai/v1/chat/completions';

test.describe('Task 01 authenticated Developer API contract', () => {
  test.beforeEach(() => {
    test.skip(!apiKey, 'THAURA_API_KEY is not exported in this shell');
  });

  test('Minimal authenticated request reports funded or zero-balance state', async ({ request }) => {
    const response = await request.post(completionsUrl, {
      failOnStatusCode: false,
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      data: {
        model: 'thaura',
        messages: [{ role: 'user', content: 'Reply with exactly API_OK' }],
        stream: false,
        max_completion_tokens: 1
      }
    });
    const body = await response.json();

    console.log(JSON.stringify({
      status: response.status(),
      id: body.id,
      object: body.object,
      model: body.model,
      finishReason: body.choices?.[0]?.finish_reason,
      usage: body.usage
    }, null, 2));

    if (response.status() === 402) {
      expect(JSON.stringify(body)).toMatch(/insufficient balance|add funds|balance/i);
      return;
    }

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({
      object: 'chat.completion',
      model: 'thaura'
    });
    expect(body.id).toEqual(expect.any(String));
    expect(body.choices?.[0]?.message?.role).toBe('assistant');
    expect(body.choices?.[0]?.finish_reason).toEqual(expect.any(String));
    expect(body.usage).toMatchObject({
      prompt_tokens: expect.any(Number),
      completion_tokens: expect.any(Number),
      total_tokens: expect.any(Number)
    });
  });

  test('Invalid model is rejected without a server error', async ({ request }) => {
    const response = await request.post(completionsUrl, {
      failOnStatusCode: false,
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      data: {
        model: 'task01-invalid-model',
        messages: [{ role: 'user', content: 'x' }],
        max_completion_tokens: 1
      }
    });
    const body = await response.text();

    console.log(JSON.stringify({ status: response.status(), body }, null, 2));
    expect(response.status()).toBe(400);
    expect(body).toMatch(/invalid_model|model/i);
  });

  test('Validation-only boundary and rejected-parameter requests return client errors', async ({ request }) => {
    const cases = [
      { name: 'messages wrong type', body: { model: 'thaura', messages: 'invalid', max_completion_tokens: 1 } },
      { name: 'temperature too high', body: { model: 'thaura', messages: [{ role: 'user', content: 'x' }], temperature: 2.1, max_completion_tokens: 1 } },
      { name: 'token cap exceeded', body: { model: 'thaura', messages: [{ role: 'user', content: 'x' }], max_completion_tokens: 32001 } },
      { name: 'legacy functions rejected', body: { model: 'thaura', messages: [{ role: 'user', content: 'x' }], functions: [], max_completion_tokens: 1 } },
      { name: 'legacy function_call rejected', body: { model: 'thaura', messages: [{ role: 'user', content: 'x' }], function_call: 'auto', max_completion_tokens: 1 } }
    ];

    const results = [];
    for (const testCase of cases) {
      const response = await request.post(completionsUrl, {
        failOnStatusCode: false,
        headers: { authorization: `Bearer ${apiKey}` },
        data: testCase.body
      });
      results.push({ name: testCase.name, status: response.status(), body: await response.text() });
    }

    console.log(JSON.stringify(results, null, 2));
    expect(results.every(result => [400, 402].includes(result.status))).toBe(true);
    expect(results.every(result => result.status < 500)).toBe(true);
  });
});
