import { access, cp, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Stats } from 'node:fs'

/**
 * Check whether a file or directory exists at {@linkcode path}.
 *
 * @param path - Filesystem path to test.
 * @returns `true` if the path is accessible, `false` otherwise.
 */
export function fsExists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  )
}

/**
 * Retrieve {@linkcode Stats} for a path, returning `null` instead of
 * throwing when the path does not exist.
 *
 * @param path - Filesystem path to stat.
 * @returns A {@linkcode Stats} object, or `null` if the {@linkcode path} does not exist.
 */
export function fsStat(path: string): Promise<Stats | null> {
  return stat(path).catch(() => null)
}

/**
 * Remove a file or directory recursively. Silently succeeds when the
 * {@linkcode path} does not exist.
 *
 * @param path - Filesystem path to remove.
 */
export function fsRemove(path: string): Promise<void> {
  return rm(path, { force: true, recursive: true }).catch(() => {})
}

/**
 * Copy a file or directory recursively, overwriting the destination if
 * it already exists.
 *
 * @param from - Source path.
 * @param to - Destination path.
 */
export function fsCopy(from: string, to: string): Promise<void> {
  return cp(from, to, { recursive: true, force: true })
}

/**
 * Find the lowest common ancestor directory of one or more
 * {@linkcode filepaths}.
 *
 * @param filepaths - File paths to compare.
 * @returns The longest directory path that is a prefix of all given paths. Returns `''` when called with no arguments, or the parent directory when called with a single path.
 */
export function lowestCommonAncestor(...filepaths: string[]): string {
  if (filepaths.length === 0) return ''
  if (filepaths.length === 1) return path.dirname(filepaths[0])
  filepaths = filepaths.map(path.normalize)
  const [first, ...rest] = filepaths
  let ancestor = first.split(path.sep)
  for (const filepath of rest) {
    const directories = filepath.split(path.sep, ancestor.length)
    let index = 0
    for (const directory of directories) {
      if (directory === ancestor[index]) {
        index += 1
      } else {
        ancestor = ancestor.slice(0, index)
        break
      }
    }
    ancestor = ancestor.slice(0, index)
  }

  return ancestor.length <= 1 && ancestor[0] === ''
    ? path.sep + ancestor[0]
    : ancestor.join(path.sep)
}

/**
 * Strip the file extension from a path, returning the path unchanged
 * when it has no extension.
 *
 * @param filePath - The file path to process.
 * @returns The path without its extension.
 */
export function stripExtname(filePath: string): string {
  const ext = path.extname(filePath)
  if (!ext.length) return filePath
  return filePath.slice(0, -ext.length)
}
