import { TenantResolutionError } from './errors';
import type { TenantConfig } from './tenant-config';

export type TenantConfigMap = Record<string, TenantConfig>;

export type TenantResolution = {
  tenantId: string;
  accountId: string;
  config: TenantConfig;
  resolvedVia: 'header' | 'hostname';
  requestId: string;
};

type ResolveOptions = {
  headerName?: string;
  requestIdHeader?: string;
};

const DEFAULT_HEADER = 'x-tenant-id';
const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';

export function resolveTenantFromRequest(
  request: Request,
  configs: TenantConfigMap,
  options: ResolveOptions = {}
): TenantResolution {
  const headerName = options.headerName ?? DEFAULT_HEADER;
  const requestIdHeader = options.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER;

  const headerTenant = request.headers.get(headerName) ?? undefined;
  const requestId = request.headers.get(requestIdHeader) ?? crypto.randomUUID();
  const hostname = new URL(request.url).hostname;

  if (headerTenant) {
    const config = configs[headerTenant];
    if (!config) {
      throw new TenantResolutionError(`Unknown tenant: ${headerTenant}`);
    }
    return {
      tenantId: headerTenant,
      accountId: config.accountId,
      config,
      resolvedVia: 'header',
      requestId,
    };
  }

  if (hostname) {
    const resolved = resolveTenantByHostname(hostname, configs, requestId);
    if (resolved) {
      return resolved;
    }
  }

  throw new TenantResolutionError('Missing tenant header');
}

function resolveTenantByHostname(
  hostname: string,
  configs: TenantConfigMap,
  requestId: string
): TenantResolution | null {
  const entries = Object.entries(configs);
  for (const [tenantId, config] of entries) {
    if (config.hostnameMapping?.includes(hostname)) {
      return {
        tenantId,
        accountId: config.accountId,
        config,
        resolvedVia: 'hostname',
        requestId,
      };
    }
  }
  return null;
}
