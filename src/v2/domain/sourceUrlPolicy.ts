/**
 * WORK-016 navigation/import policy for structured source URLs.
 *
 * This policy is intentionally separate from the legacy-compatible
 * SourceReference domain schema. Existing persisted and backup data may
 * contain syntactically valid absolute URLs using other protocols, but only
 * HTTP(S) URLs may be accepted for new imports or exposed as navigation.
 */
export function isAllowedWebSourceUrl(
  value: string
): boolean {
  try {
    const protocol =
      new URL(value).protocol;

    return (
      protocol === 'http:' ||
      protocol === 'https:'
    );
  } catch {
    return false;
  }
}
