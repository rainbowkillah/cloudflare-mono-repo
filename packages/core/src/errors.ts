export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class TenantResolutionError extends AppError {
  constructor(message = 'Tenant not found') {
    super(message, 'TENANT_NOT_FOUND', 400);
  }
}
