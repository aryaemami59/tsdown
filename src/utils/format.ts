/**
 * Format a byte count into a human-readable string (kB or MB).
 *
 * @param bytes - The number of bytes to format.
 * @returns A formatted string such as `'1.23 kB'` or `'4.56 MB'`, or `undefined` when {@linkcode bytes} is {@linkcode Infinity}.
 */
export function formatBytes(bytes: number): string | undefined {
  if (bytes === Infinity) return undefined
  if (bytes > 1000_000) {
    return `${(bytes / 1_000_000).toFixed(2)} MB`
  }
  return `${(bytes / 1000).toFixed(2)} kB`
}
