/**
 * Unit tests for validation utilities
 */

import { validateEmail, validatePassword, validateDisplayName } from '../utils/validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.name+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('user123@test-domain.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('noatsign.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  it('should reject emails with multiple @ symbols', () => {
    expect(validateEmail('user@@domain.com')).toBe(false);
    expect(validateEmail('user@domain@com')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept passwords with 6+ characters', () => {
    expect(validatePassword('123456')).toEqual({ valid: true });
    expect(validatePassword('password')).toEqual({ valid: true });
    expect(validatePassword('verylongpassword123')).toEqual({ valid: true });
  });

  it('should reject passwords shorter than 6 characters', () => {
    expect(validatePassword('')).toEqual({
      valid: false,
      message: 'Password must be at least 6 characters'
    });
    expect(validatePassword('12345')).toEqual({
      valid: false,
      message: 'Password must be at least 6 characters'
    });
    expect(validatePassword('abc')).toEqual({
      valid: false,
      message: 'Password must be at least 6 characters'
    });
  });

  it('should accept exactly 6 characters', () => {
    expect(validatePassword('abcdef')).toEqual({ valid: true });
  });
});

describe('validateDisplayName', () => {
  it('should accept valid display names', () => {
    expect(validateDisplayName('Jo')).toEqual({ valid: true });
    expect(validateDisplayName('John Doe')).toEqual({ valid: true });
    expect(validateDisplayName('A valid name')).toEqual({ valid: true });
  });

  it('should reject names shorter than 2 characters after trim', () => {
    expect(validateDisplayName('')).toEqual({
      valid: false,
      message: 'Display name must be at least 2 characters'
    });
    expect(validateDisplayName('A')).toEqual({
      valid: false,
      message: 'Display name must be at least 2 characters'
    });
    expect(validateDisplayName('  ')).toEqual({
      valid: false,
      message: 'Display name must be at least 2 characters'
    });
    expect(validateDisplayName(' X ')).toEqual({
      valid: false,
      message: 'Display name must be at least 2 characters'
    });
  });

  it('should reject names longer than 50 characters', () => {
    const longName = 'A'.repeat(51);
    expect(validateDisplayName(longName)).toEqual({
      valid: false,
      message: 'Display name too long (max 50 characters)'
    });
  });

  it('should accept exactly 50 characters', () => {
    const maxName = 'A'.repeat(50);
    expect(validateDisplayName(maxName)).toEqual({ valid: true });
  });

  it('should trim whitespace for length check', () => {
    expect(validateDisplayName('  AB  ')).toEqual({ valid: true });
  });
});
