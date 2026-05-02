import { addOutDirToChunks } from '../utils/chunks.ts'
import { resolveComma, toArray } from '../utils/general.ts'
import { resolveCopyEntries } from './copy.ts'
import type { TsdownBundle } from '../config/types.ts'
import type { Plugin } from 'rolldown'

export const endsWithConfig: RegExp =
  /[\\/](?:tsdown\.config.*|package\.json|tsconfig\.json)$/

/**
 * Rolldown plugin that wires up watch mode: registers config files, tsconfig,
 * copy sources, and package.json as watch dependencies, applies
 * {@linkcode UserConfig.ignoreWatch | ignoreWatch} exclusions, and collects
 * output chunks into the shared bundle after each build.
 *
 * @param configDeps - Set of config-file paths that should trigger a full restart when changed.
 * @param bundle - The shared {@linkcode TsdownBundle} for this build; the plugin reads `config` for settings and appends to `chunks` after each Rolldown build.
 * @param bundle.config - The resolved config for the current build; used to read watch settings and ignored watch paths.
 * @param bundle.chunks - The shared array that collects output chunks across all builds; the plugin appends new chunks to this after each build.
 * @returns A Rolldown plugin configured for watch mode.
 */
export function WatchPlugin(
  configDeps: Set<string>,
  { config, chunks }: TsdownBundle,
): Plugin {
  return {
    name: 'tsdown:watch',
    options: config.ignoreWatch.length
      ? (inputOptions) => {
          inputOptions.watch ||= {}
          inputOptions.watch.exclude = toArray(inputOptions.watch.exclude)
          inputOptions.watch.exclude.push(...config.ignoreWatch)
        }
      : undefined,
    async buildStart() {
      config.tsconfig && this.addWatchFile(config.tsconfig)
      for (const file of configDeps) {
        this.addWatchFile(file)
      }
      if (typeof config.watch !== 'boolean') {
        for (const file of resolveComma(toArray(config.watch))) {
          this.addWatchFile(file)
        }
      }
      if (config.pkg) {
        this.addWatchFile(config.pkg.packageJsonPath)
      }

      // Watch copy source files
      if (config.copy) {
        const resolvedEntries = await resolveCopyEntries(config)

        for (const entry of resolvedEntries) {
          this.addWatchFile(entry.from)
        }
      }
    },
    generateBundle: {
      order: 'post',
      handler(outputOptions, bundle) {
        chunks.push(...addOutDirToChunks(Object.values(bundle), config.outDir))
      },
    },
  }
}
