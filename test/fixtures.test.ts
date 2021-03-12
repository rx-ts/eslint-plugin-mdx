import path from 'path'

import { ESLint } from 'eslint'

const cli = new ESLint({
  ignore: false,
  fix: true,
  useEslintrc: false,
  baseConfig: {
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    extends: ['plugin:mdx/recommended'],
    plugins: ['react', 'unicorn', 'prettier'],
    rules: {
      'mdx/code-block': 1,
      'unicorn/prefer-spread': 2,
    },
  },
})

describe('fixtures', () => {
  it('should match all snapshots', async () => {
    const results = await cli.lintFiles('test/fixtures/*.{md,mdx}')
    for (const { filePath, messages } of results) {
      expect(messages).toMatchSnapshot(path.basename(filePath))
    }
  })
})
