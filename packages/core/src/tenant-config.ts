import { z } from 'zod';

export const TenantConfigSchema = z.object({
  tenantId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, 'Tenant ID must contain only lowercase letters, numbers, and hyphens'),
  accountId: z.string().optional(),
  hostnameMapping: z.record(z.string()).optional(),
  ai: z
    .object({
      models: z.array(z.string()),
      gatewayRoutes: z.record(z.string()).optional(),
      budgets: z
        .object({
          tokensPerDay: z.number().optional(),
          requestsPerMinute: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  vectorize: z
    .object({
      indexNames: z.array(z.string()).optional(),
    })
    .optional(),
  kv: z
    .object({
      namespaceMappings: z.record(z.string()).optional(),
    })
    .optional(),
  durable_objects: z
    .object({
      classBindings: z.record(z.string()).optional(),
    })
    .optional(),
  cors: z
    .object({
      origins: z.array(z.string()).optional(),
      allowCredentials: z.boolean().optional(),
    })
    .optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
