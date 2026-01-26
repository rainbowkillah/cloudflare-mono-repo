/// <reference types="@cloudflare/workers-types" />

import {
  errorResponse,
  jsonResponse,
  resolveTenantFromRequest,
  type Env,
} from '@org/core';
import { TENANT_CONFIGS } from './tenant-configs';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    try {
      const tenant = resolveTenantFromRequest(request, TENANT_CONFIGS);

      if (url.pathname === '/health') {
        return jsonResponse({
          status: 'ok',
          tenant: tenant.tenantId,
          version: '1.0.0', // TODO: Get from build info
          timestamp: new Date().toISOString(),
        });
      }

      return jsonResponse({
        ok: true,
        tenantId: tenant.tenantId,
        resolvedVia: tenant.resolvedVia,
      });
    } catch (error) {
      // If health check fails to resolve tenant, return a generic success but with warning
      if (url.pathname === '/health') {
        return jsonResponse({
          status: 'degraded',
          message: 'Tenant could not be resolved',
          timestamp: new Date().toISOString(),
        });
      }
      return errorResponse(error);
    }
  },
};
