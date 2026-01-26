# Metrics & Observability Plan

> Defines what we measure, why, and how.
>
> Author: Claude (Architect) + Gemini (Planner)
> Last Updated: 2026-01-26
> Status: Active

## 1. Philosophy

Observability is a **first-class deliverable**, not an afterthought. We measure to:
1. Understand system behavior under load
2. Detect anomalies before users report them
3. Debug issues faster with correlation
4. Optimize costs (AI tokens are expensive)
5. Prove SLA compliance

## 2. Logging

### 2.1 Log Schema

All logs are structured JSON with mandatory fields:

```typescript
interface LogEntry {
  // Required fields (every log line)
  timestamp: string;           // ISO 8601 with timezone
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;             // Human-readable summary

  // Request context (attached via middleware)
  tenant_id: string;
  request_id: string;
  route: string;               // e.g., "POST /chat"

  // Optional contextual fields
  latency_ms?: number;
  status?: number;
  user_id?: string;            // If auth enabled

  // AI-specific fields
  model?: string;
  tokens_in?: number;
  tokens_out?: number;

  // Error fields
  error_code?: string;
  error_message?: string;
  stack_trace?: string;        // Only in non-production

  // Additional context (structured)
  context?: Record<string, unknown>;
}
```

### 2.2 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Development-only details | "Parsed request body: {...}" |
| `info` | Normal operations | "Request completed successfully" |
| `warn` | Recoverable issues | "Rate limit approaching threshold" |
| `error` | Failures requiring attention | "AI Gateway returned 500" |

### 2.3 Redaction Rules

**Never log:**
- Raw prompts or completions (may contain PII)
- Authentication tokens
- API keys
- Full request/response bodies

**Allowed to log:**
- Prompt/completion lengths
- Token counts
- Hashed identifiers
- Error codes and types

```typescript
// packages/observability/src/logger.ts

function redact(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Redact anything that looks like a token
    return obj.replace(/Bearer\s+[\w-]+/g, 'Bearer [REDACTED]');
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redact(value);
      }
    }
    return result;
  }
  return obj;
}

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'auth',
  'prompt', 'completion', 'message', 'content'
];
```

### 2.4 Log Destinations

| Environment | Destination | Retention |
|-------------|-------------|-----------|
| Development | Console (stdout) | Session |
| Staging | Workers Logpush → R2 | 30 days |
| Production | Workers Logpush → R2 + Analytics | 90 days |

## 3. Metrics

### 3.1 Required Metrics

#### Request Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | tenant, route, method, status | Total HTTP requests |
| `http_request_duration_ms` | Histogram | tenant, route, method | Request latency distribution |
| `http_errors_total` | Counter | tenant, route, error_code | Total errors by type |

#### AI Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ai_requests_total` | Counter | tenant, model, status | AI inference requests |
| `ai_tokens_total` | Counter | tenant, model, direction | Token usage (in/out) |
| `ai_request_duration_ms` | Histogram | tenant, model | AI latency distribution |
| `ai_gateway_cache_hits_total` | Counter | tenant | Gateway cache utilization |

#### RAG Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `vectorize_queries_total` | Counter | tenant | Vector search queries |
| `vectorize_query_duration_ms` | Histogram | tenant | Vector search latency |
| `vectorize_results_count` | Histogram | tenant | Results per query |
| `rag_cache_hits_total` | Counter | tenant | RAG response cache hits |

#### Session Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `sessions_active` | Gauge | tenant | Currently active sessions |
| `session_messages_total` | Counter | tenant | Messages across sessions |
| `session_duration_seconds` | Histogram | tenant | Session lifetime |

#### Rate Limiting Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `rate_limit_hits_total` | Counter | tenant, limit_type | Rate limit enforcements |
| `rate_limit_remaining` | Gauge | tenant, limit_type | Remaining quota |

### 3.2 Metric Implementation

```typescript
// packages/observability/src/metrics.ts

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(name: string, labels: Record<string, string>, value = 1): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  observe(name: string, labels: Record<string, string>, value: number): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) ?? [];
    values.push(value);
    this.histograms.set(key, values);
  }

  // Flush to Workers Analytics Engine
  async flush(analyticsEngine: AnalyticsEngine): Promise<void> {
    for (const [key, value] of this.counters) {
      const { name, labels } = this.parseKey(key);
      analyticsEngine.writeDataPoint({
        blobs: [name],
        doubles: [value],
        indexes: [labels.tenant ?? 'unknown'],
      });
    }
    // Similar for histograms with percentile calculation
    this.counters.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`);
    return `${name}{${sortedLabels.join(',')}}`;
  }
}
```

### 3.3 Histogram Buckets

Standard latency buckets for all timing metrics:

```typescript
const LATENCY_BUCKETS_MS = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000
];

// For AI requests (higher latency expected)
const AI_LATENCY_BUCKETS_MS = [
  100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000
];
```

## 4. Tracing

### 4.1 Request Correlation

Every request gets a unique ID that propagates through all operations:

```typescript
// packages/observability/src/tracing.ts

export function createRequestContext(request: Request): RequestContext {
  // Use incoming request ID or generate new
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  return {
    requestId,
    startTime: Date.now(),
    spans: [],
  };
}

export function withSpan<T>(
  ctx: RequestContext,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const spanStart = Date.now();
  return fn().finally(() => {
    ctx.spans.push({
      name,
      startTime: spanStart,
      duration: Date.now() - spanStart,
    });
  });
}
```

### 4.2 Span Structure

```typescript
interface Span {
  name: string;              // e.g., "vectorize.query", "ai.generate"
  startTime: number;         // Unix ms
  duration: number;          // ms
  status: 'ok' | 'error';
  attributes?: Record<string, unknown>;
}
```

### 4.3 Cross-Service Correlation

When calling AI Gateway or external services, propagate the request ID:

```typescript
async function callAIGateway(prompt: string, ctx: RequestContext): Promise<string> {
  const response = await fetch(AI_GATEWAY_URL, {
    headers: {
      'x-request-id': ctx.requestId,
      'x-trace-id': ctx.requestId,  // For distributed tracing
    },
    body: JSON.stringify({ prompt }),
  });
  // ...
}
```

## 5. Alerting Recommendations

### 5.1 Critical Alerts (Page)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Error rate > 5% | 5 min window | Page on-call |
| P99 latency > 10s | 5 min window | Page on-call |
| Rate limit exhaustion | Any tenant | Page on-call |
| AI Gateway failures | > 1% | Page on-call |

### 5.2 Warning Alerts (Notify)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Error rate > 1% | 15 min window | Slack notification |
| P95 latency > 5s | 15 min window | Slack notification |
| Token budget > 80% | Daily | Slack notification |
| Cache hit rate < 50% | 1 hour | Slack notification |

### 5.3 Dashboard Panels

**Overview Dashboard:**
1. Request rate (by tenant)
2. Error rate (by tenant, error type)
3. Latency heatmap (P50, P95, P99)
4. Active sessions

**AI Dashboard:**
1. Token usage (by tenant, model)
2. AI request latency
3. Gateway cache hit rate
4. Model distribution

**RAG Dashboard:**
1. Vector query rate
2. Vector query latency
3. Results per query distribution
4. RAG cache hit rate

**Cost Dashboard:**
1. Token usage trend
2. Projected daily cost
3. Cost by tenant
4. Cost by model

## 6. Cost Tracking

### 6.1 Token Cost Estimation

```typescript
// packages/observability/src/cost.ts

const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  '@cf/meta/llama-3-8b-instruct': { input: 0.0001, output: 0.0002 },
  '@cf/meta/llama-3-70b-instruct': { input: 0.001, output: 0.002 },
  // Add other models
};

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const costs = TOKEN_COSTS[model] ?? { input: 0.0001, output: 0.0002 };
  return (tokensIn * costs.input) + (tokensOut * costs.output);
}
```

### 6.2 Budget Enforcement

```typescript
export async function checkBudget(
  tenant: TenantContext,
  estimatedTokens: number
): Promise<boolean> {
  const dailyLimit = tenant.config.ai.budgets?.dailyTokenLimit;
  if (!dailyLimit) return true;

  const usage = await getTodayTokenUsage(tenant);
  return (usage + estimatedTokens) <= dailyLimit;
}
```

## 7. Implementation Timeline

| Phase | Milestone | Deliverables |
|-------|-----------|--------------|
| M0 | Foundation | Basic logging with request context |
| M1 | Chat | Session metrics, streaming metrics |
| M2 | AI Gateway | AI metrics, token tracking |
| M3 | RAG | Vectorize metrics, cache metrics |
| M7 | Observability | Full metrics, dashboards, alerts |

## 8. Local Development

In development mode, metrics are logged to console:

```typescript
if (env.ENVIRONMENT === 'development') {
  metrics.onFlush((data) => {
    console.log('[METRICS]', JSON.stringify(data, null, 2));
  });
}
```

---

*See also: [architecture.md](./architecture.md), [testing.md](./testing.md)*
