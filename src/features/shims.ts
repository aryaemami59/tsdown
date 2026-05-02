import path from 'node:path'
import type { NormalizedFormat, ResolvedConfig } from '../config/index.ts'

/**
 * Absolute path to the `esm-shims.js` file that provides
 * {@linkcode https://nodejs.org/api/modules.html#dirname | __dirname} and
 * {@linkcode https://nodejs.org/api/modules.html#filename | __filename} shims
 * for ESM output targeting Node.js.
 */
export const shimFile: string = path.resolve(
  import.meta.dirname,
  import.meta.TSDOWN_PRODUCTION ? '..' : '../..',
  'esm-shims.js',
)

/**
 * Get the Rolldown
 * {@linkcode https://rolldown.rs/reference/InputOptions.transform#inject | inject}
 * map needed to shim
 * {@linkcode https://nodejs.org/api/modules.html#dirname | __dirname} and
 * {@linkcode https://nodejs.org/api/modules.html#filename | __filename} in ESM
 * Node.js output, or `undefined` when shimming is not required.
 *
 * @param format - The normalized output {@linkcode ResolvedConfig.format | format} for the current build.
 * @param platform - The target {@linkcode ResolvedConfig.platform | platform} (`'node'`, `'browser'` or `'neutral'`).
 * @returns An {@linkcode https://rolldown.rs/reference/InputOptions.transform#inject | inject} map pointing to the shim file, or `undefined` for non-ESM Node.js builds.
 */
export function getShimsInject(
  format: NormalizedFormat,
  platform: ResolvedConfig['platform'],
): Record<string, [shimFile: string, shimExport: string]> | undefined {
  if (format === 'es' && platform === 'node') {
    return {
      __dirname: [shimFile, '__dirname'],
      __filename: [shimFile, '__filename'],
    }
  }
}
