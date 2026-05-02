import picomatch from 'picomatch'

/**
 * Coerce a value to an array. Returns the array as-is, wraps a non-null
 * value in a single-element array, and returns `[defaultValue]` (or `[]`)
 * when the value is `null` or `undefined`.
 *
 * @template T - The element type of the resulting array.
 *
 * @param val - The value to coerce.
 * @param [defaultValue] - Fallback element used when {@linkcode val} is nullish.
 * @returns An array derived from {@linkcode val}.
 */
export function toArray<T>(
  val: T | T[] | null | undefined,
  defaultValue?: T,
): T[] {
  if (Array.isArray(val)) {
    return val
  } else if (val == null) {
    if (defaultValue) return [defaultValue]
    return []
  } else {
    return [val]
  }
}

/**
 * Split every string in {@linkcode arr} on commas and flatten the result into
 * a single array of the same type.
 *
 * @template T - The string literal type of the array elements, preserved in the output.
 *
 * @param arr - Array of strings that may contain comma-separated values.
 * @returns Flattened array with each comma-delimited segment as its own element.
 */
export function resolveComma<T extends string>(arr: T[]): T[] {
  return arr.flatMap((format) => format.split(',') as T[])
}

/**
 * Convert a slash-delimited regex literal string (e.g. `'/foo/'`) into a
 * {@linkcode RegExp}. Strings that do not match that pattern are returned
 * unchanged.
 *
 * @template T - The type of the input value, preserved in the output when it is not a regex literal string.
 *
 * @param str - The value to inspect.
 * @returns A {@linkcode RegExp} when {@linkcode str} is a regex literal string, otherwise {@linkcode str} itself.
 */
export function resolveRegex<T>(str: T): T | RegExp {
  if (
    typeof str === 'string' &&
    str.length > 2 &&
    str[0] === '/' &&
    str.at(-1) === '/'
  ) {
    return new RegExp(str.slice(1, -1))
  }
  return str
}

/**
 * Normalize path separators to forward slashes.
 *
 * @param string - The path string to normalize.
 * @returns The path with all backslashes replaced by forward slashes.
 */
export function slash(string: string): string {
  return string.replaceAll('\\', '/')
}

/**
 * Identity function
 *
 * @template T - The type of the input and output value.
 *
 * @param v - The value to return.
 * @returns Its argument unchanged. Useful as a no-op color/transform placeholder.
 */
export const noop = <T>(v: T): T => v

/**
 * Test whether {@linkcode id} matches any entry in {@linkcode patterns}.
 * String patterns are matched with
 * {@link https://github.com/micromatch/picomatch | picomatch}.
 * {@linkcode RegExp} patterns use {@linkcode RegExp.prototype.test}.
 *
 * @param id - The identifier to test.
 * @param patterns - Glob strings or regular expressions to match against.
 * @returns `true` if {@linkcode id} satisfies at least one pattern.
 */
export function matchPattern(
  id: string,
  patterns: (string | RegExp)[],
): boolean {
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) {
      pattern.lastIndex = 0
      return pattern.test(id)
    }
    return id === pattern || picomatch(pattern)(id)
  })
}

/**
 * Check whether a module can be resolved from the current environment
 * without actually importing it.
 *
 * @param moduleName - The bare or path module specifier to probe.
 * @returns `true` if the module resolves successfully, `false` otherwise.
 */
export function pkgExists(moduleName: string): boolean {
  try {
    import.meta.resolve(moduleName)
    return true
  } catch {}
  return false
}

/**
 * Dynamically import a module, re-throwing any error with an actionable
 * install hint when the import fails.
 *
 * @template T - The expected type of the imported module, for typing convenience. No actual type checking is performed at runtime; the import is simply cast to `T`.
 *
 * @param moduleName - The module specifier to import.
 * @returns The imported module cast to {@linkcode T}.
 * @throws An {@linkcode Error} When the module cannot be imported (e.g. not installed).
 */
export async function importWithError<T>(moduleName: string): Promise<T> {
  try {
    return (await import(moduleName)) as T
  } catch (error) {
    const final = new Error(
      `Failed to import module "${moduleName}". Please ensure it is installed.`,
      { cause: error },
    )
    throw final
  }
}

// TODO Promise.withResolvers
/**
 * Create a {@linkcode Promise} together with its `resolve` function, exposed
 * separately so that external code can settle the {@linkcode Promise}.
 *
 * @template T - The type of the promise's resolved value.
 *
 * @returns An object with `promise` and the corresponding `resolve` callback.
 */
export function promiseWithResolvers<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  typeAssert(resolve!)
  return { promise, resolve }
}

export function typeAssert<T>(
  // eslint-disable-next-line unused-imports/no-unused-vars
  value: T,
): asserts value is Exclude<T, false | null | undefined> {}

/**
 * Return a debounced wrapper around {@linkcode fn} that delays invocation
 * until {@linkcode delay} milliseconds have elapsed since the last call. The
 * wrapper also exposes a `cancel()` method to discard a pending invocation.
 *
 * @template T - The type of the function to debounce.
 *
 * @param fn - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @returns The debounced function with a `cancel()` method.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}
