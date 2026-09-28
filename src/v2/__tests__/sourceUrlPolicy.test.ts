import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  isAllowedWebSourceUrl,
} from '../domain/sourceUrlPolicy';

describe(
  'WORK-016 structured source URL policy',
  () => {
    it.each([
      'http://example.com/reference',
      'https://example.com/reference',
      'HTTPS://EXAMPLE.COM/reference',
    ])(
      'accepts web source URL %s',
      (value) => {
        expect(
          isAllowedWebSourceUrl(value)
        ).toBe(true);
      }
    );

    it.each([
      'javascript:alert(1)',
      'data:text/plain,legacy',
      'file:///C:/legacy/reference.txt',
      'mailto:reader@example.com',
      'ftp://example.com/reference.txt',
      'blob:https://example.com/11111111-1111-4111-8111-111111111111',
      '//example.com/reference',
      '/reference',
      'not a URL',
    ])(
      'rejects non-web or malformed source URL %s',
      (value) => {
        expect(
          isAllowedWebSourceUrl(value)
        ).toBe(false);
      }
    );
  }
);
