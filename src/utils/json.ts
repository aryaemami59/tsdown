import { readFileSync, writeFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

/**
 * Write {@linkcode content} as JSON to {@linkcode filePath}, preserving the
 * indentation style and line endings of any existing file. The file is left
 * untouched when its current contents are deeply equal to {@linkcode content}.
 *
 * @param filePath - Destination path for the JSON file.
 * @param content - Value to serialize and write.
 */
export function writeJsonFile(filePath: string, content: unknown): void {
  let originalText: string | undefined
  let originalJson: unknown = undefined
  let originalIndent: string | number = 2
  let originalEOL: string = '\n'
  let originalHasTrailingNewline: boolean = false

  try {
    originalText = readFileSync(filePath, 'utf8')
    originalJson = JSON.parse(originalText)
    originalIndent = detectIndentation(originalText)
    if (originalText.includes('\r\n')) {
      originalEOL = '\r\n'
    }
    if (originalText.endsWith('\n')) {
      originalHasTrailingNewline = true
    }
  } catch {
    // File doesn't exist or isn't valid JSON, we'll overwrite it with our content
  }

  if (
    originalJson &&
    (isDeepStrictEqual(originalJson, content) ||
      JSON.stringify(originalJson) === JSON.stringify(content))
  ) {
    // The content is the same. We just return without updating the file format
    return
  }

  let jsonString = JSON.stringify(content, null, originalIndent)
  if (originalEOL !== '\n') {
    jsonString = jsonString.replaceAll('\n', originalEOL)
  }
  if (originalHasTrailingNewline) {
    jsonString += originalEOL
  }

  if (originalText === jsonString) return
  writeFileSync(filePath, jsonString, 'utf8')
}

/**
 * Detect the indentation style used in a JSON string by inspecting the
 * first indented line.
 *
 * @param jsonText - Raw JSON text to analyze.
 * @returns A tab character (`'\t'`), the number of spaces used, or `2` as a fallback when no indented line is found.
 */
export function detectIndentation(jsonText: string): string | number {
  const lines = jsonText.split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^(\s+)\S/)
    if (!match) continue

    if (match[1].includes('\t')) {
      return '\t'
    }
    return match[1].length
  }

  return 2
}
