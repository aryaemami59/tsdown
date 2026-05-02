import path from 'node:path'
import { createDebug } from 'obug'
import { glob } from 'tinyglobby'
import { fsRemove } from '../utils/fs.ts'
import { slash } from '../utils/general.ts'
import { globalLogger } from '../utils/logger.ts'
import type { ResolvedConfig, UserConfig } from '../config/index.ts'
import type { OutputAsset, OutputChunk } from 'rolldown'

const debug = createDebug('tsdown:clean')

const RE_LAST_SLASH = /[/\\]$/

/**
 * Delete all files and directories matched by the `clean` globs in every
 * resolved config, skipping files that equal the output directory itself.
 *
 * @param configs - All resolved configs for the current build; each contributes its own `clean` patterns and `outDir`.
 */
export async function cleanOutDir(configs: ResolvedConfig[]): Promise<void> {
  const removes = new Set<string>()

  for (const config of configs) {
    if (config.devtools && (config.devtools.clean ?? true)) {
      config.clean.push('node_modules/.rolldown')
    }

    if (config.exe) {
      const exeOutDir = path.resolve(config.cwd, config.exe.outDir || 'build')
      config.clean.push(exeOutDir)
    }

    if (!config.clean.length) continue
    const files = await glob(config.clean, {
      cwd: config.cwd,
      absolute: true,
      onlyFiles: false,
      dot: true,
    })

    const normalizedOutDir = config.outDir.replace(RE_LAST_SLASH, '')
    for (const file of files) {
      const normalizedFile = file.replace(RE_LAST_SLASH, '')
      if (normalizedFile !== normalizedOutDir) {
        removes.add(file)
      }
    }
  }
  if (!removes.size) return

  globalLogger.info(`Cleaning ${removes.size} files`)
  await Promise.all(
    [...removes].map(async (file) => {
      debug('Removing', file)
      await fsRemove(file)
    }),
  )
  debug('Removed %d files', removes.size)
}

/**
 * Normalize the `clean` option into a list of absolute glob patterns.
 *
 * @param clean - Raw `clean` value from the user config.
 * @param outDir - Resolved output directory path (used when `clean` is `true`).
 * @param cwd - Working directory; cleaning `cwd` itself is rejected with an error.
 * @returns Array of resolved glob patterns to delete before the build.
 * @throws An {@linkcode Error} When any pattern in `clean` resolves to the `cwd` itself.
 */
export function resolveClean(
  clean: UserConfig['clean'],
  outDir: string,
  cwd: string,
): string[] {
  if (clean === true) {
    clean = [slash(outDir)]
  } else if (!clean) {
    clean = []
  }

  if (clean.some((item) => path.resolve(item) === cwd)) {
    throw new Error(
      'Cannot clean the current working directory. Please specify a different path to clean option.',
    )
  }

  return clean
}

/**
 * Delete the output files corresponding to a set of Rolldown chunks — used
 * in watch mode to remove stale outputs before each rebuild.
 *
 * @param outDir - Base output directory; chunk `fileName`s are resolved relative to this path.
 * @param chunks - Rolldown output chunks whose files should be removed.
 */
export async function cleanChunks(
  outDir: string,
  chunks: Array<OutputAsset | OutputChunk>,
): Promise<void> {
  await Promise.all(
    chunks.map(async (chunk) => {
      const filePath = path.resolve(outDir, chunk.fileName)
      debug('Removing chunk file', filePath)
      await fsRemove(filePath)
    }),
  )
}
