import type { UserConfig as TsdownUserConfig } from '../src/index.ts'

/**
 * Useful to flatten the type output to improve type hints shown in editors.
 * And also to transform an interface into a type to aid with assignability.
 *
 * @example
 * <caption>Basic usage</caption>
 *
 * ```ts
 * import type { Simplify } from './typeHelpers.js';
 *
 * interface SomeInterface {
 *   bar?: string;
 *   baz: number | undefined;
 *   foo: number;
 * }
 *
 * type SomeType = {
 *   bar?: string;
 *   baz: number | undefined;
 *   foo: number;
 * };
 *
 * const literal = {
 *   bar: 'hello',
 *   baz: 456,
 *   foo: 123,
 * } as const satisfies SomeType satisfies SomeInterface;
 *
 * const someType: SomeType = literal;
 * const someInterface: SomeInterface = literal;
 *
 * function fn(object: Record<string, unknown>): void {
 *   console.log(object);
 * }
 *
 * fn(literal); // ✅ Good: literal object type is sealed
 * fn(someType); // ✅ Good: type is sealed
 * // @ts-expect-error
 * fn(someInterface); // ❌ Error: Index signature for type 'string' is missing in type 'SomeInterface'. Because `interface` can be re-opened
 * fn(someInterface as Simplify<SomeInterface>); // ✅ Good: transform an `interface` into a `type`
 * ```
 *
 * @template BaseType - The type to simplify.
 *
 * @see {@link https://github.com/sindresorhus/type-fest/blob/2300245cb6f0b28ee36c2bb852ade872254073b8/source/simplify.d.ts Source}
 * @see {@link https://github.com/microsoft/TypeScript/issues/15300 | TypeScript Issue}
 * @internal
 */
export type Simplify<BaseType> = BaseType extends (...args: never[]) => unknown
  ? BaseType
  : NonNullable<unknown> & {
      [KeyType in keyof BaseType]: BaseType[KeyType]
    }

/**
 * Options for `tsdown`.
 */
export type TsdownUserConfigDefinition = {
  /**
   * The schema to verify this document against.
   */
  $schema?: string
} & TsdownUserConfig
