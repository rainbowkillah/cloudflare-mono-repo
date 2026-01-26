import { describe, expect, it } from 'vitest';
import { resolveTenantFromRequest, TenantResolutionError } from './tenant';
import type { TenantConfig } from './tenant-config';

const sampleConfig = (overrides: Partial<TenantConfig>): TenantConfig => ({
  tenantId: 'tenant-a',
  accountId: 'account-a',
  hostnameMapping: ['tenant-a.example.com'],
  ai: {
    defaultModel: '@cf/meta/llama-3-8b-instruct',
    allowedModels: ['@cf/meta/llama-3-8b-instruct'],
  },
  vectorize: {
    indexName: 'tenant-a-index',
    dimensions: 768,
  },
  kv: {
    cacheNamespace: 'tenant-a-cache',
  },
  durableObjects: {
    sessionClass: 'SessionDO',
    rateLimitClass: 'RateLimitDO',
  },
  cors: {
    allowedOrigins: ['*'],
  },
  features: {
    ttsEnabled: false,
    toolsEnabled: true,
    ragEnabled: true,
  },
  ...overrides,
});

describe('resolveTenantFromRequest', () => {
  it('resolves tenant from header', () => {
    const config = sampleConfig({ tenantId: 'tenant-a' });
    const request = new Request('https://api.example.com/health', {
      headers: { 'x-tenant-id': 'tenant-a' },
    });

    const result = resolveTenantFromRequest(request, { 'tenant-a': config });

    expect(result.tenantId).toBe('tenant-a');
    expect(result.resolvedVia).toBe('header');
  });

  it('resolves tenant from hostname when header is missing', () => {
    const config = sampleConfig({ tenantId: 'tenant-a' });
    const request = new Request('https://tenant-a.example.com/health');

    const result = resolveTenantFromRequest(request, { 'tenant-a': config });

    expect(result.tenantId).toBe('tenant-a');
    expect(result.resolvedVia).toBe('hostname');
  });

  it('throws when header is missing and hostname does not match', () => {
    const request = new Request('https://unknown.example.com/health');

    expect(() => resolveTenantFromRequest(request, {})).toThrowError(
      TenantResolutionError
    );
  });

  it('throws when header tenant is unknown', () => {
    const request = new Request('https://api.example.com/health', {
      headers: { 'x-tenant-id': 'missing' },
    });

    expect(() => resolveTenantFromRequest(request, {})).toThrowError(
      TenantResolutionError
    );
  });
});
