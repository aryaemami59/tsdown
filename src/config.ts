import type {
  UserConfig,
  UserConfigExport,
  UserConfigFn,
} from './config/index.ts'

/**
 * Type-safe helper for defining a tsdown configuration. It returns the value
 * unchanged. Its only purpose is to give TypeScript the context it needs to
 * infer and validate the options object. Accepts:
 * - `UserConfig`: A single {@linkcode UserConfig | config object} (for a single output),
 * - `UserConfig[]`: An array of {@linkcode UserConfig | config objects} (for multiple outputs),
 * - `UserConfigFn`: A {@linkcode UserConfigFn | config function}.
 *
 * @example
 * <caption>Config file for a single output</caption>
 *
 * ```ts
 * import { defineConfig } from 'tsdown';
 *
 * export default defineConfig({
 *   entry: 'src/index.ts',
 *   format: ['esm', 'cjs'],
 * });
 * ```
 *
 * @example
 * <caption>Config file for multiple outputs</caption>
 *
 * ```ts
 * import { defineConfig } from 'tsdown';
 *
 * export default defineConfig([
 *   {
 *     entry: 'src/index.ts',
 *     platform: 'node',
 *   },
 *   {
 *     entry: 'src/another-entry.ts',
 *     platform: 'browser',
 *   },
 * ]);
 * ```
 *
 * @example
 * <caption>Config file using a function</caption>
 *
 * ```ts
 * import { defineConfig } from 'tsdown';
 *
 * export default defineConfig((inlineConfig, { ci }) => {
 *   if (inlineConfig.watch) {
 *     return {
 *       // watch-specific config
 *     };
 *   }
 *
 *   return {
 *     ...inlineConfig,
 *     entry: {
 *       index: 'src/index.ts',
 *     },
 *     minify: ci,
 *     sourcemap: !ci,
 *   };
 * });
 * ```
 *
 * @param options - The configuration to validate and return unchanged.
 * @returns The same value passed in, typed as the most specific overload.
 *
 * @see {@link https://tsdown.dev/options/config-file | Config File documentation} for more details.
 */
export function defineConfig(options: UserConfig): UserConfig
export function defineConfig(options: UserConfig[]): UserConfig[]
export function defineConfig(options: UserConfigFn): UserConfigFn
export function defineConfig(options: UserConfigExport): UserConfigExport
export function defineConfig(options: UserConfigExport): UserConfigExport {
  return options
}

export { mergeConfig } from './config/options.ts'
export type { UserConfig, UserConfigExport, UserConfigFn }
