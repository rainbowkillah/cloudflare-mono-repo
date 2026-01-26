import { describe, expect, it } from 'vitest';
import worker from './index';

describe('worker-api /health', () => {
  it('returns ok', async () => {
    const response = await worker.fetch(new Request('http://localhost/health'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});
