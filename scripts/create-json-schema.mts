import { globSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { format, resolveConfig } from 'prettier'
import {
  createGenerator,
  DEFAULT_CONFIG,
  type Config,
} from 'ts-json-schema-generator'
import ts from 'typescript'

const ROOT_DIR = path.join(import.meta.dirname, '..')

const SCHEMAS_DIR = path.join(ROOT_DIR, 'docs', 'public')

const rootNames = globSync(['src/**/*.ts'], {
  cwd: ROOT_DIR,
  exclude: [
    'src/**/*.test.ts*',
    '**/temp',
    '**/fixtures',
    '**/node_modules',
    '**/dist',
  ],
})

const compilerOptions = {
  allowImportingTsExtensions: true,
  declaration: true,
  declarationMap: true,
  erasableSyntaxOnly: true,
  isolatedModules: true,
  jsx: 4 satisfies ts.JsxEmit.ReactJSX,
  lib: ['ESNext', 'DOM'],
  libReplacement: false,
  module: 199,
  moduleDetection: 3,
  noEmitOnError: true,
  noErrorTruncation: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedSideEffectImports: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  outDir: path.join(ROOT_DIR, 'dist'),
  rewriteRelativeImportExtensions: true,
  rootDir: path.join(ROOT_DIR, 'src'),
  skipLibCheck: true,
  sourceMap: true,
  strict: true,
  target: 99,
  types: ['node'],
  useDefineForClassFields: true,
  useUnknownInCatchVariables: true,
  verbatimModuleSyntax: true,
} as const satisfies ts.CompilerOptions

const host = ts.createCompilerHost(compilerOptions, true)

const tsProgram = ts.createProgram({
  rootNames,
  host,
  options: compilerOptions,
})

const entries = {
  tsdownConfig: { outputFile: 'tsdown.config', type: ['UserConfig'] },
} as const satisfies Record<string, { outputFile: string; type: string[] }>

const config = {
  ...DEFAULT_CONFIG,
  discriminatorType: 'json-schema',
  encodeRefs: false,
  expose: 'export',
  fullDescription: false,
  functions: 'hide',
  jsDoc: 'extended',
  markdownDescription: true,
  skipTypeCheck: false,
  sortProps: true,
  strictTuples: true,
  topRef: true,
  tsProgram,
  type: ['*'],
} as const satisfies Config

const objectConfig = Object.entries(entries).map(([, output]) => ({
  ...config,
  type: output.type,
  path: path.join(ROOT_DIR, 'src', 'config.ts'),
  outputFile: path.join(SCHEMAS_DIR, `${output.outputFile}.schema.json`),
}))

const schemas = objectConfig.map(
  ({ outputFile, ...config }) =>
    [outputFile, createGenerator(config).createSchema(config.type)] as const,
)

const stringifiedSchemas = await Promise.all(
  schemas.map(async ([outputFile, schema]) => {
    const prettierConfig = await resolveConfig(outputFile, {
      config: path.join(ROOT_DIR, 'package.json'),
    })

    return [
      outputFile,
      await format(JSON.stringify(schema), {
        ...prettierConfig,
        filepath: outputFile,
      }),
    ] as const
  }),
)

await Promise.all(
  stringifiedSchemas.map(([outputFile, content]) =>
    fs.writeFile(outputFile, content, { encoding: 'utf8' }),
  ),
)
