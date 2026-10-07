import { describe, expect, it } from 'vitest';
import { ApiError } from './error-handler';
import { resolveScopedUserId } from './permissions';

function req(role: string, userId = 'self') {
  return {
    userId,
    user: { role },
  } as any;
}

describe('resolveScopedUserId', () => {
  it('forces members onto their own user id when none is requested', () => {
    expect(resolveScopedUserId(req('member'), undefined)).toBe('self');
  });

  it('lets managers omit userId to query the whole org', () => {
    expect(resolveScopedUserId(req('manager'), undefined)).toBeUndefined();
    expect(resolveScopedUserId(req('admin'), undefined)).toBeUndefined();
  });

  it('allows members to request their own id', () => {
    expect(resolveScopedUserId(req('member'), 'self')).toBe('self');
  });

  it('blocks members from requesting another user', () => {
    expect(() => resolveScopedUserId(req('member'), 'other')).toThrow(ApiError);
  });

  it('allows managers to request another user', () => {
    expect(resolveScopedUserId(req('manager'), 'other')).toBe('other');
  });
});
