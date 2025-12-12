import { createDebug, enable, namespaces } from 'obug'
import { resolveComma, toArray } from '../utils/general.ts'
import type { InlineConfig } from '../config/types.ts'
import type { StartOptions } from '@vitejs/devtools/cli-commands'
import type { InputOptions } from 'rolldown'

const debug = createDebug('tsdown:debug')

export interface DebugOptions extends NonNullable<InputOptions['debug']> {
  /**
   * **[experimental]** Enable devtools integration. `@vitejs/devtools` must be installed as a dependency.
   *
   * Defaults to true, if `@vitejs/devtools` is installed.
   */
  devtools?: boolean | Partial<StartOptions>

  /**
   * Clean devtools stale sessions.
   *
   * @default true
   */
  clean?: boolean
}

export function enableDebugLog(cliOptions: InlineConfig): void {
  const { debugLogs = false } = cliOptions
  if (!debugLogs) return

  const namespace =
    debugLogs === true
      ? ('tsdown:*' as const)
      : // support debugging multiple flags with comma-separated list
        resolveComma(toArray(debugLogs))
          .map((v) => `tsdown:${v}` as const)
          .join(',')

  const ns = namespaces()

  const namespacesToBeEnabled = ns ? `${namespace},${ns}` : namespace

  enable(namespacesToBeEnabled)

  debug.extend(namespacesToBeEnabled)(
    'Debugging enabled',
    namespacesToBeEnabled,
  )

  debug('Debugging enabled', namespacesToBeEnabled)
}
