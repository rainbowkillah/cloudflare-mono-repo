# Failure Modes Documentation

> Comprehensive failure mode analysis and mitigation strategies.
>
> Author: Claude (Architect) + Gemini (Planner)
> Last Updated: 2026-01-26
> Status: Active

## 1. Failure Mode Template

Every failure mode follows this structure:

```
## [Component] - [Failure Name]

**Severity:** Critical | High | Medium | Low
**Likelihood:** Rare | Unlikely | Possible | Likely

### Scenario
What can break and how.

### Impact
- User impact
- System impact
- Business impact

### Detection
How we know it's happening.

### Mitigation
Immediate steps to reduce impact.

### Recovery
Steps to restore normal operation.

### Prevention
Long-term measures to avoid recurrence.
```

---

## 2. External Service Failures

### 2.1 Workers AI - Model Unavailable

**Severity:** Critical
**Likelihood:** Unlikely

#### Scenario

Workers AI inference endpoint returns 503 or times out. Model may be temporarily unavailable or experiencing high load.

#### Impact

- User: Chat/search requests fail
- System: Cascading timeouts, queue buildup
- Business: Service degradation, SLA breach

#### Detection

```typescript
// Metrics to watch
ai_requests_total{status="503"} > 0
ai_request_duration_ms{quantile="0.99"} > 30000
```

Alerts:

- Error rate > 5% for 2 minutes
- P99 latency > 30s for 5 minutes

#### Mitigation

1. Return cached responses where available
2. Degrade to shorter/simpler responses
3. Queue requests for retry
4. Display user-friendly error message

```typescript
async function callAIWithFallback(prompt: string, tenant: TenantContext): Promise<string> {
  try {
    return await callWorkersAI(prompt, tenant);
  } catch (error) {
    if (error.status === 503) {
      // Try cache first
      const cached = await getCachedResponse(prompt, tenant);
      if (cached) return cached;

      // Fallback message
      return "I'm experiencing high demand. Please try again in a moment.";
    }
    throw error;
  }
}
```

#### Recovery

1. Workers AI recovers automatically
2. Retry queued requests with exponential backoff
3. Clear any circuit breakers after success

#### Prevention

- Implement circuit breaker pattern
- Cache common responses
- Set appropriate timeouts
- Monitor Workers AI status page

---

### 2.2 AI Gateway - Connection Failure

**Severity:** High
**Likelihood:** Rare

#### Scenario

AI Gateway is unreachable or returning errors. Could be configuration issue or service outage.

#### Impact

- User: All AI requests fail
- System: No model inference possible
- Business: Complete service outage for AI features

#### Detection

```typescript
// Health check
const gatewayHealthy = await checkGatewayHealth();
// Metrics
ai_gateway_errors_total > 0;
```

#### Mitigation

1. Fallback to direct Workers AI (bypass gateway)
2. Log incident for investigation
3. Notify on-call

```typescript
async function callWithGatewayFallback(prompt: string): Promise<string> {
  if (await isGatewayHealthy()) {
    return callViaGateway(prompt);
  }

  console.warn('AI Gateway unavailable, falling back to direct');
  return callWorkersAIDirect(prompt);
}
```

#### Recovery

1. Verify gateway configuration
2. Check Cloudflare status
3. Re-enable gateway routing once healthy

#### Prevention

- Regular gateway health checks
- Maintain direct fallback path
- Monitor gateway metrics

---

### 2.3 Vectorize - Query Timeout

**Severity:** High
**Likelihood:** Possible

#### Scenario

Vectorize queries take too long or time out. May indicate index issues or high load.

#### Impact

- User: Search/RAG requests slow or fail
- System: Request queue buildup
- Business: Degraded search quality

#### Detection

```typescript
vectorize_query_duration_ms{quantile="0.95"} > 5000
vectorize_errors_total{error="timeout"} > 0
```

#### Mitigation

1. Reduce topK for faster queries
2. Return partial results if available
3. Fallback to keyword search

```typescript
async function searchWithFallback(query: string, tenant: TenantContext): Promise<SearchResult[]> {
  try {
    return await vectorSearch(query, { topK: 10, timeout: 5000 });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      // Try with fewer results
      return await vectorSearch(query, { topK: 3, timeout: 3000 });
    }
    throw error;
  }
}
```

#### Recovery

1. Check index health
2. Reduce concurrent queries
3. Consider index rebuild if persistent

#### Prevention

- Optimize embedding dimensions
- Implement query caching
- Monitor index size and query patterns

---

### 2.4 KV - Read/Write Failure

**Severity:** Medium
**Likelihood:** Rare

#### Scenario

KV operations fail or have high latency. Rare but possible during regional issues.

#### Impact

- User: Cache misses, slower responses
- System: Increased load on other services
- Business: Performance degradation

#### Detection

```typescript
kv_errors_total > 0
kv_latency_ms{quantile="0.95"} > 500
```

#### Mitigation

1. Proceed without cache (accept slower response)
2. Use in-memory fallback for session duration
3. Log for investigation

```typescript
async function getWithFallback(key: string): Promise<string | null> {
  try {
    return await kv.get(key);
  } catch (error) {
    console.error('KV read failed:', error);
    // Return null, caller will fetch fresh data
    return null;
  }
}
```

#### Recovery

1. KV typically self-heals
2. Retry failed writes
3. Warm cache after recovery

#### Prevention

- Don't depend on cache for correctness
- Implement graceful degradation
- Monitor KV health metrics

---

### 2.5 Durable Objects - Unavailable

**Severity:** Critical
**Likelihood:** Rare

#### Scenario

Durable Object stubs cannot be created or accessed. May be regional outage.

#### Impact

- User: Sessions lost, rate limits fail
- System: Stateful operations impossible
- Business: Significant functionality loss

#### Detection

```typescript
do_errors_total > 0
do_latency_ms{quantile="0.95"} > 1000
```

#### Mitigation

1. Create temporary in-memory session
2. Disable rate limiting (accept risk)
3. Return cached responses only

```typescript
async function getSessionWithFallback(sessionId: string): Promise<Session> {
  try {
    return await getSessionFromDO(sessionId);
  } catch (error) {
    console.error('DO unavailable, creating temporary session');
    return createTemporarySession(sessionId);
  }
}
```

#### Recovery

1. DO typically recovers automatically
2. Reconcile temporary sessions
3. Verify rate limit state

#### Prevention

- Design for DO unavailability
- Implement temporary fallbacks
- Monitor DO health

---

## 3. Internal Failures

### 3.1 Tenant Resolution Failure

**Severity:** Critical
**Likelihood:** Unlikely

#### Scenario

Cannot resolve tenant from request. Configuration issue or invalid request.

#### Impact

- User: All requests rejected
- System: Cannot process any requests
- Business: Complete service outage

#### Detection

```typescript
tenant_resolution_errors_total > threshold
http_requests_total{status="400"} spike
```

#### Mitigation

1. Check configuration validity
2. Verify tenant exists
3. Log detailed error for debugging

```typescript
async function resolveTenantSafe(request: Request): Promise<TenantContext | null> {
  try {
    return await resolveTenant(request);
  } catch (error) {
    console.error('Tenant resolution failed:', {
      headers: Object.fromEntries(request.headers),
      url: request.url,
      error: error.message,
    });
    return null;
  }
}
```

#### Recovery

1. Fix configuration
2. Redeploy if needed
3. Clear any caches

#### Prevention

- Validate config on deploy
- Test tenant resolution
- Monitor resolution success rate

---

### 3.2 Rate Limit Exhaustion

**Severity:** Medium
**Likelihood:** Possible

#### Scenario

Tenant or user exceeds rate limits. Could be legitimate spike or abuse.

#### Impact

- User: Requests rejected with 429
- System: Protected from overload
- Business: User frustration, potential abuse

#### Detection

```typescript
rate_limit_hits_total{tenant=*} > normal_baseline
http_requests_total{status="429"} spike
```

#### Mitigation

1. Return clear retry-after header
2. Log for abuse analysis
3. Consider temporary limit increase

```typescript
function handleRateLimited(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Retry after ${result.retryAfter} seconds.`,
        retry_after: result.retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  );
}
```

#### Recovery

1. Wait for rate limit window to reset
2. Investigate if abuse
3. Adjust limits if legitimate

#### Prevention

- Set appropriate limits per tier
- Implement burst allowance
- Monitor usage patterns

---

### 3.3 Memory/CPU Exhaustion

**Severity:** High
**Likelihood:** Unlikely

#### Scenario

Worker exceeds memory or CPU limits. Usually from large payloads or infinite loops.

#### Impact

- User: Request fails with 503
- System: Worker terminated
- Business: Request lost

#### Detection

```typescript
// Workers Analytics
cpu_time_ms > limit;
memory_mb > limit;
```

#### Mitigation

1. Implement request timeouts
2. Limit payload sizes
3. Stream large responses

```typescript
// Payload limits
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

async function handleRequest(request: Request): Promise<Response> {
  const contentLength = parseInt(request.headers.get('content-length') || '0');

  if (contentLength > MAX_REQUEST_SIZE) {
    return new Response('Payload too large', { status: 413 });
  }

  // Process with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    return await processRequest(request, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}
```

#### Recovery

1. Worker auto-restarts
2. Next request succeeds

#### Prevention

- Enforce payload limits
- Use streaming for large data
- Profile and optimize hot paths

---

### 3.4 Streaming Interruption

**Severity:** Medium
**Likelihood:** Possible

#### Scenario

Client disconnects during streaming response. Need to clean up gracefully.

#### Impact

- User: Partial response received
- System: Resources may not be cleaned up
- Business: Poor user experience

#### Detection

```typescript
stream_aborts_total > baseline;
incomplete_responses_total > 0;
```

#### Mitigation

```typescript
async function handleStreamingChat(request: Request): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Handle abort
  request.signal.addEventListener('abort', async () => {
    console.log('Client disconnected');
    await writer.close();
    // Cleanup resources
  });

  // Start streaming in background
  streamResponse(writer).catch(async (error) => {
    if (error.name !== 'AbortError') {
      console.error('Stream error:', error);
    }
    await writer.abort(error);
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

#### Recovery

1. Client can retry request
2. Session state preserved in DO

#### Prevention

- Implement proper abort handling
- Use heartbeat pings
- Set reasonable timeouts

---

## 4. Data Integrity Failures

### 4.1 Vector Index Corruption

**Severity:** High
**Likelihood:** Rare

#### Scenario

Vectorize index becomes corrupted or returns incorrect results.

#### Impact

- User: Wrong or no search results
- System: RAG quality degraded
- Business: Trust erosion

#### Detection

```typescript
// Quality monitoring
rag_quality_score < threshold;
search_results_empty_rate > baseline;
```

#### Mitigation

1. Fall back to cached results
2. Return "no results" rather than bad results
3. Queue re-indexing job

#### Recovery

1. Identify corrupted vectors
2. Re-embed and upsert affected documents
3. Full index rebuild if necessary

#### Prevention

- Validate embeddings before upsert
- Regular quality smoke tests
- Maintain document source for rebuild

---

### 4.2 Session State Loss

**Severity:** Medium
**Likelihood:** Rare

#### Scenario

Durable Object loses session state. Could be from bug or edge case.

#### Impact

- User: Conversation history lost
- System: Session appears new
- Business: User frustration

#### Detection

```typescript
session_not_found_errors > 0;
user_reports_lost_history;
```

#### Mitigation

1. Create new session transparently
2. Apologize and explain
3. Log for investigation

```typescript
async function getOrCreateSession(sessionId: string): Promise<Session> {
  try {
    const session = await getSession(sessionId);
    if (session) return session;
  } catch (error) {
    console.error('Session retrieval failed:', error);
  }

  // Create new session
  console.warn(`Session ${sessionId} not found, creating new`);
  return await createSession(sessionId);
}
```

#### Recovery

1. Session recreated on next request
2. Investigate root cause
3. Consider backup strategy

#### Prevention

- Regular session persistence
- Backup critical sessions
- Monitor session health

---

## 5. Security Failures

### 5.1 Authentication Bypass

**Severity:** Critical
**Likelihood:** Rare

#### Scenario

Authentication mechanism fails to validate properly.

#### Impact

- User: Unauthorized access possible
- System: Security breach
- Business: Compliance violation, data breach

#### Detection

```typescript
auth_failures_total spike
unauthorized_access_attempts > 0
```

#### Mitigation

1. Immediately disable affected auth method
2. Rotate compromised credentials
3. Audit access logs

#### Recovery

1. Fix authentication logic
2. Force re-authentication
3. Notify affected users

#### Prevention

- Regular security audits
- Penetration testing
- Defense in depth

---

### 5.2 Cross-Tenant Data Leak

**Severity:** Critical
**Likelihood:** Rare

#### Scenario

Tenant A can access Tenant B's data due to bug.

#### Impact

- User: Data exposed to wrong tenant
- System: Isolation breach
- Business: Severe compliance/trust violation

#### Detection

```typescript
// Isolation tests in CI
// Anomaly detection on access patterns
cross_tenant_access_attempts > 0;
```

#### Mitigation

1. Immediately disable affected endpoint
2. Audit all recent access
3. Notify affected tenants

#### Recovery

1. Fix isolation bug
2. Verify with tests
3. Security review before re-enable

#### Prevention

- Mandatory isolation tests
- Defense in depth (multiple checks)
- Regular security audits

---

## 6. Operational Failures

### 6.1 Deployment Failure

**Severity:** Medium
**Likelihood:** Possible

#### Scenario

Deployment fails partway through multi-tenant deploy.

#### Impact

- User: Some tenants on old version
- System: Inconsistent state
- Business: Potential compatibility issues

#### Detection

```typescript
// Deployment monitoring
deployment_status != 'complete'
tenant_versions not uniform
```

#### Mitigation

1. Stop deployment
2. Rollback failed tenants
3. Investigate failure

```bash
# Rollback script
#!/bin/bash
for tenant in $(get_failed_tenants); do
  wrangler rollback --tenant $tenant
done
```

#### Recovery

1. Fix deployment issue
2. Retry deployment
3. Verify all tenants updated

#### Prevention

- Staged rollouts
- Canary deployments
- Automated rollback

---

### 6.2 Configuration Drift

**Severity:** Medium
**Likelihood:** Possible

#### Scenario

Deployed configuration differs from intended state.

#### Impact

- User: Unexpected behavior
- System: Inconsistent configuration
- Business: Difficult troubleshooting

#### Detection

```typescript
// Drift detection
deployed_config != expected_config;
binding_mismatches > 0;
```

#### Mitigation

1. Identify drifted configuration
2. Document intended state
3. Plan correction

#### Recovery

1. Apply correct configuration
2. Verify with tests
3. Update documentation

#### Prevention

- Infrastructure as code
- Automated drift detection
- Config validation on deploy

---

## 7. Failure Response Runbook

### Severity Levels

| Level    | Response Time     | Escalation           | Example                 |
| -------- | ----------------- | -------------------- | ----------------------- |
| Critical | 15 min            | Immediate page       | Auth bypass, data leak  |
| High     | 1 hour            | Page if not resolved | AI unavailable, DO down |
| Medium   | 4 hours           | Slack notification   | Rate limits, cache miss |
| Low      | Next business day | Ticket               | Performance degradation |

### On-Call Response

1. **Acknowledge** - Respond to page within 5 min
2. **Assess** - Determine severity and scope
3. **Mitigate** - Apply immediate fixes
4. **Communicate** - Update status page/stakeholders
5. **Resolve** - Fix root cause
6. **Document** - Post-incident review

---

_See also: [architecture.md](./architecture.md), [metrics.md](./metrics.md), [security.md](./security.md)_
