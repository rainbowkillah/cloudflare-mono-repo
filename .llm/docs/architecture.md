# Architecture Document

> Canonical architecture reference for the Cloudflare Workers AI Multi-Tenant Monorepo.
>
> Author: Claude (Architect)
> Last Updated: 2026-01-26
> Status: Active

## 1. System Overview

This platform is a multi-tenant AI service built entirely on Cloudflare's edge infrastructure. It provides:

- **Streaming Chat** - Real-time conversational AI with session persistence
- **RAG Search** - Retrieval-augmented generation with citations
- **Tool Execution** - Function calling with audit logging
- **TTS** - Text-to-speech contract (provider-agnostic)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              EDGE (Cloudflare)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Tenant A  │    │   Tenant B  │    │   Tenant N  │                 │
│  │   Request   │    │   Request   │    │   Request   │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            ▼                                            │
│                 ┌─────────────────────┐                                 │
│                 │  Tenant Resolution  │◄─── x-tenant-id / hostname      │
│                 │     Middleware      │                                 │
│                 └──────────┬──────────┘                                 │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         ▼                  ▼                  ▼                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   /chat     │    │   /search   │    │   /tools    │                 │
│  │  (stream)   │    │    (RAG)    │    │  (execute)  │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            ▼                                            │
│                 ┌─────────────────────┐                                 │
│                 │     AI Gateway      │◄─── Policy, Routing, Metrics    │
│                 └──────────┬──────────┘                                 │
│                            ▼                                            │
│                 ┌─────────────────────┐                                 │
│                 │     Workers AI      │                                 │
│                 │   (Model Inference) │                                 │
│                 └─────────────────────┘                                 │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │     KV      │    │  Durable    │    │  Vectorize  │                 │
│  │   (cache)   │    │   Objects   │    │ (embeddings)│                 │
│  │             │    │  (sessions) │    │             │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Design Principles

### 2.1 Tenant Isolation (Non-Negotiable)

Every request MUST resolve to a tenant before accessing any resource:

```typescript
// Tenant resolution order (highest to lowest priority)
1. x-tenant-id header
2. Hostname mapping (e.g., tenant-a.example.com → tenant-a)
3. JWT claim (if auth enabled)

// If tenant cannot be resolved → 400 Bad Request
// No fallback to "default" tenant
```

All storage is tenant-scoped:

- **KV keys**: `{tenant}:{namespace}:{key}`
- **DO IDs**: `{tenant}:{session_id}`
- **Vectorize**: Separate index per tenant OR tenant prefix in metadata

### 2.2 Edge-First Architecture

All computation happens at Cloudflare's edge:

- No origin servers
- No external databases (except via Workers AI/Gateway)
- State lives in KV, DO, and Vectorize

### 2.3 Streaming by Default

All AI responses stream to minimize time-to-first-token:

- SSE (Server-Sent Events) for chat
- Chunked transfer for large payloads

## 3. Component Architecture

### 3.1 Worker Applications

```
apps/
├── worker-api/          # Primary API surface
│   ├── src/
│   │   ├── index.ts     # Entry point + router
│   │   ├── middleware/  # Tenant resolution, auth, rate limiting
│   │   ├── routes/      # /chat, /search, /tools, /tts, /health
│   │   └── handlers/    # Business logic per route
│   ├── wrangler.jsonc   # Base config (extended by tenants)
│   └── project.json     # Nx targets
│
└── ingest-worker/       # Optional: dedicated ingestion pipeline
    └── ...
```

### 3.2 Shared Packages

```
packages/
├── core/                # Foundation layer
│   ├── src/
│   │   ├── env.ts       # Env binding types (SINGLE SOURCE OF TRUTH)
│   │   ├── tenant.ts    # Tenant resolution + context
│   │   ├── middleware/  # Reusable middleware
│   │   ├── errors.ts    # Error types + envelopes
│   │   └── schemas/     # Zod schemas for validation
│   └── project.json
│
├── storage/             # Storage adapters (tenant-aware)
│   ├── src/
│   │   ├── kv.ts        # KV operations with tenant scoping
│   │   ├── do.ts        # DO bindings + session management
│   │   └── vectorize.ts # Vectorize operations
│   └── project.json
│
├── rag/                 # RAG pipeline
│   ├── src/
│   │   ├── chunker.ts   # Document chunking
│   │   ├── embedder.ts  # Embedding generation
│   │   ├── retriever.ts # Vector search + ranking
│   │   ├── assembler.ts # RAG response assembly
│   │   └── prompts/     # Prompt templates
│   └── project.json
│
├── observability/       # Metrics + logging
│   ├── src/
│   │   ├── logger.ts    # Structured JSON logger
│   │   ├── metrics.ts   # Metrics helpers
│   │   └── tracing.ts   # Request correlation
│   └── project.json
│
└── testing/             # Test utilities
    ├── src/
    │   ├── fixtures/    # Test data
    │   ├── mocks/       # DO/KV/Vectorize mocks
    │   └── harness.ts   # Test harness
    └── project.json
```

### 3.3 Tenant Configuration

```
tenants/
├── rainbowsmokeofficial/
│   ├── tenant.config.json    # Tenant-specific settings
│   ├── wrangler.jsonc        # Cloudflare bindings
│   ├── policies.json         # Optional: rate limits, model access
│   └── prompts/              # Optional: custom prompts
│       └── system.md
│
└── mrrainbowsmoke/
    └── ...
```

**tenant.config.json schema:**

```typescript
interface TenantConfig {
  tenantId: string; // Unique identifier
  accountId: string; // Cloudflare account ID
  hostnameMapping?: string[]; // Optional: hostnames that map to this tenant

  ai: {
    defaultModel: string; // e.g., "@cf/meta/llama-3-8b-instruct"
    allowedModels: string[]; // Models this tenant can use
    gateway?: {
      id: string; // AI Gateway ID
      cacheTtl?: number; // Cache TTL in seconds
    };
    budgets?: {
      dailyTokenLimit?: number;
      requestsPerMinute?: number;
    };
  };

  vectorize: {
    indexName: string; // Tenant's Vectorize index
    dimensions: number; // Embedding dimensions (e.g., 768)
  };

  kv: {
    cacheNamespace: string; // KV namespace for caching
    metadataNamespace?: string; // Optional: separate namespace for metadata
  };

  durableObjects: {
    sessionClass: string; // DO class name for sessions
    rateLimitClass: string; // DO class name for rate limiting
  };

  cors: {
    allowedOrigins: string[];
  };

  features: {
    ttsEnabled: boolean;
    toolsEnabled: boolean;
    ragEnabled: boolean;
  };
}
```

## 4. Data Flow

### 4.1 Chat Request Flow

```
Client                    Worker                   AI Gateway              Workers AI
  │                         │                         │                       │
  │  POST /chat             │                         │                       │
  │  x-tenant-id: acme      │                         │                       │
  │  {messages: [...]}      │                         │                       │
  │────────────────────────>│                         │                       │
  │                         │                         │                       │
  │                         │ 1. Resolve tenant       │                       │
  │                         │ 2. Validate request     │                       │
  │                         │ 3. Check rate limit (DO)│                       │
  │                         │ 4. Load session (DO)    │                       │
  │                         │                         │                       │
  │                         │  Route via Gateway      │                       │
  │                         │────────────────────────>│                       │
  │                         │                         │  Inference request    │
  │                         │                         │──────────────────────>│
  │                         │                         │                       │
  │                         │                         │  Stream tokens        │
  │                         │                         │<──────────────────────│
  │                         │  Stream chunks          │                       │
  │                         │<────────────────────────│                       │
  │  SSE: data: {...}       │                         │                       │
  │<────────────────────────│                         │                       │
  │  SSE: data: {...}       │                         │                       │
  │<────────────────────────│                         │                       │
  │  SSE: [DONE]            │                         │                       │
  │<────────────────────────│                         │                       │
  │                         │                         │                       │
  │                         │ 5. Save session (DO)    │                       │
  │                         │ 6. Emit metrics         │                       │
  │                         │                         │                       │
```

### 4.2 RAG Search Flow

```
Client                    Worker                   Vectorize              Workers AI
  │                         │                         │                       │
  │  POST /search           │                         │                       │
  │  {query: "..."}         │                         │                       │
  │────────────────────────>│                         │                       │
  │                         │                         │                       │
  │                         │ 1. Resolve tenant       │                       │
  │                         │ 2. Check cache (KV)     │                       │
  │                         │                         │                       │
  │                         │  3. Embed query         │                       │
  │                         │────────────────────────────────────────────────>│
  │                         │<────────────────────────────────────────────────│
  │                         │                         │                       │
  │                         │  4. Vector search       │                       │
  │                         │────────────────────────>│                       │
  │                         │  [chunk1, chunk2, ...]  │                       │
  │                         │<────────────────────────│                       │
  │                         │                         │                       │
  │                         │  5. Generate answer     │                       │
  │                         │────────────────────────────────────────────────>│
  │                         │<────────────────────────────────────────────────│
  │                         │                         │                       │
  │  {answer, sources, ...} │                         │                       │
  │<────────────────────────│                         │                       │
  │                         │                         │                       │
  │                         │ 6. Cache result (KV)    │                       │
  │                         │ 7. Emit metrics         │                       │
```

## 5. Storage Architecture

### 5.1 KV (Key-Value Store)

| Use Case        | Key Pattern                         | TTL | Notes                      |
| --------------- | ----------------------------------- | --- | -------------------------- |
| Query cache     | `{tenant}:cache:query:{hash}`       | 1h  | RAG response caching       |
| Prompt versions | `{tenant}:prompts:{name}:{version}` | -   | Immutable                  |
| Feature flags   | `{tenant}:flags:{flag}`             | 5m  | Short TTL for fast updates |
| Metadata        | `{tenant}:meta:{entity}:{id}`       | -   | Document metadata          |

### 5.2 Durable Objects

| Class         | Purpose              | ID Format                               | State                             |
| ------------- | -------------------- | --------------------------------------- | --------------------------------- |
| `SessionDO`   | Conversation history | `{tenant}:{session_id}`                 | Messages, created_at, last_active |
| `RateLimitDO` | Rate limiting        | `{tenant}:{ip}` or `{tenant}:{user_id}` | Counts, window timestamps         |

### 5.3 Vectorize

| Configuration    | Value                                | Notes                 |
| ---------------- | ------------------------------------ | --------------------- |
| Index per tenant | `{tenant}-vectors`                   | Full isolation        |
| Dimensions       | 768                                  | Match embedding model |
| Metric           | cosine                               | Standard for text     |
| Metadata         | `{doc_id, chunk_id, source, tenant}` | Always include tenant |

## 6. API Contracts

### 6.1 Common Headers

```
Request:
  x-tenant-id: string (required if no hostname mapping)
  x-request-id: string (optional, generated if missing)
  Authorization: Bearer <token> (if auth enabled)

Response:
  x-request-id: string
  x-tenant-id: string
  x-ratelimit-remaining: number
  x-ratelimit-reset: timestamp
```

### 6.2 Error Envelope

```typescript
interface ErrorResponse {
  error: {
    code: string; // e.g., "TENANT_NOT_FOUND", "RATE_LIMITED"
    message: string; // Human-readable message
    details?: unknown; // Additional context
    request_id: string; // For debugging
  };
}
```

### 6.3 Endpoint Specifications

See `.llm/docs/api-contracts.md` for detailed endpoint schemas.

## 7. Security Model

### 7.1 Authentication (Future)

```
Options (to be decided):
1. API Keys - Simple, per-tenant keys in KV
2. JWT - Signed tokens with tenant claim
3. Cloudflare Access - Zero-trust integration
```

### 7.2 Authorization

- Tenant isolation enforced at middleware level
- Tools have permission requirements in schema
- Rate limiting per tenant AND per user

### 7.3 Input Validation

- All inputs validated with Zod schemas
- Prompt injection mitigations in RAG
- Output filtering for sensitive content

## 8. Observability

### 8.1 Logging Schema

```typescript
interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  tenant: string;
  request_id: string;
  route: string;
  method: string;
  status: number;
  latency_ms: number;

  // Optional context
  user_id?: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  cache_hit?: boolean;
  error_code?: string;
}
```

### 8.2 Metrics

| Metric                    | Type      | Labels                            |
| ------------------------- | --------- | --------------------------------- |
| `requests_total`          | Counter   | tenant, route, status             |
| `errors_total`            | Counter   | tenant, route, error_code         |
| `latency_ms`              | Histogram | tenant, route                     |
| `ai_tokens_total`         | Counter   | tenant, model, direction (in/out) |
| `vectorize_queries_total` | Counter   | tenant                            |
| `vectorize_latency_ms`    | Histogram | tenant                            |
| `cache_hits_total`        | Counter   | tenant, cache_type                |
| `rate_limited_total`      | Counter   | tenant                            |

## 9. Deployment Architecture

### 9.1 Per-Tenant Deployment

Each tenant has its own wrangler.jsonc that extends the base:

- Separate KV namespaces
- Separate DO bindings
- Separate Vectorize index
- Tenant-specific secrets

### 9.2 Environment Strategy

| Environment | Purpose                | Binding Suffix |
| ----------- | ---------------------- | -------------- |
| dev         | Local development      | `-dev`         |
| staging     | Pre-production testing | `-staging`     |
| production  | Live traffic           | (none)         |

## 10. Decision Log

| Decision           | Choice          | Rationale                                      |
| ------------------ | --------------- | ---------------------------------------------- |
| Streaming protocol | SSE             | Native browser support, simpler than WebSocket |
| Session storage    | Durable Objects | Strong consistency, automatic locality         |
| Cache storage      | KV              | High throughput, global distribution           |
| Vector storage     | Vectorize       | Native integration, managed service            |
| Validation         | Zod             | Runtime + TypeScript inference                 |
| Module format      | ESM             | Modern Workers, better tree-shaking            |

---

_See also: [plan.md](./plan.md), [tenancy.md](./tenancy.md), [api-contracts.md](./api-contracts.md)_
