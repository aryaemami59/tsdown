import type { UserConfig } from '../../src/config.ts'

const tsdownConfig = {
  entry: ['./src/{index,run}.ts'],
} satisfies UserConfig as UserConfig

export default tsdownConfig
