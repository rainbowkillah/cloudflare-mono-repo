import mrrConfig from '../../../tenants/mrrainbowsmoke/index';
import rsoConfig from '../../../tenants/rainbowsmokeofficial/index';
import {
  TenantConfigSchema,
  type TenantConfig,
} from '../../../packages/core/src/index';

const configs: TenantConfig[] = [
  TenantConfigSchema.parse(mrrConfig),
  TenantConfigSchema.parse(rsoConfig),
];

export const TENANT_CONFIGS: Record<string, TenantConfig> = Object.fromEntries(
  configs.map((config) => [config.tenantId, config])
);
