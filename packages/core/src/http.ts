import { AppError } from './errors';

export type ErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { ...init, headers });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return jsonResponse(
      { error: { code: error.code, message: error.message } } as ErrorPayload,
      { status: error.status }
    );
  }

  return jsonResponse(
    { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } } as ErrorPayload,
    { status: 500 }
  );
}
