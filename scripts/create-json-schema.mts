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

const inputFilePath = path.join(ROOT_DIR, 'src', 'index.ts')

const rootNames = globSync(['src/**/*.ts'], {
  cwd: ROOT_DIR,
  exclude: [
    'src/**/*.test.ts*',
    '**/temp',
    '**/fixtures',
    '**/node_modules',
    '**/dist',
    'packages/**',
    'docs/**',
    'tests/**',
  ],
})

const compilerOptions = {
  allowImportingTsExtensions: true,
  allowJs: false,
  allowSyntheticDefaultImports: true,
  allowUnreachableCode: true,
  allowUnusedLabels: true,
  checkJs: false,
  declaration: true,
  declarationMap: true,
  emitDeclarationOnly: true,
  erasableSyntaxOnly: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  isolatedModules: true,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
  libReplacement: false,
  module: ts.ModuleKind.NodeNext,
  moduleDetection: ts.ModuleDetectionKind.Force,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: false,
  noEmitOnError: true,
  noErrorTruncation: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedSideEffectImports: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
  outDir: path.join(ROOT_DIR, 'dist'),
  rewriteRelativeImportExtensions: true,
  rootDir: path.join(ROOT_DIR),
  skipLibCheck: true,
  sourceMap: true,
  strict: true,
  target: ts.ScriptTarget.ESNext,
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
  tsdownConfig: {
    outputFile: 'tsdown.config',
    type: ['UserConfig'],
  },
} as const satisfies Record<string, { outputFile: string; type: string[] }>

const config = {
  ...DEFAULT_CONFIG,
  discriminatorType: 'json-schema',
  encodeRefs: true,
  expose: 'export',
  fullDescription: false,
  functions: 'hide',
  jsDoc: 'extended',
  markdownDescription: true,
  tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
  additionalProperties: false,
  minify: true,
  skipTypeCheck: false,
  sortProps: true,
  strictTuples: true,
  topRef: true,
  path: inputFilePath,
  tsProgram,
  type: ['UserConfig'],
} as const satisfies Config

const objectConfig = Object.entries(entries).map(([, output]) => ({
  ...config,
  type: output.type,
  path: inputFilePath,
  outputFile: path.join(SCHEMAS_DIR, `${output.outputFile}.schema.json`),
}))

const schemas = objectConfig.map(
  ({ outputFile, ...config }) =>
    [outputFile, createGenerator(config).createSchema(['UserConfig'])] as const,
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
