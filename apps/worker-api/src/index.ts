import { errorResponse, jsonResponse, resolveTenantFromRequest } from '@org/core';
import { TENANT_CONFIGS } from './tenant-configs';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ ok: true });
    }

    try {
      const tenant = resolveTenantFromRequest(request, TENANT_CONFIGS);
      return jsonResponse({
        ok: true,
        tenantId: tenant.tenantId,
        resolvedVia: tenant.resolvedVia,
      });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
