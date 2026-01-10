import type { NormalizedFormat, ResolvedConfig } from '../config/types.ts'
import type { OutputAsset, OutputChunk } from 'rolldown'

/**
 * A Rolldown output chunk or asset augmented with the `outDir` property
 * that records the resolved output directory for this build pass.
 */
export type RolldownChunk = (OutputChunk | OutputAsset) & { outDir: string }

/**
 * A {@linkcode RolldownChunk} narrowed to code chunks only
 * (`type === 'chunk'`).
 */
export type RolldownCodeChunk = RolldownChunk & { type: 'chunk' }

/**
 * Output chunks from a build pass grouped by their normalized output format.
 */
export type ChunksByFormat = Partial<Record<NormalizedFormat, RolldownChunk[]>>

/**
 * The result of a single tsdown build pass. Holds all emitted chunks, the
 * resolved configuration, and a record of npm packages that were inlined.
 * Implements {@linkcode AsyncDisposable} so it can be used with
 * `await using` syntax.
 */
export interface TsdownBundle extends AsyncDisposable {
  /**
   * All output chunks emitted by this build pass, each annotated with the
   * resolved output directory.
   */
  chunks: RolldownChunk[]

  /**
   * The {@linkcode ResolvedConfig} used for this build pass.
   */
  config: ResolvedConfig

  /**
   * Map of inlined npm packages to the set of bundled versions. Keys are
   * package names; values are sets of version strings found in the bundle.
   */
  inlinedDeps: Map<string, Set<string>>
}

/**
 * Annotates each Rolldown output chunk with the output directory path.
 *
 * @param chunks - Raw Rolldown output chunks or assets.
 * @param outDir - The resolved output directory to attach to each chunk.
 * @returns The same chunks with `outDir` mutated in place, typed as {@linkcode RolldownChunk}[].
 */
export function addOutDirToChunks(
  chunks: Array<OutputChunk | OutputAsset>,
  outDir: string,
): RolldownChunk[] {
  return chunks.map((chunk) => {
    // @ts-expect-error missing property
    chunk.outDir = outDir
    return chunk as RolldownChunk
  })
}
