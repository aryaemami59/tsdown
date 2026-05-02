import type { CopyEntry, CopyOptions, CopyOptionsFn } from '../features/copy.ts'
import type {
  DepsConfig,
  NoExternalFn,
  ResolvedDepsConfig,
} from '../features/deps.ts'
import type { DevtoolsOptions } from '../features/devtools.ts'
import type { ExeOptions, SeaConfig } from '../features/exe.ts'
import type {
  BuildContext,
  RolldownContext,
  TsdownHooks,
} from '../features/hooks.ts'
import type {
  ChunkAddon,
  ChunkAddonFunction,
  ChunkAddonObject,
  OutExtensionContext,
  OutExtensionFactory,
  OutExtensionObject,
} from '../features/output.ts'
import type { AttwOptions } from '../features/pkg/attw.ts'
import type { ExportsOptions } from '../features/pkg/exports.ts'
import type { PublintOptions } from '../features/pkg/publint.ts'
import type { TsdownPlugin, TsdownPluginOption } from '../features/plugin.ts'
import type { ReportOptions } from '../features/report.ts'
import type { RolldownChunk, TsdownBundle } from '../utils/chunks.ts'
import type { Logger, LogLevel } from '../utils/logger.ts'
import type { PackageJsonWithPath, PackageType } from '../utils/package.ts'
import type {
  Arrayable,
  Awaitable,
  MarkPartial,
  Overwrite,
} from '../utils/types.ts'
import type { CssOptions } from '@tsdown/css'
import type { Hookable } from 'hookable'
import type {
  BuildOptions,
  ChecksOptions,
  InputOptions,
  InternalModuleFormat,
  ModuleFormat,
  OutputOptions,
  TransformOptions,
  TreeshakingOptions,
} from 'rolldown'
import type { Options as RolldownPluginDtsOptions } from 'rolldown-plugin-dts'
import type { Options as UnusedOptions } from 'unplugin-unused'

export interface DtsOptions extends RolldownPluginDtsOptions {
  /**
   * When building dual ESM+CJS formats, generate a `.d.cts` re-export stub
   * instead of running a full second TypeScript compilation pass.
   *
   * The stub re-exports everything from the corresponding `.d.mts` file,
   * ensuring CJS and ESM consumers share the same type declarations. This
   * eliminates the TypeScript "dual module hazard" where separate `.d.cts`
   * and `.d.mts` declarations cause `TS2352` ("neither type sufficiently
   * overlaps") errors when casting between types derived from the same class.
   *
   * Only applies when building both `esm` and `cjs` formats simultaneously.
   *
   * @default false
   */
  cjsReexport?: boolean
}

export type Sourcemap = boolean | 'inline' | 'hidden'
export type Format = ModuleFormat
export type NormalizedFormat = InternalModuleFormat

/**
 * Extended input option that supports glob negation patterns.
 *
 * When using object form, values can be:
 * - A single glob pattern string
 * - An array of glob patterns, including negation patterns (prefixed with `!`)
 *
 * @example
 * <caption>Single pattern</caption>
 *
 * ```ts
 * entry: {
 *   "utils/*": "./src/utils/*.ts",
 * }
 * ```
 *
 * @example
 * <caption>Array with negation pattern to exclude files</caption>
 *
 * ```ts
 * entry: {
 *   "hooks/*": ["./src/hooks/*.ts", "!./src/hooks/index.ts"],
 * }
 * ```
 */
export type TsdownInputOption = Arrayable<
  string | Record<string, Arrayable<string>>
>

export type {
  AttwOptions,
  BuildContext,
  ChunkAddon,
  ChunkAddonFunction,
  ChunkAddonObject,
  CopyEntry,
  CopyOptions,
  CopyOptionsFn,
  DepsConfig,
  DevtoolsOptions,
  ExeOptions,
  ExportsOptions,
  NoExternalFn,
  OutExtensionContext,
  OutExtensionFactory,
  OutExtensionObject,
  PackageJsonWithPath,
  PackageType,
  PublintOptions,
  ReportOptions,
  ResolvedDepsConfig,
  RolldownChunk,
  RolldownContext,
  SeaConfig,
  TreeshakingOptions,
  TsdownBundle,
  TsdownHooks,
  TsdownPlugin,
  TsdownPluginOption,
  UnusedOptions,
}

export interface Workspace {
  /**
   * Workspace directories. Glob patterns are supported.
   * - `'auto'`: Automatically detect `package.json` files in the workspace.
   *
   * @default 'auto'
   */
  include?: 'auto' | (string & {}) | string[]

  /**
   * Exclude directories from workspace. Defaults to all `node_modules`,
   * `dist`, `test`, `tests`, `temp`, and `tmp` directories.
   *
   * @default ['**\/node_modules/**', '**\/dist/**', '**\/test?(s)/**', '**\/t?(e)mp/**']
   */
  exclude?: Arrayable<string>

  /**
   * Path to the workspace configuration file.
   * - `true`: Auto-detect the config file.
   * - `false`: Disable config file loading for the workspace.
   * - `string`: Explicit path to the config file.
   */
  config?: boolean | string
}

/**
 * A CI-conditional flag. Detected via the
 * {@linkcode https://www.npmjs.com/package/is-in-ci | is-in-ci} package,
 * which covers all major CI providers (GitHub Actions, GitLab CI, etc.).
 *
 * - `'ci-only'`: Enable the feature only when running in CI.
 * - `'local-only'`: Enable the feature only when running locally.
 *
 * @see {@link https://tsdown.dev/advanced/ci | CI environment documentation}
 */
export type CIOption = 'ci-only' | 'local-only'

/**
 * A toggleable option that can be a plain `boolean`, a
 * {@linkcode CIOption} string, or a configuration object for the feature
 * that also accepts an `enabled` field.
 *
 * | Value          | Behavior                              |
 * | -------------- | -------------------------------------- |
 * | `true`         | Always enabled                         |
 * | `false`        | Always disabled                        |
 * | `'ci-only'`    | Enabled in CI, disabled locally        |
 * | `'local-only'` | Enabled locally, disabled in CI        |
 * | `{ enabled?, ...options }` | Object form with per-feature config |
 *
 * @see {@link https://tsdown.dev/advanced/ci | CI environment documentation}
 */
export type WithEnabled<T> =
  | boolean
  | CIOption
  | (T & {
      /**
       * @default true
       */
      enabled?: boolean | CIOption
    })

/**
 * Options for tsdown.
 */
export interface UserConfig {
  // #region Input Options
  /**
   * Specifies the entry files for your project. These files serve as the
   * starting points for the bundling process. You can define entry files
   * either via the CLI or in the configuration file. Defaults to
   * `'src/index.ts'` if it exists.
   *
   * @default { index: 'src/index.ts' }
   *
   * @example
   * <caption>Specify a single entry file as a string.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: 'src/index.ts',
   * })
   * ```
   *
   * @example
   * <caption>Define multiple entry files as an array of strings.</caption>
   *
   *```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: ['src/entry1.ts', 'src/entry2.ts'],
   * })
   * ```
   *
   * @example
   * <caption>Use an object to define entry files with aliases. The keys represent alias names, and the values represent file paths.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: {
   *     main: 'src/index.ts',
   *     utils: 'src/utils.ts',
   *   },
   * })
   * ```
   *
   * @example
   * <caption>Supports [glob patterns](https://code.visualstudio.com/docs/editor/glob-patterns), enabling you to match multiple files dynamically.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: 'src/*\*\/*.ts',
   * })
   * ```
   *
   * @example
   * <caption>Supports glob patterns in arrays, with negation patterns to exclude specific files.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: ['src/*.ts', '!src/*.test.ts'],
   * })
   * ```
   *
   * @example
   * <caption>When using the object form, you can use glob wildcards (`*`) in both keys and values. The `*` in the key acts as a placeholder that gets replaced with the matched file name (without extension).</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: {
   *     // Maps src/foo.ts → dist/lib/foo.js, src/bar.ts → dist/lib/bar.js
   *     'lib/*': 'src/*.ts',
   *   },
   * })
   * ```
   *
   * @example
   * <caption>When using glob keys, values can be an array of patterns including negation patterns (prefixed with `!`) to exclude specific files.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: {
   *     // Include all hooks except the index file
   *     'hooks/*': ['src/hooks/*.ts', '!src/hooks/index.ts'],
   *   },
   * })
   * ```
   *
   * @example
   * <caption>You can combine multiple positive patterns and multiple negation patterns.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: {
   *     'utils/*': [
   *       'src/utils/*.ts',
   *       'src/utils/*.tsx',
   *       '!src/utils/index.ts',
   *       '!src/utils/internal.ts',
   *     ],
   *   },
   * })
   * ```
   *
   * @example
   * <caption>You can mix strings, glob patterns, and object entries in an array.</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: [
   *     'src/*',
   *     '!src/foo.ts',
   *     { main: 'index.ts' },
   *     { 'lib/*': ['src/*.ts', '!src/bar.ts'] },
   *   ],
   * })
   * ```
   */
  entry?: TsdownInputOption

  /**
   * Dependency handling options.
   *
   * @default {}
   */
  deps?: DepsConfig

  /**
   * @deprecated Use {@linkcode DepsConfig.neverBundle | deps.neverBundle} instead.
   */
  external?: DepsConfig['neverBundle']

  /**
   * @deprecated Use {@linkcode DepsConfig.alwaysBundle | deps.alwaysBundle} instead.
   */
  noExternal?: DepsConfig['alwaysBundle']

  /**
   * @deprecated Use {@linkcode DepsConfig.onlyBundle | deps.onlyBundle} instead.
   */
  inlineOnly?: DepsConfig['onlyBundle']

  /**
   * @default false
   * @deprecated Use {@linkcode DepsConfig.skipNodeModulesBundle | deps.skipNodeModulesBundle} instead.
   */
  skipNodeModulesBundle?: DepsConfig['skipNodeModulesBundle']

  /**
   * Map import paths to other paths or modules at build time.
   */
  alias?: Record<string, string>

  /**
   * Configures TypeScript configuration file resolution and usage.
   * - `true` (default): Automatically find and use the nearest `tsconfig.json` file.
   * - `false`: Do not use any `tsconfig.json` file.
   * - `string`: Path to a specific `tsconfig.json` file to use. It can be an absolute path or a path relative to the {@linkcode UserConfig.cwd | cwd}.
   *
   * @default true
   */
  tsconfig?: string | boolean

  /**
   * Specifies the target runtime platform for the build.
   *
   * - `'node'`: Targets the {@link https://nodejs.org | Node.js} runtime and compatible environments such as Deno and Bun. This is the default platform, and Node.js built-in modules (e.g., `fs`, `path`) will be resolved automatically. Ideal for toolchains or server-side projects.
   *   For CJS format, this is always set to `'node'` and cannot be changed.
   * - `'neutral'`: A platform-agnostic target with no specific runtime assumptions. Use this if your code is intended to run in multiple environments or you want full control over runtime behavior. This is particularly useful for libraries or shared code that may be used in both Node.js and browser environments.
   * - `'browser'`: Targets web browsers (e.g., Chrome, Firefox). This is suitable for front-end projects. If your code uses Node.js built-in modules, a warning will be displayed, and you may need to use polyfills or shims to ensure compatibility.
   *
   * @default 'node'
   * @see {@link https://tsdown.dev/options/platform | platform option documentation} for more details.
   */
  platform?: 'node' | 'neutral' | 'browser'

  /**
   * Specifies the compilation target environment(s).
   *
   * Determines the JavaScript version or runtime(s) for which the code should be compiled.
   * If not set, defaults to the value of `engines.node` in your project's `package.json`.
   * If no `engines.node` field exists, no syntax transformations are applied.
   *
   * Accepts a single target (e.g., `'es2020'`, `'node18'`,
   * `'baseline-widely-available'`), an array of targets, or `false` to disable
   * all transformations.
   *
   * @example
   * <caption>Target a single environment</caption>
   *
   * ```jsonc
   * { "target": "node18" }
   * ```
   *
   * @example
   * <caption>Target multiple environments</caption>
   *
   * ```jsonc
   * { "target": ["node18", "es2020"] }
   * ```
   *
   * @example
   * <caption>Disable all syntax transformations</caption>
   *
   * ```jsonc
   * { "target": false }
   * ```
   *
   * @see {@link https://tsdown.dev/options/target#supported-targets | target option documentation} for a list of valid targets and more details.
   */
  target?: Arrayable<string> | false

  /**
   * Compile-time env variables, which can be accessed via `import.meta.env` or
   * {@linkcode process.env}.
   *
   * @default {}
   *
   * @example
   * <caption>Compile-time env variable map</caption>
   *
   * ```json
   * {
   *   "DEBUG": true,
   *   "NODE_ENV": "production"
   * }
   * ```
   */
  env?: Record<string, any>

  /**
   * Path to env file providing compile-time env variables.
   *
   * @example
   * <caption>Load variables from a default `.env` file</caption>
   *
   * ```ts
   * '.env'
   * ```
   *
   * @example
   * <caption>Load variables from an environment-specific `.env` file</caption>
   *
   * ```ts
   * '.env.production'
   * ```
   */
  envFile?: string

  /**
   * When loading env variables from {@linkcode UserConfig.envFile | envFile},
   * only include variables with these prefixes.
   *
   * @default 'TSDOWN_'
   */
  envPrefix?: Arrayable<string>

  /**
   * Define global constants that are replaced at build time.
   *
   * @default {}
   */
  define?: TransformOptions['define']

  /**
   * Inject shims for compatibility between module formats. When targeting ESM
   * output, enables shims for
   * {@linkcode https://nodejs.org/api/modules.html#dirname | __dirname} and
   * {@linkcode https://nodejs.org/api/modules.html#filename | __filename}
   * (which are not natively available in ESM). The shims are tree-shaken away
   * if unused. The
   * {@linkcode https://nodejs.org/api/modules.html#requireid | require}
   * function in ESM output with
   * {@linkcode UserConfig.platform | platform: 'node'} is always shimmed
   * automatically, regardless of this option. When targeting CJS output,
   * ESM-specific variables
   * ({@linkcode https://nodejs.org/api/esm.html#importmetaurl | import.meta.url},
   * {@linkcode https://nodejs.org/api/esm.html#importmetadirname | import.meta.dirname},
   * {@linkcode https://nodejs.org/api/esm.html#importmetafilename | import.meta.filename})
   * are always shimmed regardless of this option.
   *
   * @default false
   *
   * @example
   * <caption>enable shims for ESM output</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   shims: true,
   * })
   * ```
   *
   * @see {@link https://tsdown.dev/options/shims | shims option documentation} for more details.
   */
  shims?: boolean

  /**
   * Configure tree shaking options.
   *
   * @default true
   * @see {@link https://rolldown.rs/options/treeshake | treeshake option documentation} for more details.
   */
  treeshake?: InputOptions['treeshake']

  /**
   * Sets how input files are processed.
   * For example, use 'js' to treat files as JavaScript or 'base64' for images.
   * Lets you `import` or `require` files like images or fonts.
   *
   * @example
   * <caption>Treat image files as assets or inline base64</caption>
   *
   * ```json
   * { ".jpg": "asset", ".png": "base64" }
   * ```
   */
  loader?: InputOptions['moduleTypes']

  /**
   * Remove the `node:` prefix from built-in Node.js module imports.
   * When enabled, rewrites import sources like `node:fs` to `fs`.
   *
   * @default false
   * @deprecated Use {@linkcode UserConfig.nodeProtocol | nodeProtocol: 'strip'} instead.
   *
   * @example
   * <caption>`removeNodeProtocol: true` — remove the `node:` prefix</caption>
   *
   * ```ts
   * // Input
   * import 'node:fs'
   *
   * // Output
   * import 'fs'
   * ```
   */
  removeNodeProtocol?: boolean

  /**
   * Control whether built-in Node.js module imports use the `node:` protocol.
   *
   * - `true`: Add the `node:` prefix to built-in module imports.
   * - `'strip'`: Remove the `node:` prefix from built-in module imports.
   * - `false`: Do not transform built-in module imports.
   *
   * @default false
   *
   * @example
   * <caption>`nodeProtocol: true` — add the `node:` prefix</caption>
   *
   * ```ts
   * // Input
   * import 'fs'
   *
   * // Output
   * import 'node:fs'
   * ```
   *
   * @example
   * <caption>`nodeProtocol: 'strip'` — remove the `node:` prefix</caption>
   *
   * ```ts
   * // Input
   * import 'node:fs'
   *
   * // Output
   * import 'fs'
   * ```
   *
   * @example
   * <caption>`nodeProtocol: false` — do not transform imports</caption>
   *
   * ```ts
   * // Input
   * import 'node:fs'
   *
   * // Output
   * import 'node:fs'
   * ```
   */
  nodeProtocol?: 'strip' | boolean

  /**
   * Controls which warnings are emitted during the build process. Each option
   * can be set to `true` (emit warning) or `false` (suppress warning).
   */
  checks?: ChecksOptions & {
    /**
     * If the config includes the `cjs` format and
     * one of its target >= node 20.19.0 / 22.12.0,
     * warn the user about the deprecation of CommonJS.
     *
     * @default true
     */
    legacyCjs?: boolean
  }

  /**
   * @hidden
   */
  plugins?: TsdownPluginOption

  /**
   * Use with caution; ensure you understand the implications.
   *
   * @hidden
   */
  inputOptions?:
    | InputOptions
    | ((
        options: InputOptions,
        format: NormalizedFormat,
        context: { cjsDts: boolean },
      ) => Awaitable<InputOptions | void | null>)

  //#region Output Options

  /**
   * Specify the desired output format(s) for the build. Available formats are:
   * - `'esm'`, `'es'` and `'module'`: {@link https://nodejs.org/api/esm.html#modules-ecmascript-modules | ECMAScript Module format}, ideal for modern JavaScript environments, including browsers and Node.js.
   * - `'cjs'` and `'commonjs'`: {@link https://nodejs.org/api/modules.html#modules-commonjs-modules | CommonJS Module format}, commonly used in Node.js projects.
   * - `'iife'`: {@link https://developer.mozilla.org/en-US/docs/Glossary/IIFE | Immediately Invoked Function Expression}, suitable for embedding in `<script>` tags or standalone browser usage.
   * - `'umd'`: {@link https://github.com/umdjs/umd | Universal Module Definition}, a format that works on {@link https://github.com/amdjs/amdjs-api/wiki/AMD | AMD}, {@link https://nodejs.org/api/modules.html#modules-commonjs-modules | CommonJS}, and global variables.
   *
   * You can override specific configuration options for each output format by
   * setting `format` as an object in your config file. This allows you to
   * tailor settings such as {@linkcode UserConfig.target | target} or other
   * options for each `format` individually.
   *
   * @default 'esm'
   *
   * @example
   * <caption>Specify a single output format</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: { index: 'src/index.ts' },
   *   format: 'esm',
   * })
   * ```
   *
   * @example
   * <caption>Specify multiple output formats using an array</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: { index: 'src/index.ts' },
   *   format: ['esm', 'cjs'],
   * })
   * ```
   *
   * @example
   * <caption>Overriding configuration by format using an object</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   entry: ['./src/index.js'],
   *   format: {
   *     esm: {
   *       target: ['es2017'],
   *     },
   *     cjs: {
   *       target: ['node20'],
   *     },
   *   },
   * })
   * ```
   *
   * @see {@link https://tsdown.dev/options/output-format | output-format option documentation} for more details.
   */
  format?: Arrayable<Format> | Partial<Record<Format, Partial<ResolvedConfig>>>

  /**
   * The global variable name exposed when using
   * {@linkcode https://developer.mozilla.org/en-US/docs/Glossary/IIFE | iife}
   * or {@linkcode https://github.com/umdjs/umd | umd} format.
   */
  globalName?: OutputOptions['name']

  /**
   * Directory to write output files into. The directory will be created if it
   * does not exist.
   *
   * @default 'dist'
   */
  outDir?: string

  /**
   * Whether to write the files to disk. This option is incompatible with
   * `watch` mode.
   *
   * @default true
   */
  write?: BuildOptions['write']

  /**
   * Whether to generate source map files. Note that this option will always be
   * `true` if you have
   * {@linkcode https://www.typescriptlang.org/tsconfig/#declarationMap | declarationMap}
   * option enabled in your `tsconfig.json`. It accepts the following values:
   * - `false` (default): Disable source maps.
   * - `true`: Generate separate `.map` files alongside the output. A `//# sourceMappingURL` comment is appended to each output file pointing to the `.map` file.
   * - `'inline'`: Embed the source map directly in the output file as a base64-encoded data URL. No separate `.map` file is generated. Similar to TypeScript's {@linkcode https://www.typescriptlang.org/tsconfig/#inlineSourceMap | inlineSourceMap}.
   * - `'hidden'`: Generate separate `.map` files but **do not** append the `//# sourceMappingURL` comment to the output. Useful when you want source maps available for error monitoring services but do not want browsers to load them automatically.
   *
   * @default false
   *
   * @example
   * <caption>Generate separate source map files with `sourceMappingURL` comments</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   sourcemap: true,
   * })
   * ```
   *
   * @example
   * <caption>Inline source maps into output files</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   sourcemap: 'inline',
   * })
   * ```
   *
   * @example
   * <caption>Generate `.map` files without `sourceMappingURL` comments</caption>
   *
   * ```ts
   * import { defineConfig } from 'tsdown'
   *
   * export default defineConfig({
   *   sourcemap: 'hidden',
   * })
   * ```
   *
   * @see {@link https://tsdown.dev/options/sourcemap | sourcemap option documentation} for more details.
   */
  sourcemap?: OutputOptions['sourcemap']

  /**
   * Clean directories before build. Default to output directory.
   *
   * @default true
   */
  clean?: boolean | string[]

  /**
   * Minify the output files. Powered by
   * {@linkcode https://oxc.rs | Oxc} (currently in alpha), which removes
   * whitespace, comments, and renames variables to reduce bundle size.
   *
   * @default false
   * @see {@link https://tsdown.dev/options/minification | minification option documentation} for more details.
   */
  minify?: OutputOptions['minify']

  /**
   * Code to append to each output chunk.
   */
  footer?: ChunkAddon

  /**
   * Code to prepend to each output chunk.
   */
  banner?: ChunkAddon

  /**
   * Determines whether `unbundle` is enabled. When set to `true`, the output
   * files will mirror the input file structure.
   *
   * @default false
   */
  unbundle?: boolean

  /**
   * Specifies the root directory of input files, similar to TypeScript's
   * {@linkcode https://www.typescriptlang.org/tsconfig/#rootDir | rootDir}.
   * This determines the output directory structure. By default, the root is
   * computed as the common base directory of all entry files.
   *
   * @see {@linkcode https://www.typescriptlang.org/tsconfig/#rootDir | rootDir}
   */
  root?: string

  /**
   * @default true
   * @deprecated Use {@linkcode UserConfig.unbundle | unbundle} instead.
   */
  bundle?: boolean

  /**
   * Use a fixed extension for output files.
   * The extension will always be `.cjs` or `.mjs`.
   * Otherwise, it will depend on the package type. Defaults to `true` if
   * {@linkcode UserConfig.platform | platform} is set to `'node'`, `false`
   * otherwise.
   *
   * @default platform === 'node'
   */
  fixedExtension?: boolean

  /**
   * Custom extensions for output files.
   * {@linkcode UserConfig.fixedExtension | fixedExtension} will be overridden
   * by this option.
   */
  outExtensions?: OutExtensionFactory

  /**
   * If enabled, appends hash to chunk filenames.
   *
   * @default true
   */
  hash?: boolean

  /**
   * It helps improve compatibility when generating CommonJS (CJS) modules.
   * When your module has **only a single `default` export** and the output
   * format is set to CJS, `tsdown` will automatically transform:
   * - `export default` into `module.exports =` in the generated JavaScript
   *   file.
   * For TypeScript declaration files (`.d.ts`), it will transform:
   * - `export default` into `export =`.
   * This ensures that consumers using CommonJS `require` syntax
   * (`require('your-module')`) will receive the `default` export directly,
   * improving interoperability with tools and environments that expect this
   * behavior.
   *
   * @default true
   *
   * @example
   * <caption>With `cjsDefault` set to `true`</caption>
   *
   * #### **Source Module (`src/index.ts`)**:
   *
   * ```ts
   * export default function greet() {
   *   console.log('Hello, world!');
   * }
   * ```
   *
   * #### **Generated CJS Output (`dist/index.cjs`)**:
   *
   * ```js
   * function greet() {
   *   console.log('Hello, world!');
   * }
   * module.exports = greet;
   * ```
   *
   * #### **Generated Declaration File (`dist/index.d.cts`)**:
   *
   * ```ts
   * declare function greet(): void;
   * export = greet;
   * ```
   */
  cjsDefault?: boolean

  /**
   * Use with caution; ensure you understand the implications.
   *
   * @hidden
   */
  outputOptions?:
    | OutputOptions
    | ((
        options: OutputOptions,
        format: NormalizedFormat,
        context: { cjsDts: boolean },
      ) => Awaitable<OutputOptions | void | null>)

  //#region CLI Options

  /**
   * The working directory of the config file.
   * - Defaults to {@linkcode process.cwd | process.cwd()} for root config.
   * - Defaults to the package directory for {@linkcode UserConfig.workspace | workspace} config.
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   * The name to show in CLI output. This is useful for monorepos or workspaces.
   * When using `workspace` mode, this option defaults to the
   * {@linkcode PackageJsonWithPath.name | package name} from `package.json`.
   * In non-workspace mode, this option must be set explicitly for the name to
   * show in the CLI output.
   */
  name?: string

  /**
   * Controls the verbosity of console logging during the build.
   *
   * - `'silent'`: Suppress all log output.
   * - `'error'`: Show errors only.
   * - `'warn'`: Show warnings and errors.
   * - `'info'`: Show all messages including informational output.
   *
   * @default 'info'
   * @see {@link https://tsdown.dev/options/log-level | log-level option documentation} for more details.
   */
  logLevel?: LogLevel

  /**
   * Fail the build with a non-zero exit code when warnings are emitted.
   *
   * - `true`: Always fail on warnings.
   * - `false`: Never fail on warnings.
   * - `'ci-only'`: Fail on warnings only when running in a CI environment.
   * - `'local-only'`: Fail on warnings only when running locally.
   *
   * @default false
   */
  failOnWarn?: boolean | CIOption

  /**
   * Custom logger.
   */
  customLogger?: Logger

  /**
   * Reuse config from {@link https://vite.dev | Vite} or
   * {@link https://vitest.dev | Vitest}.
   *
   * @default false
   * @experimental
   */
  fromVite?: boolean | 'vitest'

  /**
   * Enable `watch` mode to watch files and rebuild on changes. When set to
   * `true`, all files in the project will be watched. You can also specify an
   * array of file paths or glob patterns to watch specific files or
   * directories.
   *
   * @default false
   */
  watch?: boolean | Arrayable<string>

  /**
   * Files or patterns to not watch while in `watch` mode.
   *
   * @default []
   */
  ignoreWatch?: Arrayable<string | RegExp>

  /**
   * Enable devtools. DevTools is still under development, and this is for
   * early testers only. This may slow down the build process significantly.
   *
   * @default false
   * @experimental
   */
  devtools?: WithEnabled<DevtoolsOptions>

  //#region Addons

  /**
   * You can specify command to be executed after a successful build, especially
   * useful for `watch` mode.
   */
  onSuccess?:
    | string
    | ((config: ResolvedConfig, signal: AbortSignal) => Awaitable<void>)

  /**
   * Enables generation of TypeScript declaration files (`.d.ts`).
   *
   * By default, this option is auto-detected based on your project's `package.json`:
   * - If {@linkcode UserConfig.exe | exe} is enabled, declaration file generation is disabled by default.
   * - If the {@linkcode PackageJsonWithPath.types | types} field is present, or if the main {@linkcode PackageJsonWithPath.exports | exports} contains a `types` entry, declaration file generation is enabled by default.
   * - If the {@linkcode https://www.typescriptlang.org/tsconfig/#declaration | declaration} option is set to `true` in `tsconfig.json`, declaration file generation is enabled by default.
   * - Otherwise, declaration file generation is disabled by default.
   *
   * Performance depends on whether
   * {@linkcode https://www.typescriptlang.org/tsconfig/#isolatedDeclarations | isolatedDeclarations}
   * is enabled in `tsconfig.json`. With `isolatedDeclarations`, declarations
   * are generated via `oxc-transform` (very fast). Without it, the TypeScript
   * compiler is used (slower).
   *
   * @see {@link https://tsdown.dev/options/dts | dts option documentation} for more details.
   */
  dts?: WithEnabled<DtsOptions>

  /**
   * Enable unused dependencies check with
   * {@linkcode https://github.com/unplugin/unplugin-unused | unplugin-unused}.
   * Requires
   * {@linkcode https://github.com/unplugin/unplugin-unused | unplugin-unused}
   * to be installed.
   *
   * @default false
   */
  unused?: WithEnabled<UnusedOptions>

  /**
   * Run {@linkcode https://publint.dev/docs | publint} after bundling.
   * Requires {@linkcode https://publint.dev/docs | publint} to be installed.
   *
   * @default false
   */
  publint?: WithEnabled<PublintOptions>

  /**
   * Run
   * {@linkcode https://github.com/arethetypeswrong/arethetypeswrong.github.io | `arethetypeswrong`}
   * after bundling. Requires
   * {@linkcode https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/HEAD/packages/core | `@arethetypeswrong/core`}
   * to be installed.
   *
   * @default false
   * @see {@linkcode https://github.com/arethetypeswrong/arethetypeswrong.github.io | arethetypeswrong} for more details.
   */
  attw?: WithEnabled<AttwOptions>

  /**
   * Enable size reporting after bundling.
   *
   * @default true
   */
  report?: WithEnabled<ReportOptions>

  /**
   * `import.meta.glob` support.
   *
   * @default true
   * @see {@link https://vite.dev/guide/features.html#glob-import | Vite's glob import} for more details.
   */
  globImport?: boolean

  /**
   * Generate package exports for `package.json`. This will set the
   * {@linkcode PackageJsonWithPath.main | main},
   * {@linkcode PackageJsonWithPath.module | module},
   * {@linkcode PackageJsonWithPath.types | types},
   * {@linkcode PackageJsonWithPath.exports | exports} fields in `package.json`
   * to point to the generated files.
   *
   * @default false
   */
  exports?: WithEnabled<ExportsOptions>

  /**
   * CSS options. Requires
   * {@linkcode https://github.com/rolldown/tsdown/tree/HEAD/packages/css | @tsdown/css}
   * to be installed.
   *
   * @experimental
   * @hidden
   */
  css?: CssOptions

  /**
   * @deprecated Use {@linkcode CssOptions.inject | css.inject} instead.
   */
  injectStyle?: boolean

  /**
   * @alias copy
   * @deprecated Alias for {@linkcode UserConfig.copy | copy}, will be removed in the future.
   */
  publicDir?: CopyOptions | CopyOptionsFn

  /**
   * Copy files to another directory.
   *
   * @example
   * <caption>Mix paths, globs, and entry objects</caption>
   *
   * ```ts
   * [
   *   'src/assets',
   *   'src/env.d.ts',
   *   'src/styles/**\/*.css',
   *   { from: 'src/assets', to: 'dist/assets' },
   *   { from: 'src/styles/**\/*.css', to: 'dist', flatten: true },
   * ]
   * ```
   */
  copy?: CopyOptions | CopyOptionsFn

  /**
   * @hidden
   */
  hooks?:
    | Partial<TsdownHooks>
    | ((hooks: Hookable<TsdownHooks>) => Awaitable<void>)

  /**
   * Bundle as executable using Node.js SEA (Single Executable Applications).
   * This will bundle the output into a single executable file using Node.js
   * SEA. Note that this is only supported on Node.js 25.7.0 and later, and is
   * not supported in Bun or Deno.
   *
   * @default false
   * @experimental
   */
  exe?: WithEnabled<ExeOptions>

  /**
   * Enable `workspace` mode. This allows you to build multiple packages in a
   * monorepo.
   *
   * @experimental
   */
  workspace?: Workspace | Arrayable<string> | true
}

export interface InlineConfig extends UserConfig {
  /**
   * Path to the `tsdown` config file.
   * - `true`: Auto-detect the config file.
   * - `false`: Disable config file loading.
   * - `string`: Explicit path to the config file.
   */
  config?: boolean | string

  /**
   * Config loader to use. It can only be set via CLI or API. The available
   * loaders are:
   *
   * - `'auto'` (default): Utilizes native runtime loading for TypeScript if supported; otherwise, defaults to {@linkcode https://github.com/Gugustinette/unrun | unrun}.
   * - `'native'`: Loads TypeScript configuration files using native runtime support. Requires a compatible environment, such as Node.js 22.18.0+, Deno, or Bun.
   * - `'tsx'`: Loads configuration files using the {@linkcode https://tsx.hirok.io | tsx} library via its {@link https://tsx.hirok.io/dev-api/ts-import | `tsImport` API}. Note that {@linkcode https://tsx.hirok.io | tsx} is an optional peer dependency — you need to install it manually if you want to use this loader.
   * - `'unrun'`: Loads configuration files using the {@linkcode https://github.com/Gugustinette/unrun | unrun} library. It provides more powerful and flexible loading capabilities. Note that {@linkcode https://github.com/Gugustinette/unrun | unrun} is an optional peer dependency — you need to install it manually if you want to use this loader.
   *
   * **Note:** Node.js does not natively support importing TypeScript files
   * without specifying the file extension. If you are using Node.js and want
   * to load a TypeScript config file without including the `.ts` extension,
   * consider installing and using the {@linkcode https://tsx.hirok.io | tsx}
   * or {@linkcode https://github.com/Gugustinette/unrun | unrun} loader for
   * seamless compatibility.
   *
   * @default 'auto'
   */
  configLoader?: 'auto' | 'native' | 'tsx' | 'unrun'

  /**
   * Filter configs by cwd or name.
   */
  filter?: RegExp | Arrayable<string>
}

/**
 * The function form of a tsdown config export. Receives the inline config
 * (e.g. CLI flags) and a context object, and returns one or more
 * {@linkcode UserConfig} objects.
 *
 * The `context.ci` boolean lets you branch on whether the build is running
 * inside a CI environment (detected via
 * {@linkcode https://www.npmjs.com/package/is-in-ci | is-in-ci}).
 *
 * @example
 * <caption>Branch on CI environment to enable minification</caption>
 *
 * ```ts
 * export default defineConfig((_, { ci }) => ({
 *   minify: ci,
 *   sourcemap: !ci,
 * }));
 * ```
 *
 * @see {@link https://tsdown.dev/advanced/ci | CI environment documentation}
 */
export type UserConfigFn = (
  inlineConfig: InlineConfig,
  context: { ci: boolean; rootConfig?: UserConfig },
) => Awaitable<Arrayable<UserConfig>>

/**
 * The type for the default export of a tsdown config file. Can be:
 * - A single {@linkcode UserConfig} object.
 * - An array of {@linkcode UserConfig} objects (for multiple outputs).
 * - A {@linkcode UserConfigFn} function.
 * - A `Promise` resolving to any of the above.
 *
 * @example
 * <caption>Single config object</caption>
 *
 * ```ts
 * export default defineConfig({ entry: 'src/index.ts' })
 * ```
 *
 * @example
 * <caption>Array of configs for multiple outputs</caption>
 *
 * ```ts
 * export default defineConfig([
 *   { entry: 'src/entry1.ts', platform: 'node' },
 *   { entry: 'src/entry2.ts', platform: 'browser' },
 * ])
 * ```
 *
 * @example
 * <caption>Function form for dynamic configuration</caption>
 *
 * ```ts
 * export default defineConfig((_, { ci }) => ({
 *   minify: ci,
 * }))
 * ```
 *
 * @see {@link https://tsdown.dev/options/config-file | Config File documentation}
 */
export type UserConfigExport = Awaitable<Arrayable<UserConfig> | UserConfigFn>

export type ResolvedConfig = Overwrite<
  MarkPartial<
    Omit<
      UserConfig,
      | 'workspace' // merged
      | 'fromVite' // merged
      | 'publicDir' // deprecated
      | 'bundle' // deprecated
      | 'injectStyle' // deprecated, merged to `css`
      | 'removeNodeProtocol' // deprecated
      | 'external' // deprecated, merged to `deps`
      | 'noExternal' // deprecated, merged to `deps`
      | 'inlineOnly' // deprecated, merged to `deps`
      | 'skipNodeModulesBundle' // deprecated, merged to `deps`
      | 'logLevel' // merge to `logger`
      | 'failOnWarn' // merge to `logger`
      | 'customLogger' // merge to `logger`
      | 'envFile' // merged to `env`
      | 'envPrefix' // merged to `env`
    >,
    | 'globalName'
    | 'inputOptions'
    | 'outputOptions'
    | 'minify'
    | 'define'
    | 'alias'
    | 'onSuccess'
    | 'outExtensions'
    | 'hooks'
    | 'copy'
    | 'loader'
    | 'name'
    | 'banner'
    | 'footer'
    | 'checks'
    | 'css'
  >,
  {
    /**
     * Resolved entry map (after glob expansion).
     */
    entry: Record<string, string>

    /**
     * Original entry config before glob resolution
     * (for `watch` mode re-globbing).
     */
    rawEntry?: TsdownInputOption

    nameLabel: string | undefined

    format: NormalizedFormat

    target?: string[]

    clean: string[]

    pkg?: PackageJsonWithPath

    nodeProtocol: 'strip' | boolean

    logger: Logger

    ignoreWatch: Array<string | RegExp>

    deps: ResolvedDepsConfig

    /**
     * Resolved root directory of input files.
     */
    root: string

    configDeps: Set<string>

    dts: false | DtsOptions

    report: false | ReportOptions

    tsconfig: false | string

    exports: false | ExportsOptions

    devtools: false | DevtoolsOptions

    publint: false | PublintOptions

    attw: false | AttwOptions

    unused: false | UnusedOptions

    exe: false | ExeOptions
  }
>
