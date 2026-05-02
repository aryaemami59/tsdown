import process from 'node:process'
import readline from 'node:readline'
import { bgRed, bgYellow, blue, green, rgb, yellow, type Ansis } from 'ansis'
import { noop } from './general.ts'
import type { InternalModuleFormat } from 'rolldown'

export type LogType = 'error' | 'warn' | 'info'
export type LogLevel = LogType | 'silent'

export interface LoggerOptions {
  /**
   * Whether to allow clearing the console screen. By default, tsdown clears
   * the console screen between builds to provide a cleaner output. Setting
   * this to `false` will disable this behavior, allowing the console output to
   * accumulate across builds. This can be useful for debugging or when you
   * want to keep a complete log of all build outputs without clearing previous
   * messages.
   *
   * @default true
   */
  allowClearScreen?: boolean

  /**
   * A custom logger object that implements the same interface as the default
   * logger. If provided, this logger will be used instead of the default
   * logger. This allows you to integrate tsdown's logging with your own
   * logging system or to customize the log output format. The custom logger
   * should have the following methods: `info`, `warn`, `warnOnce`, `error`,
   * `success`, and `clearScreen`. Each method should accept the same arguments
   * as the default logger methods.
   */
  customLogger?: Logger

  /**
   * The console object to use for logging. By default, tsdown uses the global
   * console object. This allows you to redirect log output to a different
   * console implementation if needed.
   *
   * @default globalThis.console
   */
  console?: Console

  /**
   * Whether to treat warnings as errors. If set to `true`, any call to the
   * `warn` or `warnOnce` methods will instead call the `error` method, causing
   * the process to exit with a non-zero code. This can be useful in CI
   * environments where you want to fail the build if any warnings are present.
   *
   * @default false
   */
  failOnWarn?: boolean
}

export type ResolvedLoggerOptions = Pick<
  Required<LoggerOptions>,
  'allowClearScreen' | 'console' | 'failOnWarn'
> &
  Pick<LoggerOptions, 'customLogger'>

export const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
}

export interface Logger {
  /**
   * The current log level. Messages with a severity below this level will not
   * be logged. The levels are ordered as follows: `silent` (0), `error` (1),
   * `warn` (2), and `info` (3). For example, if the log level is set to
   * `warn`, only messages logged with `warn` or `error` will be output, while
   * `info` messages will be ignored.
   */
  level: LogLevel

  /**
   * Optional logger options that may be used by custom loggers or for internal
   * reference.
   */
  options?: LoggerOptions

  /**
   * Log an informational message. These messages are intended for general
   * output.
   */
  info: (...msgs: any[]) => void

  /**
   * Log a warning message. These messages indicate potential issues that do
   * not prevent the build from completing but may require attention.
   */
  warn: (...msgs: any[]) => void

  /**
   * Log a warning message only once. If the same message is logged multiple
   * times, only the first occurrence will be output. This is useful for
   * deprecation warnings or other messages that may be triggered multiple times
   * but should only be shown once to avoid cluttering the console.
   */
  warnOnce: (...msgs: any[]) => void

  /**
   * Log an error message. These messages indicate issues that prevent the build from completing successfully. After logging an error, the process will exit
   * with a non-zero code.
   */
  error: (...msgs: any[]) => void

  /**
   * Log a success message. These messages indicate successful completion of an
   * action or build. They are intended to provide positive feedback to the
   * user.
   */
  success: (...msgs: any[]) => void

  /**
   * Clear the console screen if the logger's log level is at least as high as
   * the specified type. This is typically used to provide a cleaner output
   * during builds by clearing previous messages. The `type` parameter
   * determines the minimum log level required for the screen to be cleared.
   * For example, if the logger's level is set to `info`, calling
   * `clearScreen('warn')` will clear the screen, but calling
   * `clearScreen('error')` will not, since `error` is a higher severity than
   * `warn`.
   *
   * @param type - The {@link LogType | log type} that determines whether the screen should be cleared based on the logger's current {@link LogLevel | log level}.
   */
  clearScreen: (type: LogType) => void
}

function format(msgs: any[]) {
  return msgs.filter((arg) => arg !== undefined && arg !== false).join(' ')
}

function clearScreen() {
  const repeatCount = process.stdout.rows - 2
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''
  console.info(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

const warnedMessages = new Set<string>()

/**
 * Create a logger instance with the specified log level and options. The
 * logger provides methods for logging messages at different levels
 * (info, warn, error, success) and can be customized with options such as
 * allowing screen clearing, providing a custom logger implementation, and
 * treating warnings as errors.
 *
 * @param [level] - The log level for the logger. Messages with a severity below this level will not be logged. The levels are ordered as follows: `'silent'` (0), `'error'` (1), `'warn'` (2), and `'info'` (3). Default is `'info'`.
 * @param [options] - Optional logger options for customizing the logger's behavior. This includes allowing screen clearing, providing a custom logger implementation, specifying a console object for logging, and treating warnings as errors.
 * @returns A logger instance that implements the {@linkcode Logger} interface with the specified log level and options.
 */
export function createLogger(
  level: LogLevel = 'info',
  options: LoggerOptions = {},
): Logger {
  const resolvedOptions = {
    allowClearScreen: true,
    failOnWarn: false,
    console: globalThis.console,
    ...options,
  } satisfies ResolvedLoggerOptions
  /// keep-sorted
  const { allowClearScreen, console, customLogger, failOnWarn } =
    resolvedOptions

  if (customLogger) {
    return customLogger
  }

  function output(type: LogType, msg: string) {
    const thresh = LogLevels[logger.level]
    if (thresh < LogLevels[type]) return

    const method = type === 'info' ? 'log' : type
    console[method](msg)
  }

  const canClearScreen =
    allowClearScreen && process.stdout.isTTY && !process.env.CI
  const clear = canClearScreen ? clearScreen : () => {}

  // extra space for rendering emoji correctly on Windows Terminal
  const isWindowsTerminal = !!process.env.WT_SESSION
  const emojiDivier = ' '.repeat(isWindowsTerminal ? 2 : 1)

  const logger = {
    level,
    options: resolvedOptions,

    info(...msgs: any[]): void {
      output('info', `${blue`ℹ`}${emojiDivier}${format(msgs)}`)
    },

    warn(...msgs: any[]): void {
      if (failOnWarn) {
        return this.error(...msgs)
      }
      const message = format(msgs)
      warnedMessages.add(message)
      output('warn', `\n${bgYellow` WARN `} ${message}\n`)
    },

    warnOnce(...msgs: any[]): void {
      const message = format(msgs)
      if (warnedMessages.has(message)) {
        return
      }

      if (failOnWarn) {
        return this.error(...msgs)
      }
      warnedMessages.add(message)

      output('warn', `\n${bgYellow` WARN `} ${message}\n`)
    },

    error(...msgs: any[]): void {
      output('error', `\n${bgRed` ERROR `} ${format(msgs)}\n`)
      process.exitCode = 1
    },

    success(...msgs: any[]): void {
      output('info', `${green`✔`}${emojiDivier}${format(msgs)}`)
    },

    clearScreen(type) {
      if (LogLevels[logger.level] >= LogLevels[type]) {
        clear()
      }
    },
  } satisfies Logger
  return logger
}

export const globalLogger: Logger = createLogger()

/**
 * Build a bracketed name label colored with `ansis`, e.g. `[my-lib]`.
 *
 * @param ansis - {@linkcode Ansis} color function applied to the label.
 * @param [name] - The name to wrap. When falsy the function returns `undefined`.
 * @returns A colored `[name]` string, or `undefined` when {@linkcode name} is empty.
 */
export function getNameLabel(ansis: Ansis, name?: string): string | undefined {
  if (!name) return undefined
  return ansis(`[${name}]`)
}

/**
 * Produce a colored, human-readable label for a Rolldown module format
 * (e.g. `[ESM]` in blue, `[CJS]` in yellow).
 *
 * @param format - The Rolldown internal module format to label.
 * @returns A colored format string suitable for console output.
 */
export function prettyFormat(format: InternalModuleFormat): string {
  const formatColor = format === 'es' ? blue : format === 'cjs' ? yellow : noop

  let formatText: string
  switch (format) {
    case 'es':
      formatText = 'ESM'
      break
    default:
      formatText = format.toUpperCase()
      break
  }

  return formatColor(`[${formatText}]`)
}

// Copied from https://github.com/antfu/vscode-pnpm-catalog-lens - MIT License
const colors = new Map<string, Ansis>()

/**
 * Return a stable {@linkcode Ansis} color function for {@linkcode name},
 * generating one deterministically from the name's hash when it has not been
 * seen before. The `'default'` name always maps to blue.
 *
 * @param [name] - Identifier whose color to retrieve or generate.
 * @returns An {@linkcode Ansis} color function for {@linkcode name}.
 */
export function generateColor(name: string = 'default'): Ansis {
  if (colors.has(name)) {
    return colors.get(name)!
  }
  let color: Ansis
  if (name === 'default') {
    color = blue
  } else {
    let hash = 0
    for (let i = 0; i < name.length; i++)
      // eslint-disable-next-line unicorn/prefer-code-point
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const hue = hash % 360
    const saturation = 35
    const lightness = 55
    color = rgb(...hslToRgb(hue, saturation, lightness))
  }
  colors.set(name, color)
  return color
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [r: number, g: number, b: number] {
  h %= 360
  h /= 360
  s /= 100
  l /= 100
  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [
    Math.max(0, Math.round(r * 255)),
    Math.max(0, Math.round(g * 255)),
    Math.max(0, Math.round(b * 255)),
  ]
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}
