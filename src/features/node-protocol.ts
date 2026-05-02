import { builtinModules } from 'node:module'
import type { Plugin } from 'rolldown'

/**
 * Rolldown plugin that rewrites Node.js built-in module specifiers according
 * to the {@linkcode UserConfig.nodeProtocol | nodeProtocol} option.
 *
 * - `true`: Add the `node:` prefix (e.g. `fs` → `node:fs`).
 * - `'strip'`: Remove the `node:` prefix (e.g. `node:fs` → `fs`).
 *
 * The `node:` protocol was added in Node.js v14.18.0.
 *
 * @see {@link https://nodejs.org/api/esm.html#node-imports | Node.js ESM imports documentation}
 * @param nodeProtocolOption - `true` to add the `node:` prefix; `'strip'` to remove it.
 * @returns A Rolldown plugin that rewrites matching import specifiers.
 */
export function NodeProtocolPlugin(nodeProtocolOption: 'strip' | true): Plugin {
  const modulesWithoutProtocol = builtinModules.filter(
    (mod) => !mod.startsWith('node:'),
  )

  return {
    name: `tsdown:node-protocol`,
    resolveId: {
      order: 'pre',
      filter: {
        id:
          nodeProtocolOption === 'strip'
            ? new RegExp(`^node:(${modulesWithoutProtocol.join('|')})$`)
            : new RegExp(`^(${modulesWithoutProtocol.join('|')})$`),
      },
      handler:
        nodeProtocolOption === 'strip'
          ? async function (id, ...args) {
              // strip the `node:` prefix
              const strippedId = id.slice(5 /* "node:".length */)

              // check if another resolver (e.g., tsconfig paths, alias) handles the stripped id
              const resolved = await this.resolve(strippedId, ...args)
              if (resolved && !resolved.external) {
                return resolved
              }

              return {
                id: strippedId,
                external: true,
                moduleSideEffects: false,
              }
            }
          : (id) => {
              return {
                id: `node:${id}`,
                external: true,
                moduleSideEffects: false,
              }
            },
    },
  }
}
