/**
 * Converts a UTC ISO string to a locale-formatted display string.
 *
 * @param utcIso  - ISO 8601 UTC date string, e.g. "2026-06-19T15:00:00Z"
 * @param format  - 'date' | 'time' | 'datetime' (default: 'datetime')
 * @param locale  - BCP 47 locale string (default: browser locale)
 */
export function toLocalDisplay(
  utcIso: string,
  format: 'date' | 'time' | 'datetime' = 'datetime',
  locale?: string
): string {
  if (!utcIso) return '';

  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return utcIso; // return raw value if unparseable

  const resolvedLocale = locale ?? navigator.language ?? 'en-IN';

  const options: Intl.DateTimeFormatOptions =
    format === 'date'
      ? { year: 'numeric', month: 'short', day: '2-digit' }
      : format === 'time'
      ? { hour: '2-digit', minute: '2-digit', hour12: true }
      : {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        };

  return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
}
