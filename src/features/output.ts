import { RE_CSS, RE_DTS, RE_JS } from 'rolldown-plugin-dts/internal'
import { getPackageType, type PackageType } from '../utils/package.ts'
import type {
  Format,
  NormalizedFormat,
  ResolvedConfig,
} from '../config/index.ts'
import type {
  AddonFunction,
  InputOptions,
  PreRenderedChunk,
  RenderedChunk,
} from 'rolldown'

/**
 * Context object passed to {@linkcode OutExtensionFactory} when resolving
 * custom output file extensions.
 */
export interface OutExtensionContext {
  options: InputOptions

  format: NormalizedFormat

  /**
   * `"type"` field in project's `package.json`.
   */
  pkgType?: PackageType
}

/**
 * Custom file extensions for output files.
 * - `js`: Extension for JavaScript output files (e.g. `'.mjs'`).
 * - `dts`: Extension for TypeScript declaration files (e.g. `'.d.mts'`).
 */
export interface OutExtensionObject {
  js?: string

  dts?: string
}

/**
 * A factory function that returns custom output file extensions based on the
 * current build context. Overrides {@linkcode UserConfig.fixedExtension}.
 *
 * @example
 * <caption>Return format-based output file extensions</caption>
 *
 * ```ts
 * outExtensions({ format }) {
 *   return { js: format === 'esm' ? '.mjs' : '.cjs' };
 * }
 * ```
 */
export type OutExtensionFactory = (
  context: OutExtensionContext,
) => OutExtensionObject | undefined

function resolveJsOutputExtension(
  packageType: PackageType,
  format: NormalizedFormat,
  fixedExtension?: boolean,
): 'cjs' | 'js' | 'mjs' {
  switch (format) {
    case 'es':
      return !fixedExtension && packageType === 'module' ? 'js' : 'mjs'
    case 'cjs':
      return fixedExtension || packageType === 'module' ? 'cjs' : 'js'
    default:
      return 'js'
  }
}

/**
 * Compute the entry-chunk and non-entry-chunk filename templates for a given
 * output format, taking `outExtensions`, `fixedExtension`, and `hash` into
 * account.
 *
 * @returns A tuple of `[entryFilename, chunkFilename]` templates (either a static string or a function of the pre-rendered chunk).
 */
export function resolveChunkFilename(
  { outExtensions, fixedExtension, pkg, hash }: ResolvedConfig,
  inputOptions: InputOptions,
  format: NormalizedFormat,
): [entry: ChunkFileName, chunk: ChunkFileName] {
  const packageType = getPackageType(pkg)

  let jsExtension: string | undefined
  let dtsExtension: string | undefined

  if (outExtensions) {
    const { js, dts } =
      outExtensions({
        options: inputOptions,
        format,
        pkgType: packageType,
      }) || {}
    jsExtension = js
    dtsExtension = dts
  }

  jsExtension ??= `.${resolveJsOutputExtension(packageType, format, fixedExtension)}`

  const suffix = format === 'iife' || format === 'umd' ? `.${format}` : ''
  return [
    createChunkFilename(`[name]${suffix}`, jsExtension, dtsExtension),
    createChunkFilename(
      `[name]${suffix}${hash ? '-[hash]' : ''}`,
      jsExtension,
      dtsExtension,
    ),
  ]
}

type ChunkFileName = string | ((chunk: PreRenderedChunk) => string)
function createChunkFilename(
  basename: string,
  jsExtension: string,
  dtsExtension?: string,
): ChunkFileName {
  if (dtsExtension === undefined) return `${basename}${jsExtension}`
  return (chunk: PreRenderedChunk) => {
    return `${basename}${chunk.name.endsWith('.d') ? dtsExtension : jsExtension}`
  }
}

/**
 * Per-file-type code snippets for {@linkcode ChunkAddon}.
 * - `js`: Appended/prepended to JavaScript output files.
 * - `css`: Appended/prepended to CSS output files.
 * - `dts`: Appended/prepended to TypeScript declaration files.
 */
export interface ChunkAddonObject {
  js?: string

  css?: string

  dts?: string
}

/**
 * A function that returns a {@linkcode ChunkAddonObject} or a raw string for
 * a given output chunk. Receives the output `format` and `fileName`.
 */
export type ChunkAddonFunction = (ctx: {
  format: Format
  fileName: string
}) => ChunkAddonObject | string | undefined

/**
 * Code to inject at the top (`banner`) or bottom (`footer`) of every output
 * chunk. Can be a plain string, a per-file-type object, or a function.
 */
export type ChunkAddon = ChunkAddonObject | ChunkAddonFunction | string

/**
 * Convert a {@linkcode ChunkAddon} value (string, object, or function) into
 * a Rolldown `AddonFunction` suitable for `banner` / `footer`.
 *
 * @param chunkAddon - The raw addon value from the user config.
 * @param format - The normalized output format; passed to function-form addons.
 * @returns A Rolldown addon function, or `undefined` when `chunkAddon` is falsy.
 */
export function resolveChunkAddon(
  chunkAddon: ChunkAddon | undefined,
  format: NormalizedFormat,
): AddonFunction | undefined {
  if (!chunkAddon) return

  return (chunk: RenderedChunk) => {
    if (typeof chunkAddon === 'function') {
      chunkAddon = chunkAddon({
        format,
        fileName: chunk.fileName,
      })
    }

    if (typeof chunkAddon === 'string') {
      return chunkAddon
    }

    switch (true) {
      case RE_JS.test(chunk.fileName):
        return chunkAddon?.js || ''
      case RE_CSS.test(chunk.fileName):
        return chunkAddon?.css || ''
      case RE_DTS.test(chunk.fileName):
        return chunkAddon?.dts || ''
      default:
        return ''
    }
  }
}
