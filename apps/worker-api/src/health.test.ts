import { describe, expect, it } from 'vitest';
import worker from './index';
import { Env } from '@org/core';

const mockEnv = {} as Env;
const mockCtx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

describe('worker-api /health', () => {
  it('returns tenant info when resolved via header', async () => {
    const request = new Request('http://localhost/health', {
      headers: { 'x-tenant-id': 'mrrainbowsmoke' },
    });
    const response = await worker.fetch(request, mockEnv, mockCtx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      tenant: 'mrrainbowsmoke',
    });
  });

  it('returns degraded status when tenant cannot be resolved', async () => {
    const request = new Request('http://localhost/health');
    const response = await worker.fetch(request, mockEnv, mockCtx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'degraded',
      message: 'Tenant could not be resolved',
    });
  });
});
