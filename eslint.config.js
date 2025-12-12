// @ts-check
import { sxzz } from '@sxzz/eslint-config'

export default sxzz(
  {
    pnpm: true,
    baseline: {
      ignoreFeatures: ['explicit-resource-management'],
    },
  },
  {
    files: ['templates/**'],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    rules: {
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
    },
  },
  // {
  //   files: ['docs/**/*.md/**'],
  //   rules: {
  //     'unicorn/prefer-node-protocol': 'off',
  //   },
  // },
)
