/**
 * Naming convention for downloaded assessment reports — must match the backend
 * (assessments/download_utils.py): "<Org unit name>_<dd_mm_yyyy>.xlsx",
 * e.g. "Adabraka Polyclinic_05_08_2026.xlsx".
 */
export function assessmentExportFilename(orgUnitName?: string | null, when: Date = new Date(), extension = 'xlsx'): string {
  const name =
    (orgUnitName ?? '')
      .trim()
      .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
      .replace(/^[\s._]+|[\s._]+$/g, '') || 'Assessment';
  const dd = String(when.getDate()).padStart(2, '0');
  const mm = String(when.getMonth() + 1).padStart(2, '0');
  return `${name}_${dd}_${mm}_${when.getFullYear()}.${extension}`;
}

/**
 * Reads the filename from a Content-Disposition header, preferring the UTF-8
 * `filename*` form (keeps non-ASCII org unit names intact), then `filename`.
 * Returns `fallback` when the header is missing or unreadable.
 */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;

  const extended = header.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/);
  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Malformed encoding — fall through to the plain filename.
    }
  }

  const plain = header.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/);
  const value = (plain?.[1] ?? plain?.[2])?.trim();
  return value || fallback;
}
