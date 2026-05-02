/**
 * An alias for type **`{}`**. Represents any value that is not
 * **`null`** or **`undefined`**. It is mostly used for semantic purposes to
 * help distinguish between an empty object type and **`{}`**
 * as they are not the same.
 */
export type AnyNonNullishValue = NonNullable<unknown>

/**
 * Useful to flatten the type output to improve type hints shown in editors.
 * And also to transform an interface into a type to aid with assignability.
 *
 * @example
 * <caption>Basic usage</caption>
 *
 * ```ts
 * import type { Simplify } from "./typeHelpers.js";
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
 *   bar: "hello",
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
 * Overwrite the properties of {@linkcode T} with those of {@linkcode U}.
 * Properties present in both types use the type from {@linkcode U}.
 *
 * @template T - The base type.
 * @template U - The overriding type whose properties shadow `T`.
 */
export type Overwrite<T, U> = Omit<T, keyof U> & U

/**
 * A value that is either {@linkcode T} or a  {@linkcode Promise | Promise<T>}.
 * Used for functions that may return synchronously or asynchronously.
 *
 * @template T - The resolved value type.
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Make specific keys of {@linkcode T} optional while keeping all other keys
 * required.
 *
 * @template T - The base type.
 * @template K - The keys to make optional.
 */
export type MarkPartial<T, K extends keyof T> = Omit<Required<T>, K> &
  Partial<Pick<T, K>>

/**
 * A single item of type {@linkcode T} or an array of {@linkcode T}. Useful for
 * config options that accept either a single value or a list.
 *
 * @template T - The element type.
 */
export type Arrayable<T> = T | T[]
