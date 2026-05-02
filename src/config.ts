import type {
  UserConfig,
  UserConfigExport,
  UserConfigFn,
} from './config/index.ts'
/**
 * Type-safe helper for defining a tsdown configuration. It returns the value
 * unchanged. Its only purpose is to give TypeScript the context it needs to
 * infer and validate the options object.
 *
 * Accepts a single config object, an array of config objects (for multiple
 * outputs), or a {@linkcode UserConfigFn} function.
 *
 * @example
 * <caption>Config file example</caption>
 *
 * ```ts
 * import { defineConfig } from 'tsdown'
 *
 * export default defineConfig({
 *   entry: 'src/index.ts',
 *   format: ['esm', 'cjs'],
 * })
 * ```
 *
 * @see {@link https://tsdown.dev/options/config-file | Config File documentation}
 * @param options - The configuration to validate and return unchanged.
 * @returns The same value passed in, typed as the most specific overload.
 */
export function defineConfig(options: UserConfig): UserConfig
export function defineConfig(options: UserConfig[]): UserConfig[]
export function defineConfig(options: UserConfigFn): UserConfigFn
export function defineConfig(options: UserConfigExport): UserConfigExport
export function defineConfig(options: UserConfigExport): UserConfigExport {
  return options
}

export type { UserConfig, UserConfigExport, UserConfigFn }
export { mergeConfig } from './config/options.ts'
