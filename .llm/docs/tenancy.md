# Tenancy Model

> Multi-tenant isolation strategy and implementation details.
>
> Author: Claude (Architect)
> Last Updated: 2026-01-26
> Status: Active

## 1. Overview

This platform operates in **full multi-tenant mode** where multiple independent tenants share the same infrastructure while maintaining complete data isolation. Tenant isolation is a **non-negotiable hard requirement**.

## 2. Tenant Resolution

### 2.1 Resolution Priority

Tenant is resolved in the following order (first match wins):

```typescript
// packages/core/src/tenant.ts

export async function resolveTenant(request: Request, env: Env): Promise<TenantContext> {
  // 1. Explicit header (highest priority)
  const headerTenant = request.headers.get('x-tenant-id');
  if (headerTenant) {
    return await loadTenantConfig(headerTenant, env);
  }

  // 2. Hostname mapping
  const hostname = new URL(request.url).hostname;
  const hostTenant = await lookupTenantByHostname(hostname, env);
  if (hostTenant) {
    return hostTenant;
  }

  // 3. JWT claim (if auth enabled)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const jwtTenant = await extractTenantFromJWT(token, env);
    if (jwtTenant) {
      return jwtTenant;
    }
  }

  // No tenant resolved - REJECT
  throw new TenantResolutionError('Unable to resolve tenant from request');
}
```

### 2.2 Resolution Failure

If tenant cannot be resolved, the request is **immediately rejected** with:

```json
{
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Unable to resolve tenant from request. Provide x-tenant-id header or use a mapped hostname.",
    "request_id": "abc123"
  }
}
```

HTTP Status: `400 Bad Request`

**There is no "default" tenant fallback.** This is intentional to prevent accidental data leakage.

## 3. Tenant Context

Once resolved, tenant context is attached to the request and available throughout the lifecycle:

```typescript
// packages/core/src/tenant.ts

export interface TenantContext {
  // Identity
  tenantId: string;
  accountId: string;

  // Configuration
  config: TenantConfig;

  // Resolved bindings (pre-computed for performance)
  bindings: {
    kv: KVNamespace;
    sessionDO: DurableObjectNamespace;
    rateLimitDO: DurableObjectNamespace;
    vectorize: VectorizeIndex;
  };

  // Request metadata
  requestId: string;
  resolvedVia: 'header' | 'hostname' | 'jwt';
}
```

## 4. Storage Isolation

### 4.1 KV Isolation Strategy

**Option A: Namespace Isolation (Recommended)**

Each tenant has dedicated KV namespaces:
- `TENANT_A_CACHE` - Tenant A's cache
- `TENANT_B_CACHE` - Tenant B's cache

Pros: Complete isolation at binding level
Cons: More bindings to manage, harder to scale to many tenants

**Option B: Key Prefix Isolation**

Single namespace with tenant prefix:
- Key: `tenant-a:cache:query:abc123`
- Key: `tenant-b:cache:query:def456`

Pros: Simpler binding management
Cons: Must enforce prefix in all code paths

**Decision: Option A for <100 tenants, Option B for >100**

```typescript
// packages/storage/src/kv.ts

export class TenantKV {
  constructor(private tenant: TenantContext) {}

  private getNamespace(): KVNamespace {
    // Option A: Direct binding
    return this.tenant.bindings.kv;
  }

  async get(key: string): Promise<string | null> {
    // Option B would prefix here: `${this.tenant.tenantId}:${key}`
    return this.getNamespace().get(key);
  }

  async put(key: string, value: string, options?: KVPutOptions): Promise<void> {
    return this.getNamespace().put(key, value, options);
  }
}
```

### 4.2 Durable Objects Isolation

DO IDs are constructed with tenant prefix:

```typescript
// packages/storage/src/do.ts

export class TenantDO {
  constructor(private tenant: TenantContext) {}

  getSessionStub(sessionId: string): DurableObjectStub {
    const id = this.tenant.bindings.sessionDO.idFromName(
      `${this.tenant.tenantId}:${sessionId}`
    );
    return this.tenant.bindings.sessionDO.get(id);
  }

  getRateLimitStub(key: string): DurableObjectStub {
    const id = this.tenant.bindings.rateLimitDO.idFromName(
      `${this.tenant.tenantId}:${key}`
    );
    return this.tenant.bindings.rateLimitDO.get(id);
  }
}
```

**Critical**: The DO classes themselves should validate the tenant prefix on every request to prevent forgery.

### 4.3 Vectorize Isolation

**Strategy: Separate Index per Tenant**

Each tenant has their own Vectorize index:
- `rainbowsmokeofficial-vectors`
- `mrrainbowsmoke-vectors`

```typescript
// packages/storage/src/vectorize.ts

export class TenantVectorize {
  constructor(private tenant: TenantContext) {}

  async query(embedding: number[], topK: number): Promise<VectorizeMatch[]> {
    const results = await this.tenant.bindings.vectorize.query(embedding, {
      topK,
      returnMetadata: true,
    });

    // Double-check tenant ownership in results (defense in depth)
    return results.matches.filter(m => m.metadata?.tenant === this.tenant.tenantId);
  }

  async upsert(vectors: VectorizeVector[]): Promise<void> {
    // Always stamp vectors with tenant
    const stamped = vectors.map(v => ({
      ...v,
      metadata: {
        ...v.metadata,
        tenant: this.tenant.tenantId,
      },
    }));
    await this.tenant.bindings.vectorize.upsert(stamped);
  }
}
```

## 5. Cross-Tenant Protection

### 5.1 Middleware Enforcement

Every route handler receives `TenantContext` as a required parameter:

```typescript
// apps/worker-api/src/routes/chat.ts

export async function handleChat(
  request: Request,
  tenant: TenantContext,  // <-- Always required
  env: Env
): Promise<Response> {
  // All operations use tenant-scoped adapters
  const sessionStore = new TenantDO(tenant);
  const cache = new TenantKV(tenant);
  // ...
}
```

### 5.2 Type Safety

TypeScript types enforce that storage operations require tenant context:

```typescript
// This is a compile error - missing tenant
const kv = new TenantKV();  // ❌ Error: Expected 1 argument

// This is correct
const kv = new TenantKV(tenant);  // ✅
```

### 5.3 Runtime Validation

Even with type safety, runtime checks are added as defense in depth:

```typescript
export class SessionDO implements DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const doId = url.pathname.slice(1);  // e.g., "tenant-a:session-123"

    // Extract tenant from DO ID
    const [tenantId] = doId.split(':');

    // Validate against request header
    const requestTenant = request.headers.get('x-tenant-id');
    if (tenantId !== requestTenant) {
      return new Response('Tenant mismatch', { status: 403 });
    }

    // Proceed with operation
  }
}
```

## 6. Shared Resources

Some resources may be intentionally shared across tenants:

### 6.1 AI Models

Models are accessed via AI Gateway which is shared. Tenant isolation is enforced via:
- Tenant-specific routing policies
- Separate usage tracking per tenant
- Rate limits per tenant

### 6.2 Feature Flags

Global feature flags (e.g., maintenance mode) may be read from a shared namespace:

```typescript
// Global flags checked AFTER tenant resolution
const globalFlags = await env.GLOBAL_FLAGS.get('maintenance');
if (globalFlags?.maintenanceMode) {
  throw new MaintenanceError();
}
```

## 7. Tenant Configuration

### 7.1 Config Schema

```typescript
// packages/core/src/schemas/tenant.ts

import { z } from 'zod';

export const TenantConfigSchema = z.object({
  tenantId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  accountId: z.string(),
  hostnameMapping: z.array(z.string()).optional(),

  ai: z.object({
    defaultModel: z.string(),
    allowedModels: z.array(z.string()),
    gateway: z.object({
      id: z.string(),
      cacheTtl: z.number().optional(),
    }).optional(),
    budgets: z.object({
      dailyTokenLimit: z.number().optional(),
      requestsPerMinute: z.number().optional(),
    }).optional(),
  }),

  vectorize: z.object({
    indexName: z.string(),
    dimensions: z.number().default(768),
  }),

  kv: z.object({
    cacheNamespace: z.string(),
    metadataNamespace: z.string().optional(),
  }),

  durableObjects: z.object({
    sessionClass: z.string(),
    rateLimitClass: z.string(),
  }),

  cors: z.object({
    allowedOrigins: z.array(z.string()),
  }),

  features: z.object({
    ttsEnabled: z.boolean().default(false),
    toolsEnabled: z.boolean().default(true),
    ragEnabled: z.boolean().default(true),
  }),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
```

### 7.2 Config Loading

```typescript
// packages/core/src/tenant.ts

export async function loadTenantConfig(
  tenantId: string,
  env: Env
): Promise<TenantContext> {
  // M0: file-based config bundled per tenant
  const config = TenantConfigSchema.parse(getTenantConfigFromBundle(tenantId));

  return {
    tenantId,
    accountId: config.accountId,
    config,
    bindings: resolveTenantBindings(config, env),
    requestId: generateRequestId(),
    resolvedVia: 'header',
  };
}
```

**M0 decision:** Tenant config is file-based (`tenants/<id>/tenant.config.json`) and bundled per tenant. KV-backed config is deferred until post-M0 (requires a sync/bootstrapping mechanism).

## 8. Testing Tenant Isolation

### 8.1 Required Tests

```typescript
// packages/testing/src/isolation.test.ts

describe('Tenant Isolation', () => {
  it('should reject requests without tenant', async () => {
    const response = await fetch('/chat', { method: 'POST' });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'TENANT_NOT_FOUND' }
    });
  });

  it('should not allow tenant A to access tenant B sessions', async () => {
    // Create session as tenant A
    const sessionId = await createSession('tenant-a');

    // Attempt to access as tenant B
    const response = await fetch(`/session/${sessionId}`, {
      headers: { 'x-tenant-id': 'tenant-b' }
    });
    expect(response.status).toBe(404);  // Not 403 to avoid leaking existence
  });

  it('should not return tenant A vectors in tenant B search', async () => {
    // Index document for tenant A
    await ingestDocument('tenant-a', { content: 'secret data' });

    // Search as tenant B
    const results = await search('tenant-b', 'secret');
    expect(results.matches).toHaveLength(0);
  });

  it('should scope rate limits per tenant', async () => {
    // Exhaust rate limit for tenant A
    for (let i = 0; i < 100; i++) {
      await fetch('/chat', { headers: { 'x-tenant-id': 'tenant-a' } });
    }

    // Tenant B should not be affected
    const response = await fetch('/chat', {
      headers: { 'x-tenant-id': 'tenant-b' }
    });
    expect(response.status).not.toBe(429);
  });
});
```

## 9. Operational Considerations

### 9.1 Adding a New Tenant

1. Create tenant folder: `tenants/{tenant-id}/`
2. Create `tenant.config.json` with required fields
3. Create `wrangler.jsonc` with bindings
4. Create Cloudflare resources (KV namespace, Vectorize index)
5. Deploy with `nx deploy worker-api --tenant={tenant-id}`
6. Verify with health check

### 9.2 Removing a Tenant

1. Disable tenant in config (set `enabled: false`)
2. Wait for traffic to drain (monitor logs)
3. Delete tenant data (KV, DO, Vectorize)
4. Remove tenant configuration
5. Update hostname mappings if applicable

### 9.3 Tenant Migration

Cross-account migration requires:
1. Export all KV data
2. Export Vectorize vectors with metadata
3. Export DO state (custom script)
4. Re-create resources in new account
5. Import data
6. Update DNS/hostname mappings
7. Verify and switch traffic

---

*See also: [architecture.md](./architecture.md), [security.md](./security.md)*
