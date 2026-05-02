import path from 'node:path'
import process from 'node:process'
import { createDebug } from 'obug'
import { glob } from 'tinyglobby'
import { slash } from '../utils/general.ts'
import { loadConfigFile } from './file.ts'
import { mergeConfig } from './options.ts'
import type { InlineConfig, UserConfig } from './types.ts'

const debug = createDebug('tsdown:config:workspace')

const DEFAULT_EXCLUDE_WORKSPACE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/test?(s)/**',
  '**/t?(e)mp/**',
]

/**
 * Expand a root {@linkcode UserConfig} that has the `workspace` option set
 * into an array of per-package configs.
 *
 * When `workspace` is `true` or `{ include: 'auto' }`, every
 * `package.json` found beneath the root (excluding
 * `node_modules`, `dist`, `test(s)`, and `t(e)mp` directories) is treated as
 * a workspace package. Each package loads its own config file (inheriting the
 * root config as defaults) and contributes one or more entries to the
 * returned array.
 *
 * @param config - Root user config (may or may not have `workspace` set).
 * @param inlineConfig - Inline overrides (CLI flags) merged into every package config.
 * @param rootDeps - File dependencies collected while loading the root config; workspace package deps are merged into this set.
 * @returns Per-package user configs and the cumulative set of watched files.
 * @throws An {@linkcode Error} When no workspace packages are found after glob expansion.
 */
export async function resolveWorkspace(
  config: UserConfig,
  inlineConfig: InlineConfig,
  rootDeps?: Set<string>,
): Promise<{ configs: UserConfig[]; deps: Set<string> }> {
  const normalized = mergeConfig(config, inlineConfig)
  const rootCwd = normalized.cwd || process.cwd()
  const deps = new Set<string>(rootDeps)

  let { workspace } = normalized
  if (!workspace) {
    return {
      configs: [normalized],
      deps,
    }
  }

  if (workspace === true) {
    workspace = {}
  } else if (typeof workspace === 'string' || Array.isArray(workspace)) {
    workspace = { include: workspace }
  }

  let {
    include: packages = 'auto',
    exclude = DEFAULT_EXCLUDE_WORKSPACE,
    config: workspaceConfig,
  } = workspace
  if (packages === 'auto') {
    packages = (
      await glob('**/package.json', {
        ignore: exclude,
        cwd: rootCwd,
        expandDirectories: false,
      })
    )
      .filter((file) => file !== 'package.json') // exclude root package.json
      .map((file) => slash(path.resolve(rootCwd, file, '..')))
  } else {
    packages = (
      await glob(packages, {
        ignore: exclude,
        cwd: rootCwd,
        onlyDirectories: true,
        absolute: true,
        expandDirectories: false,
      })
    ).map((file) => slash(path.resolve(file)))
  }

  if (packages.length === 0) {
    throw new Error('No workspace packages found, please check your config')
  }

  const configs = (
    await Promise.all(
      packages.map(async (cwd) => {
        debug('loading workspace config %s', cwd)
        const { configs, deps: workspaceDeps } = await loadConfigFile(
          {
            ...inlineConfig,
            config: workspaceConfig,
            cwd,
          },
          cwd,
          normalized,
        )
        workspaceDeps?.forEach((dep) => deps.add(dep))
        return configs.map((config) => mergeConfig(normalized, config))
      }),
    )
  ).flat()

  return { configs, deps }
}
