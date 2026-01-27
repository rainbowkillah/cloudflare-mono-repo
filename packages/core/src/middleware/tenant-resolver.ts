import { Tenant, TenantContext, AppContext } from '../tenancy';
import type { Env } from '../env';

type AppHandler = (request: Request, env: Env, ctx: AppContext) => Promise<Response> | Response;

const getTenantById = async (id: string, _env: Env): Promise<Tenant | null> => {
  if (id) {
    return { id, name: id };
  }
  return null;
};

const resolveTenantFromRequest = async (request: Request, env: Env): Promise<TenantContext | null> => {
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) {
    const tenant = await getTenantById(headerTenantId, env);
    if (tenant) return { tenant, source: 'header' };
    return null;
  }

  const hostname = new URL(request.url).hostname;
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const sub = parts[0];
    const tenant = await getTenantById(sub, env);
    if (tenant) return { tenant, source: 'hostname' };
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const tokenTenantId = authHeader.substring(7);
    const tenant = await getTenantById(tokenTenantId, env);
    if (tenant) return { tenant, source: 'jwt' };
  }

  return null;
};

export const withTenantResolver = (handler: AppHandler) => {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    const existing = (ctx as Partial<AppContext>).tenant;
    if (existing) {
      return handler(request, env, ctx as AppContext);
    }

    const tenantContext = await resolveTenantFromRequest(request, env);
    if (!tenantContext) {
      return new Response('Unauthorized', { status: 401 });
    }

    const appCtx = Object.assign(ctx, { tenant: tenantContext }) as AppContext;
    return handler(request, env, appCtx);
  };
};
