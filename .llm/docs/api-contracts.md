# API Contracts

> Detailed endpoint specifications for the multi-tenant AI platform.
>
> Author: Claude (Architect)
> Last Updated: 2026-01-26
> Status: Active

## 1. Common Specifications

### 1.1 Base URL

```
Production: https://{tenant}.ai.example.com
Staging:    https://{tenant}.staging.ai.example.com
Development: http://localhost:8787
```

### 1.2 Authentication

```
Header: Authorization: Bearer <token>
```

Token types (to be implemented):
- API Key: `ak_<tenant>_<random>`
- JWT: Standard JWT with `tenant` claim

### 1.3 Common Headers

**Request:**
```
x-tenant-id: string          # Required if not using hostname mapping
x-request-id: string         # Optional, generated if missing
x-session-id: string         # Optional, for session continuity
Content-Type: application/json
```

**Response:**
```
x-request-id: string
x-tenant-id: string
x-ratelimit-limit: number
x-ratelimit-remaining: number
x-ratelimit-reset: number    # Unix timestamp
Content-Type: application/json | text/event-stream
```

### 1.4 Error Format

All errors follow this structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    request_id: string;
  };
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TENANT_NOT_FOUND` | 400 | Cannot resolve tenant |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Upstream service down |

---

## 2. Health Check

### GET /health

Returns service health and version information.

**Request:**
```http
GET /health
x-tenant-id: acme
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "tenant": "acme",
  "timestamp": "2026-01-26T12:00:00Z",
  "services": {
    "kv": "ok",
    "durable_objects": "ok",
    "vectorize": "ok",
    "ai_gateway": "ok"
  }
}
```

**Status Codes:**
- `200` - All systems operational
- `503` - One or more services degraded

---

## 3. Chat Endpoint

### POST /chat

Streaming chat completion with session support.

**Request:**
```typescript
interface ChatRequest {
  messages: Message[];
  session_id?: string;        // Continue existing session
  model?: string;             // Override default model
  stream?: boolean;           // Default: true
  options?: {
    temperature?: number;     // 0-2, default 0.7
    max_tokens?: number;      // Default from tenant config
    stop?: string[];          // Stop sequences
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

**Example Request:**
```http
POST /chat
Content-Type: application/json
x-tenant-id: acme
x-session-id: sess_abc123

{
  "messages": [
    { "role": "user", "content": "What is Cloudflare Workers?" }
  ],
  "stream": true
}
```

**Streaming Response (SSE):**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
x-session-id: sess_abc123
x-request-id: req_xyz789

data: {"type":"start","model":"@cf/meta/llama-3-8b-instruct"}

data: {"type":"chunk","content":"Cloud"}

data: {"type":"chunk","content":"flare"}

data: {"type":"chunk","content":" Workers"}

data: {"type":"done","usage":{"prompt_tokens":15,"completion_tokens":42}}

data: [DONE]
```

**Non-Streaming Response:**
```json
{
  "id": "chat_abc123",
  "session_id": "sess_abc123",
  "model": "@cf/meta/llama-3-8b-instruct",
  "message": {
    "role": "assistant",
    "content": "Cloudflare Workers is a serverless platform..."
  },
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 42
  },
  "created_at": "2026-01-26T12:00:00Z"
}
```

**Event Types (Streaming):**

| Type | Fields | Description |
|------|--------|-------------|
| `start` | `model` | Stream beginning |
| `chunk` | `content` | Text chunk |
| `tool_call` | `name`, `arguments` | Function call request |
| `error` | `code`, `message` | Error during stream |
| `done` | `usage` | Stream complete |

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `429` - Rate limited
- `500` - AI inference failed

---

## 4. Search Endpoint

### POST /search

RAG-powered search with structured results.

**Request:**
```typescript
interface SearchRequest {
  query: string;
  filters?: {
    source?: string[];        // Filter by source
    date_from?: string;       // ISO date
    date_to?: string;
    metadata?: Record<string, string>;
  };
  options?: {
    top_k?: number;           // Default: 5
    include_sources?: boolean; // Default: true
    rerank?: boolean;         // Default: false
  };
}
```

**Example Request:**
```http
POST /search
Content-Type: application/json
x-tenant-id: acme

{
  "query": "How do I deploy Workers?",
  "options": {
    "top_k": 5,
    "include_sources": true
  }
}
```

**Response:**
```typescript
interface SearchResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Source[];
  follow_up_questions?: string[];
  metadata: {
    query_time_ms: number;
    retrieval_count: number;
    cache_hit: boolean;
  };
}

interface Source {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  score: number;
  metadata?: Record<string, unknown>;
}
```

**Example Response:**
```json
{
  "answer": "To deploy Cloudflare Workers, you can use the Wrangler CLI with `wrangler deploy`. This will upload your code to Cloudflare's edge network...",
  "confidence": "high",
  "sources": [
    {
      "id": "doc_123",
      "title": "Getting Started with Workers",
      "snippet": "...use wrangler deploy to push your code...",
      "url": "https://developers.cloudflare.com/workers/get-started/",
      "score": 0.92
    },
    {
      "id": "doc_456",
      "title": "Wrangler Commands",
      "snippet": "...the deploy command uploads your worker...",
      "score": 0.87
    }
  ],
  "follow_up_questions": [
    "How do I configure routes for my Worker?",
    "What are the deployment limits?"
  ],
  "metadata": {
    "query_time_ms": 342,
    "retrieval_count": 5,
    "cache_hit": false
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid query
- `429` - Rate limited

---

## 5. Ingest Endpoint

### POST /ingest

Ingest documents into the RAG pipeline.

**Request:**
```typescript
interface IngestRequest {
  documents: Document[];
  options?: {
    chunk_size?: number;      // Default: 512
    chunk_overlap?: number;   // Default: 50
    batch_size?: number;      // Default: 100
  };
}

interface Document {
  id: string;
  content: string;
  metadata?: {
    title?: string;
    source?: string;
    url?: string;
    created_at?: string;
    [key: string]: unknown;
  };
}
```

**Example Request:**
```http
POST /ingest
Content-Type: application/json
x-tenant-id: acme
Authorization: Bearer ak_acme_xxx

{
  "documents": [
    {
      "id": "doc_001",
      "content": "Cloudflare Workers provides a serverless execution environment...",
      "metadata": {
        "title": "Workers Overview",
        "source": "docs",
        "url": "https://example.com/docs/workers"
      }
    }
  ]
}
```

**Response:**
```json
{
  "ingested": 1,
  "chunks_created": 3,
  "vectors_stored": 3,
  "job_id": "ingest_abc123",
  "duration_ms": 1234
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid documents
- `401` - Unauthorized (requires auth)
- `413` - Payload too large

---

## 6. Tools Endpoint

### POST /tools/execute

Execute a registered tool/function.

**Request:**
```typescript
interface ToolExecuteRequest {
  tool: string;
  arguments: Record<string, unknown>;
  options?: {
    timeout_ms?: number;      // Default: 30000
    async?: boolean;          // Default: false
  };
}
```

**Available Tools:**

| Tool | Arguments | Description |
|------|-----------|-------------|
| `summarize` | `text`, `max_length?` | Summarize text |
| `extract_entities` | `text`, `types?` | Extract named entities |
| `classify_intent` | `text`, `categories` | Classify text intent |
| `tag_document` | `text`, `taxonomy?` | Auto-tag document |
| `ingest_document` | `content`, `metadata` | Ingest single doc |

**Example Request:**
```http
POST /tools/execute
Content-Type: application/json
x-tenant-id: acme

{
  "tool": "summarize",
  "arguments": {
    "text": "Long document content here...",
    "max_length": 100
  }
}
```

**Response:**
```json
{
  "tool": "summarize",
  "result": {
    "summary": "This document discusses the key features of..."
  },
  "metadata": {
    "execution_time_ms": 523,
    "tokens_used": 156
  }
}
```

**Async Response (when `async: true`):**
```json
{
  "job_id": "job_abc123",
  "status": "pending",
  "poll_url": "/tools/jobs/job_abc123"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid arguments
- `403` - Tool not allowed for tenant
- `404` - Tool not found

---

## 7. TTS Endpoint

### POST /tts

Text-to-speech synthesis.

**Request:**
```typescript
interface TTSRequest {
  text: string;
  voice?: string;             // Default: "default"
  format?: 'mp3' | 'wav' | 'opus';  // Default: "mp3"
  speed?: number;             // 0.5-2.0, default 1.0
  stream?: boolean;           // Default: false
}
```

**Example Request:**
```http
POST /tts
Content-Type: application/json
x-tenant-id: acme

{
  "text": "Hello, welcome to our service.",
  "voice": "en-US-female-1",
  "format": "mp3"
}
```

**Response (Non-Streaming):**
```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Content-Length: 12345
x-duration-ms: 2500

<binary audio data>
```

**Response (Streaming):**
```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Transfer-Encoding: chunked
x-duration-ms: 2500

<chunked binary audio data>
```

**Stub Response (when TTS not enabled):**
```json
{
  "error": {
    "code": "TTS_NOT_ENABLED",
    "message": "Text-to-speech is not enabled for this tenant. Contact support to enable.",
    "request_id": "req_xyz"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid text or options
- `501` - TTS not implemented

---

## 8. Session Management

### GET /sessions/:id

Get session details.

**Response:**
```json
{
  "id": "sess_abc123",
  "created_at": "2026-01-26T10:00:00Z",
  "last_active": "2026-01-26T12:30:00Z",
  "message_count": 15,
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "ip_country": "US"
  }
}
```

### DELETE /sessions/:id

Delete a session and its history.

**Response:**
```json
{
  "deleted": true,
  "id": "sess_abc123"
}
```

---

## 9. Rate Limiting

Rate limits are enforced per tenant and returned in headers:

```
x-ratelimit-limit: 100
x-ratelimit-remaining: 95
x-ratelimit-reset: 1706270400
```

**When Rate Limited:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Retry after 60 seconds.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2026-01-26T12:00:00Z"
    },
    "request_id": "req_xyz"
  }
}
```

---

## 10. Webhooks (Future)

### Event Types

| Event | Payload | Description |
|-------|---------|-------------|
| `ingest.completed` | `job_id`, `document_count` | Ingest job finished |
| `ingest.failed` | `job_id`, `error` | Ingest job failed |
| `session.expired` | `session_id` | Session TTL reached |
| `budget.threshold` | `current`, `limit` | Token budget warning |

---

*See also: [architecture.md](./architecture.md), [tenancy.md](./tenancy.md)*
