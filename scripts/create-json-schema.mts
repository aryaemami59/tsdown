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

const inputFilePath = path.join(ROOT_DIR, 'scripts', 'schemas.ts')

const rootNames = globSync(['src/**/*.ts', 'scripts/*.ts'], {
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
  paths: { tsdown: ['./src/index.ts'] },
  rewriteRelativeImportExtensions: true,
  rootDir: ROOT_DIR,
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

const rootFileNames = tsProgram.getRootFileNames()

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

const objectConfig = Object.entries(entries)

  .map(([, output]) => ({
    ...config,
    type: output.type,
    path: inputFilePath,
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

const stripPrivateFields: ts.TransformerFactory<ts.SourceFile | ts.Bundle> = (
  ctx,
) => {
  const visitor = (node: ts.Node) => {
    if (ts.isPropertySignature(node) && ts.isPrivateIdentifier(node.name)) {
      return ctx.factory.updatePropertySignature(
        node,
        node.modifiers,
        ctx.factory.createStringLiteral(node.name.text),
        node.questionToken,
        node.type,
      )
    }
    return ts.visitEachChild(node, visitor, ctx)
  }
  return (sourceFile) =>
    ts.visitNode(sourceFile, visitor, ts.isSourceFile) ?? sourceFile
}

const customTransformers: ts.CustomTransformers = {
  afterDeclarations: [stripPrivateFields],
}

// console.log(
//   tsProgram.getSourceFile(
//     path.join(import.meta.dirname, 'scripts', 'schemas.ts'),
//   ),
// )

// const typeChecker = tsProgram.getTypeChecker()
// console.log(typeChecker)

const sourceFile = tsProgram.getSourceFile(inputFilePath)

const emitResult = tsProgram.emit(
  // tsProgram.getSourceFile(path.join(ROOT_DIR, 'scripts', 'schemas.ts')),
  sourceFile,
  (fileName, code) => {
    // console.log(ts.sys.resolvePath(sourceFile?.fileName))
    // console.log(fileName)
    if (fileName.endsWith('.map')) {
      const map = JSON.parse(code)
      // console.log(map)
    } else if (ts.sys.resolvePath(fileName) === ts.sys.resolvePath(fileName)) {
      console.log(fileName)
      console.log(ts.sys.resolvePath(inputFilePath))
      console.log(
        ts.bundlerModuleNameResolver(
          fileName,
          inputFilePath,
          compilerOptions,
          ts.sys,
          undefined,
          undefined,
        ).resolvedModule?.resolvedFileName,
      )
      ts.sys.writeFile(fileName, code)
      // return code
      // console.log(code)
    }
  },
  undefined,
  true,
  customTransformers,
  // @ts-expect-error private API: forceDtsEmit,
  true,
)
// console.dir(emitResult, {
//   depth: 4,
//   getters: false,
//   sorted: false,
// })

if (!emitResult.emitSkipped) {
  // console.log(emitResult.emittedFiles)
  await Promise.all(
    stringifiedSchemas.map(([outputFile, content]) =>
      fs.writeFile(outputFile, content, { encoding: 'utf8' }),
    ),
  )
}
