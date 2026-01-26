import mrrConfig from '@org/tenant-mrrainbowsmoke';
import rsoConfig from '@org/tenant-rainbowsmokeofficial';
import { TenantConfigSchema, type TenantConfig } from '@org/core';

const configs: TenantConfig[] = [
  TenantConfigSchema.parse(mrrConfig),
  TenantConfigSchema.parse(rsoConfig),
];

export const TENANT_CONFIGS: Record<string, TenantConfig> = Object.fromEntries(
  configs.map((config) => [config.tenantId, config])
);
