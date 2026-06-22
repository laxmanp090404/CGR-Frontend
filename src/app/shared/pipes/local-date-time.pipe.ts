import { Pipe, PipeTransform } from '@angular/core';
import { toLocalDisplay } from '../utils/date.util';

/**
 * Transforms a UTC ISO string to a human-readable local date/time.
 *
 * Usage in templates:
 *   {{ utcString | localDateTime }}          → "Jun 19, 2026, 09:00 PM"
 *   {{ utcString | localDateTime:'date' }}   → "Jun 19, 2026"
 *   {{ utcString | localDateTime:'time' }}   → "09:00 PM"
 */
@Pipe({
  name: 'localDateTime',
  standalone: true,
})
export class LocalDateTimePipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    format: 'date' | 'time' | 'datetime' = 'datetime',
    locale?: string
  ): string {
    if (!value) return '';
    return toLocalDisplay(value, format, locale);
  }
}
