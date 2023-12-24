import { createRequire } from 'node:module'

import type { ESLint, Linter } from 'eslint'

import { base } from './base'

const overrides: Linter.ConfigOverride[] = [
  {
    files: ['*.md', '*.mdx'],
    extends: 'plugin:mdx/overrides',
    ...base,
  },
  {
    files: '**/*.{md,mdx}/**',
    extends: 'plugin:mdx/code-blocks',
  },
]

export const recommended: Linter.Config = {
  overrides,
}

// hack to bypass syntax error for commonjs
const getImportMetaUrl = () =>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  new Function('return import.meta.url')() as string

const cjsRequire =
  typeof require === 'undefined' ? createRequire(getImportMetaUrl()) : require

const addPrettierRules = () => {
  try {
    cjsRequire.resolve('prettier')

    const { meta } = cjsRequire('eslint-plugin-prettier') as ESLint.Plugin
    const version = meta?.version || ''

    /**
     * @see https://github.com/prettier/eslint-plugin-prettier/releases/tag/v5.1.2
     */
    const [major, minor, patch] = version.split('.')

    if (
      +major > 5 ||
      (+major === 5 &&
        (+minor > 1 || (+minor === 1 && Number.parseInt(patch) >= 2)))
    ) {
      return
    }

    overrides.push(
      {
        files: '*.md',
        rules: {
          'prettier/prettier': [
            'error',
            {
              parser: 'markdown',
            },
          ],
        },
      },
      {
        files: '*.mdx',
        rules: {
          'prettier/prettier': [
            'error',
            {
              parser: 'mdx',
            },
          ],
        },
      },
    )
  } catch {}
}

addPrettierRules()
