export interface Env {
  // AI Inference
  AI: any;

  // KV Namespaces
  RATE_LIMITER: KVNamespace;
  CONFIG: KVNamespace;
  CACHE: KVNamespace;

  // D1 Database
  DB: D1Database;

  // Durable Objects
  RATE_LIMITER_DO: DurableObjectNamespace;
  CHAT_SESSION: DurableObjectNamespace;

  // Secrets
  API_KEY: string;

  // Configuration (Env Vars)
  ENVIRONMENT: 'dev' | 'staging' | 'production';
  MODEL_ID: string;
  FALLBACK_MODEL_ID?: string;
  DEBUG_LOGGING?: boolean;

  // M0 / Internal
  TENANT_CONFIGS?: KVNamespace;
}
