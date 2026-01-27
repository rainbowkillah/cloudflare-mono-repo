import { z } from 'zod';

export const EnvSchema = z.object({
  KV: z.custom<KVNamespace>((val) => val !== undefined, 'KV binding is missing'),
  VECTORIZE_INDEX: z.custom<VectorizeIndex>((val) => val !== undefined, 'VECTORIZE_INDEX binding is missing'),
  AI: z.custom<Ai>((val) => val !== undefined, 'AI binding is missing'),
  SESSIONS: z.custom<DurableObjectNamespace>().optional(),
  RATE_LIMITER: z.custom<DurableObjectNamespace>().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

export type Env = z.infer<typeof EnvSchema>;

export const validateEnv = (env: unknown): Env => {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error('Invalid environment configuration. Worker cannot start.');
  }
  return result.data;
};
