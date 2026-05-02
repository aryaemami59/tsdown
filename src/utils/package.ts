import { readFile } from 'node:fs/promises'
import { up as findPackage } from 'empathic/package'
import { createDebug } from 'obug'
import type { Format, NormalizedFormat } from '../config/index.ts'
import type { PackageJson } from 'pkg-types'

/**
 * @see {@link https://json.schemastore.org/package.json}
 */
type PackageJsonTypes = PackageJson

const debug = createDebug('tsdown:package')

/**
 * A `package.json` object augmented with the absolute path to the file
 * it was read from.
 */
export interface PackageJsonWithPath extends PackageJsonTypes {
  /**
   * Absolute path to the `package.json` file on disk.
   */
  packageJsonPath: string
}

/**
 * Walk up the directory tree from {@linkcode dir} and parse the nearest
 * `package.json`, augmenting the result with the file's absolute path.
 *
 * @param dir - Directory to start the upward search from.
 * @returns The parsed `package.json` with {@linkcode PackageJsonWithPath.packageJsonPath | packageJsonPath}, or `undefined` when no `package.json` is found.
 */
export async function readPackageJson(
  dir: string,
): Promise<PackageJsonWithPath | undefined> {
  const packageJsonPath = findPackage({ cwd: dir })
  if (!packageJsonPath) return
  debug('Reading package.json:', packageJsonPath)
  const contents = await readFile(packageJsonPath, 'utf8')
  return {
    ...JSON.parse(contents),
    packageJsonPath,
  }
}

export type PackageType = NonNullable<PackageJsonTypes['type']> | undefined

/**
 * Extract and validate the `"type"` field from a `package.json` object.
 *
 * @param pkg - Parsed `package.json` object (may be `undefined`).
 * @returns `'module'`, `'commonjs'`, or `undefined` when the field is absent.
 * @throws An {@linkcode Error} When the `"type"` field is present but not a recognized value.
 */
export function getPackageType(pkg: PackageJsonTypes | undefined): PackageType {
  if (pkg?.type) {
    if (!['module', 'commonjs'].includes(pkg.type)) {
      throw new Error(`Invalid package.json type: ${pkg.type}`)
    }
    return pkg.type
  }
}

/**
 * Normalize a format alias to its canonical form.
 * `'esm'` and `'module'` both normalize to `'es'`. `'commonjs'` normalizes to
 * `'cjs'`. All other values pass through unchanged.
 *
 * @param format - The format string to normalize.
 * @returns The canonical {@linkcode NormalizedFormat}.
 */
export function normalizeFormat(format: Format): NormalizedFormat {
  switch (format) {
    case 'es':
    case 'esm':
    case 'module':
      return 'es'
    case 'cjs':
    case 'commonjs':
      return 'cjs'
    default:
      return format
  }
}
