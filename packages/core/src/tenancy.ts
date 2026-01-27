export interface Tenant {
  id: string;
  name: string;
}

export type ResolutionSource = 'header' | 'hostname' | 'jwt';

export interface TenantContext {
  tenant: Tenant;
  source: ResolutionSource;
}

export type AppContext = ExecutionContext & {
  tenant: TenantContext;
};
