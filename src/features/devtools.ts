import { importWithError } from '../utils/general.ts'
import type { StartOptions } from '@vitejs/devtools/cli-commands'
import type { InputOptions } from 'rolldown'

export interface DevtoolsOptions extends NonNullable<InputOptions['devtools']> {
  /**
   * Enable devtools integration.
   * {@link https://github.com/vitejs/devtools | `@vitejs/devtools`} must be
   * installed as a dependency.
   *
   * Defaults to `true`, if
   * {@link https://github.com/vitejs/devtools | `@vitejs/devtools`} is
   * installed.
   *
   * @experimental
   */
  ui?: boolean | Partial<StartOptions>

  /**
   * Clean devtools stale sessions.
   *
   * @default true
   */
  clean?: boolean
}

/**
 * Start the
 * {@linkcode https://github.com/vitejs/devtools | `@vitejs/devtools`} UI
 * server using the provided options.
 *
 * @param config - Devtools options controlling the UI host, open-browser behaviour, and other start parameters.
 */
export async function startDevtoolsUI(config: DevtoolsOptions): Promise<void> {
  const { start } = await importWithError<
    typeof import('@vitejs/devtools/cli-commands')
  >('@vitejs/devtools/cli-commands')
  await start({
    host: '127.0.0.1',
    open: true,
    ...(typeof config.ui === 'object' ? config.ui : {}),
  })
}
