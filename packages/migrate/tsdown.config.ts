import type { UserConfig } from '../../src/config.ts'

const tsdownConfig = {
  name: 'migrate',
  entry: ['./src/{index,run}.ts'],
} satisfies UserConfig as UserConfig

export default tsdownConfig
