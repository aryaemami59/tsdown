import path from 'node:path'
import { filename_js_to_dts, RE_JS } from 'rolldown-plugin-dts/internal'
import coerce from 'semver/functions/coerce.js'
import satisfies from 'semver/functions/satisfies.js'
import type { ResolvedConfig } from '../config/index.ts'
import type { Plugin } from 'rolldown'

/**
 * Emit a one-time warning when the build targets a Node.js version that
 * natively supports `require(ESM)`, recommending ESM over CJS.
 *
 * @param config - Resolved config; the warning fires only when `format` includes `'cjs'` and the resolved target satisfies `^20.19.0 || >=22.12.0`.
 */
export function warnLegacyCJS(config: ResolvedConfig): void {
  if (
    config.exe ||
    !config.target ||
    !(config.checks?.legacyCjs ?? true) ||
    !config.format.includes('cjs')
  ) {
    return
  }

  const supportRequireESM = config.target.some((t) => {
    const version = coerce(t.split('node')[1])
    return version && satisfies(version, '^20.19.0 || >=22.12.0')
  })

  if (supportRequireESM) {
    config.logger.warnOnce(
      'We recommend using the ESM format instead of CommonJS.\n' +
        'The ESM format is compatible with modern platforms and runtimes, ' +
        'and most new libraries are now distributed only in ESM format.\n' +
        'Learn more at https://nodejs.org/en/learn/modules/publishing-a-package#how-did-we-get-here',
    )
  }
}

/**
 * Rolldown plugin that generates a `.d.ts` re-export shim for CJS entry
 * chunks, forwarding all types from the corresponding `.d.mts` declaration
 * file so that CJS consumers still get accurate type information.
 *
 * @returns A Rolldown plugin that emits the re-export shim in `generateBundle`.
 */
export function CjsDtsReexportPlugin(): Plugin {
  return {
    name: 'tsdown:cjs-dts-reexport',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry) continue

        if (!chunk.fileName.endsWith('.cjs') && !chunk.fileName.endsWith('.js'))
          continue

        const dMtsBasename = path.basename(
          chunk.fileName.replace(RE_JS, '.d.mts'),
        )
        const content = `export type * from './${dMtsBasename}'\n`

        this.emitFile({
          type: 'prebuilt-chunk',
          fileName: filename_js_to_dts(chunk.fileName),
          code: content,
        })
      }
    },
  }
}
