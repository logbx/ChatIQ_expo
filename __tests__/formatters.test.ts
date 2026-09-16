/**
 * Unit tests for formatter utilities
 */

import { getInitials, truncate, formatTimestamp, formatLastSeen } from '../utils/formatters';

describe('getInitials', () => {
  it('should return first two letters for single word names', () => {
    expect(getInitials('John')).toBe('JO');
    expect(getInitials('Alice')).toBe('AL');
    expect(getInitials('X')).toBe('X');
  });

  it('should return first letter of first and last word for multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alice Bob Smith')).toBe('AS');
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('should handle empty or whitespace names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('');
  });

  it('should handle extra whitespace between words', () => {
    expect(getInitials('John   Doe')).toBe('JD');
    expect(getInitials('  Alice  Bob  ')).toBe('AB');
  });

  it('should uppercase the result', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('alice')).toBe('AL');
  });
});

describe('truncate', () => {
  it('should return original text if shorter than maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Short text', 20)).toBe('Short text');
  });

  it('should return original text if exactly maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should truncate and add ellipsis if longer than maxLength', () => {
    expect(truncate('This is a long text', 10)).toBe('This is...');
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('should handle edge case with maxLength <= 3', () => {
    expect(truncate('Hello', 3)).toBe('...');
    expect(truncate('Hi', 3)).toBe('Hi');
  });
});

describe('formatTimestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format today messages with time', () => {
    const now = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(now);
    
    const messageTime = new Date('2024-01-15T10:15:00').getTime();
    const result = formatTimestamp(messageTime);
    
    expect(result).toMatch(/10:15/);
    expect(result).toMatch(/AM/i);
  });

  it('should format this week messages with day', () => {
    const now = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(now);
    
    const messageTime = new Date('2024-01-13T10:15:00').getTime();
    const result = formatTimestamp(messageTime);
    
    expect(result).toMatch(/Sat/i);
  });

  it('should format older messages with date', () => {
    const now = new Date('2024-01-15T14:30:00');
    jest.setSystemTime(now);
    
    const messageTime = new Date('2023-12-10T10:15:00').getTime();
    const result = formatTimestamp(messageTime);
    
    expect(result).toMatch(/Dec/i);
    expect(result).toMatch(/10/);
  });
});

describe('formatLastSeen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show "Just now" for very recent timestamps', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    expect(formatLastSeen(now)).toBe('Just now');
    expect(formatLastSeen(now - 30000)).toBe('Just now');
  });

  it('should show minutes for timestamps within the last hour', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    expect(formatLastSeen(now - 2 * 60 * 1000)).toBe('2 minutes ago');
    expect(formatLastSeen(now - 30 * 60 * 1000)).toBe('30 minutes ago');
  });

  it('should show hours for timestamps within the last day', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    expect(formatLastSeen(now - 2 * 60 * 60 * 1000)).toBe('2 hours ago');
    expect(formatLastSeen(now - 12 * 60 * 60 * 1000)).toBe('12 hours ago');
  });

  it('should show "Yesterday at <time>" for yesterday', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    const yesterday = now - 24 * 60 * 60 * 1000;
    const result = formatLastSeen(yesterday);
    
    expect(result).toContain('Yesterday at');
  });

  it('should show days ago for timestamps within the last week', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    expect(formatLastSeen(now - 3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
    expect(formatLastSeen(now - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
  });

  it('should show full date for older timestamps', () => {
    const now = Date.now();
    jest.setSystemTime(now);
    
    const oldTime = now - 10 * 24 * 60 * 60 * 1000;
    const result = formatLastSeen(oldTime);
    
    expect(result).toMatch(/\w{3}\s\d{1,2}/);
  });
});
