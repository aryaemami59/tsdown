import path from 'node:path'
import { blue, type Ansis } from 'ansis'
import { up as findUp } from 'empathic/find'
import { fsStat } from '../utils/fs.ts'
import type { UserConfig } from '../config/index.ts'
import type { Logger } from '../utils/logger.ts'

function findTsconfig(
  cwd?: string,
  name: string = 'tsconfig.json',
): string | false {
  return findUp(name, { cwd }) || false
}

/**
 * Resolve the `tsconfig` option to an absolute file path by searching upward
 * from `cwd`, or return `false` when TypeScript config should be disabled.
 *
 * @param logger - Logger used to report the resolved path or warn when not found.
 * @param tsconfig - Raw tsconfig option from the user config.
 * @param cwd - Working directory for the upward search.
 * @param color - Ansis color function used to highlight the path in logs.
 * @param nameLabel - Optional build name label prepended to log lines.
 * @returns The absolute path to the resolved `tsconfig.json`, or `false` when `tsconfig: false` is set or no file can be found.
 */
export async function resolveTsconfig(
  logger: Logger,
  tsconfig: UserConfig['tsconfig'],
  cwd: string,
  color: Ansis,
  nameLabel?: string,
): Promise<string | false> {
  const original = tsconfig

  if (tsconfig !== false) {
    if (tsconfig === true || tsconfig == null) {
      tsconfig = findTsconfig(cwd)
      if (original && !tsconfig) {
        logger.warn(`No tsconfig found in ${blue(cwd)}`)
      }
    } else {
      const tsconfigPath = path.resolve(cwd, tsconfig)
      const stat = await fsStat(tsconfigPath)
      if (stat?.isFile()) {
        tsconfig = tsconfigPath
      } else if (stat?.isDirectory()) {
        tsconfig = findTsconfig(tsconfigPath)
        if (!tsconfig) {
          logger.warn(`No tsconfig found in ${blue(tsconfigPath)}`)
        }
      } else {
        tsconfig = findTsconfig(cwd, tsconfig)
        if (!tsconfig) {
          logger.warn(`tsconfig ${blue(original)} doesn't exist`)
        }
      }
    }

    if (tsconfig) {
      logger.info(nameLabel, `tsconfig: ${color(path.relative(cwd, tsconfig))}`)
    }
  }

  return tsconfig
}
