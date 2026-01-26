import { AppError } from './errors';

/**
 * Validates that a resource ID (e.g., Durable Object ID) is properly scoped to a tenant.
 * Prevents cross-tenant access if an ID is forged or leaked.
 */
export function validateTenantScope(
  resourceId: string,
  tenantId: string,
  resourceType: string
): void {
  const prefix = `${tenantId}:`;
  if (!resourceId.startsWith(prefix)) {
    throw new AppError(
      `Access denied: Resource ${resourceType} (${resourceId}) is not scoped to tenant ${tenantId}`,
      'ISOLATION_BREACH',
      403
    );
  }
}

/**
 * Formats a resource ID with a tenant prefix.
 */
export function formatTenantResourceId(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}

/**
 * Extracts the tenant ID from a prefixed resource ID.
 */
export function extractTenantFromResourceId(resourceId: string): string {
  const parts = resourceId.split(':');
  if (parts.length < 2) {
    throw new AppError(
      `Invalid resource ID format: ${resourceId}`,
      'INVALID_RESOURCE_ID',
      400
    );
  }
  return parts[0];
}
