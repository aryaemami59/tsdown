import { chmod } from 'node:fs/promises'
import path from 'node:path'
import { underline } from 'ansis'
import { fsExists } from '../utils/fs.ts'
import { prettyFormat, type Logger } from '../utils/logger.ts'
import type { Plugin } from 'rolldown'

const RE_SHEBANG = /^#!.*/

/**
 * Rolldown plugin that detects shebang lines (`#!/usr/bin/env node`) in entry
 * chunks and grants execute permission (`chmod 755`) to the output file.
 *
 * @param logger - Logger instance used to report the chmod operation.
 * @param cwd - Working directory; used to compute relative paths in log messages.
 * @param nameLabel - Optional build name label prepended to log lines.
 * @param isDualFormat - Whether the build produces multiple output formats; when `true`, the format name is included in log messages.
 * @returns A Rolldown plugin that `chmod 755`s shebang entry files after writing.
 */
export function ShebangPlugin(
  logger: Logger,
  cwd: string,
  nameLabel?: string,
  isDualFormat?: boolean,
): Plugin {
  return {
    name: 'tsdown:shebang',
    async writeBundle(options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry) continue
        if (!RE_SHEBANG.test(chunk.code)) continue

        const filepath = path.resolve(
          cwd,
          options.file || path.join(options.dir!, chunk.fileName),
        )
        if (await fsExists(filepath)) {
          logger.info(
            nameLabel,
            isDualFormat && prettyFormat(options.format),
            `Granting execute permission to ${underline(path.relative(cwd, filepath))}`,
          )
          await chmod(filepath, 0o755)
        }
      }
    },
  }
}
