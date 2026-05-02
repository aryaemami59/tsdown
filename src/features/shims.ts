import path from 'node:path'
import type { ResolvedConfig } from '../config/index.ts'
import type { Plugin } from 'rolldown'

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

const shimsInject: Record<string, [string, string]> = {
  __dirname: [shimFile, '__dirname'],
  __filename: [shimFile, '__filename'],
}

const shimsDefine: Record<string, string> = {
  __dirname: '__TSDOWN_SHIM_DIRNAME__',
  __filename: '__TSDOWN_SHIM_FILENAME__',
}

const shimsInjectCode = `
import __tsdown_shims_path from 'node:path'
import __tsdown_shims_url from 'node:url'

const __TSDOWN_SHIM_FILENAME__ = /* @__PURE__ */ __tsdown_shims_url.fileURLToPath(import.meta.url)
const __TSDOWN_SHIM_DIRNAME__ = /* @__PURE__ */ __tsdown_shims_path.dirname(__TSDOWN_SHIM_FILENAME__)
`

export const shimsPlugin: Plugin = {
  name: 'tsdown:shims-banner',
  banner: shimsInjectCode,
}

/**
 * Get the Rolldown
 * {@linkcode https://rolldown.rs/reference/InputOptions.transform#inject | inject}
 * map needed to shim
 * {@linkcode https://nodejs.org/api/modules.html#dirname | __dirname} and
 * {@linkcode https://nodejs.org/api/modules.html#filename | __filename} in ESM
 * Node.js output, or `undefined` when shimming is not required.
 *
 * @param config - The resolved configuration object.
 * @returns An {@linkcode https://rolldown.rs/reference/InputOptions.transform#inject | inject} map pointing to the shim file, or `undefined` for non-ESM Node.js builds.
 */
export function getShims(config: ResolvedConfig): {
  define?: Record<string, string>
  inject?: Record<string, [shimFile: string, shimExport: string]>
  plugin?: Plugin
} {
  if (config.format !== 'es' || config.platform !== 'node') return {}

  if (config.unbundle) {
    return {
      define: shimsDefine,
      plugin: shimsPlugin,
    }
  }

  return { inject: shimsInject }
}
