import { describe, expect, it } from 'vitest';

import { TenantConfigSchema } from '../tenant-config';

describe('TenantConfigSchema', () => {
  it('accepts a valid tenant config', () => {
    const config = {
      tenantId: 'mrrainbowsmoke',
      accountId: 'acct_123',
      hostnameMapping: {
        'api.mrrainbowsmoke.com': 'mrrainbowsmoke',
      },
      ai: {
        models: ['@cf/meta/llama-3.1-8b-instruct'],
        budgets: {
          tokensPerDay: 100000,
          requestsPerMinute: 120,
        },
      },
      vectorize: {
        indexNames: ['documents'],
      },
      kv: {
        namespaceMappings: {
          SESSIONS: 'kv_sessions',
        },
      },
      durable_objects: {
        classBindings: {
          SESSIONS: 'SessionDO',
        },
      },
      cors: {
        origins: ['https://app.mrrainbowsmoke.com'],
        allowCredentials: true,
      },
      featureFlags: {
        chatStreaming: true,
      },
    };

    const result = TenantConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid tenant config', () => {
    const config = {
      tenantId: '',
      ai: {
        models: [],
      },
    };

    const result = TenantConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
