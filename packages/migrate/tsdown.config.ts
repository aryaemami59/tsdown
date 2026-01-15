import type { UserConfig } from '../../src/config.ts'

const tsdownConfig = {
  name: 'migrate',
  entry: ['./src/{index,run}.ts'],
  exports: {
    bin: true,
  },
} satisfies UserConfig as UserConfig

export default tsdownConfig
