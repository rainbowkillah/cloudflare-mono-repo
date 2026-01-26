import { describe, expect, it } from 'vitest';
import {
  validateTenantScope,
  formatTenantResourceId,
  extractTenantFromResourceId,
} from './tenant-helpers';
import { AppError } from './errors';

describe('tenant-helpers', () => {
  describe('validateTenantScope', () => {
    it('passes for valid prefix', () => {
      expect(() =>
        validateTenantScope('tenant-a:session-1', 'tenant-a', 'session')
      ).not.toThrow();
    });

    it('throws for invalid prefix', () => {
      expect(() =>
        validateTenantScope('tenant-b:session-1', 'tenant-a', 'session')
      ).toThrowError(AppError);
    });
  });

  describe('formatTenantResourceId', () => {
    it('adds tenant prefix', () => {
      expect(formatTenantResourceId('tenant-a', 'session-1')).toBe(
        'tenant-a:session-1'
      );
    });
  });

  describe('extractTenantFromResourceId', () => {
    it('extracts tenant id', () => {
      expect(extractTenantFromResourceId('tenant-a:session-1')).toBe('tenant-a');
    });

    it('throws for un-prefixed id', () => {
      expect(() => extractTenantFromResourceId('session-1')).toThrowError(
        AppError
      );
    });
  });
});
