import { TenantResolutionError } from './errors';
import type { TenantConfig } from './tenant-config';

export type TenantConfigMap = Record<string, TenantConfig>;

export type TenantResolution = {
  tenantId: string;
  config: TenantConfig;
  resolvedVia: 'header' | 'hostname';
};

type ResolveOptions = {
  headerName?: string;
};

const DEFAULT_HEADER = 'x-tenant-id';

export function resolveTenantFromRequest(
  request: Request,
  configs: TenantConfigMap,
  options: ResolveOptions = {}
): TenantResolution {
  const headerName = options.headerName ?? DEFAULT_HEADER;
  const headerTenant = request.headers.get(headerName) ?? undefined;
  const hostname = new URL(request.url).hostname;

  if (headerTenant) {
    const config = configs[headerTenant];
    if (!config) {
      throw new TenantResolutionError(`Unknown tenant: ${headerTenant}`);
    }
    return { tenantId: headerTenant, config, resolvedVia: 'header' };
  }

  if (hostname) {
    const resolved = resolveTenantByHostname(hostname, configs);
    if (resolved) {
      return resolved;
    }
  }

  throw new TenantResolutionError('Missing tenant header');
}

function resolveTenantByHostname(
  hostname: string,
  configs: TenantConfigMap
): TenantResolution | null {
  const entries = Object.entries(configs);
  for (const [tenantId, config] of entries) {
    if (config.hostnameMapping?.includes(hostname)) {
      return { tenantId, config, resolvedVia: 'hostname' };
    }
  }
  return null;
}
