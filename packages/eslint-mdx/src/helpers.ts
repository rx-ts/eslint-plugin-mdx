/// <reference path="../typings.d.ts" />

import type { Linter } from 'eslint'
import type { Position as ESPosition, SourceLocation } from 'estree'
import type { Position } from 'unist'

import type { Arrayable, JsxNode, ParserFn, ParserOptions } from './types'

export const FALLBACK_PARSERS = [
  '@typescript-eslint/parser',
  '@babel/eslint-parser',
  'babel-eslint',
  'espree',
] as const

export const JSX_TYPES = ['JSXElement', 'JSXFragment']

export const isJsxNode = (node: { type: string }): node is JsxNode =>
  JSX_TYPES.includes(node.type)

// eslint-disable-next-line sonarjs/cognitive-complexity
export const normalizeParser = (parser?: ParserOptions['parser']) => {
  if (parser) {
    if (typeof parser === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      parser = require(parser) as ParserOptions['parser']
    }

    if (typeof parser === 'object') {
      parser =
        ('parseForESLint' in parser && parser.parseForESLint) ||
        ('parse' in parser && parser.parse)
    }

    if (typeof parser !== 'function') {
      throw new TypeError(`Invalid custom parser for \`eslint-mdx\`: ${parser}`)
    }

    return [parser]
  }

  const parsers: ParserFn[] = []

  // try to load FALLBACK_PARSERS automatically
  for (const fallback of FALLBACK_PARSERS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const fallbackParser = require(fallback) as Linter.ParserModule
      /* istanbul ignore next */
      const parserFn =
        'parseForESLint' in fallbackParser
          ? // eslint-disable-next-line @typescript-eslint/unbound-method
            fallbackParser.parseForESLint
          : // eslint-disable-next-line @typescript-eslint/unbound-method
            fallbackParser.parse
      /* istanbul ignore else */
      if (parserFn) {
        parsers.push(parserFn)
      }
    } catch {}
  }

  return parsers
}

export interface BaseNode {
  type: string
  loc: SourceLocation
  range: [number, number]
  start?: number
  end?: number
}

export const normalizePosition = (loc: Position): Omit<BaseNode, 'type'> => {
  const start = loc.start.offset
  const end = loc.end.offset
  return {
    range: [start, end],
    loc,
    start,
    end,
  }
}

export const hasProperties = <T, P extends keyof T = keyof T>(
  obj: unknown,
  properties: Arrayable<P>,
): obj is T =>
  typeof obj === 'object' &&
  obj &&
  properties.every(property => property in obj)

export const getLinesFromCode = (code: string) => code.split('\n')

// fix #292
export const getLocFromRange = (
  lines: string[],
  [start, end]: [number, number],
): SourceLocation => {
  let offset = 0

  let startPos: ESPosition
  let endPos: ESPosition

  for (const [index, { length }] of lines.entries()) {
    const line = index + 1
    const nextOffset = offset + length

    if (nextOffset >= start) {
      startPos = {
        line,
        column: start - offset,
      }
    }

    if (nextOffset >= end) {
      endPos = {
        line,
        column: end - offset,
      }

      break
    }

    offset = nextOffset + 1 // add a line break `\n` offset
  }

  return {
    start: startPos,
    end: endPos,
  }
}

export const restoreNodeLocation = <T>(
  lines: string[],
  node: T,
  offset: number,
): T => {
  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      restoreNodeLocation(lines, value, offset)
    }
  }

  if (!hasProperties<BaseNode>(node, ['loc', 'range'])) {
    return node
  }

  const { range } = node

  const start = range[0] + offset
  const end = range[1] + offset

  return Object.assign(node, {
    start,
    end,
    range: [start, end],
    loc: getLocFromRange(lines, [start, end]),
  })
}

export const arrayify = <T, R = T extends Array<infer S> ? S : T>(
  ...args: T[]
) =>
  args.reduce<R[]>((arr, curr) => {
    arr.push(...(Array.isArray(curr) ? curr : curr == null ? [] : [curr]))
    return arr
  }, [])

export const first = <T>(items: T[] | readonly T[]) => items && items[0]

export const last = <T>(items: T[] | readonly T[]) =>
  items && items[items.length - 1]
