import { z } from 'zod';

export const TenantConfigSchema = z.object({
  tenantId: z.string(),
  accountId: z.string(),
  hostnameMapping: z.array(z.string()).optional(),
  ai: z.object({
    defaultModel: z.string(),
    allowedModels: z.array(z.string()),
    gateway: z
      .object({
        id: z.string(),
        cacheTtl: z.number().optional(),
      })
      .optional(),
    budgets: z
      .object({
        dailyTokenLimit: z.number().optional(),
        requestsPerMinute: z.number().optional(),
      })
      .optional(),
  }),
  vectorize: z.object({
    indexName: z.string(),
    dimensions: z.number(),
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
