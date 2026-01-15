import type { UserConfig as InnerUserConfig } from 'tsdown'

type AnyNonNullishValue = NonNullable<unknown>

type Simplify<BaseType> = BaseType extends
  | ((...args: never[]) => unknown)
  | (abstract new (...args: never[]) => unknown)
  | (new (...args: never[]) => unknown)
  ? BaseType
  : AnyNonNullishValue & {
      [KeyType in keyof BaseType]: NonNullable<BaseType[KeyType]> extends (
        ...args: never[]
      ) => unknown
        ? never
        : NonNullable<Required<BaseType>[KeyType]> extends Partial<
              Record<string, any>
            >
          ? Simplify<BaseType[KeyType]>
          : BaseType[KeyType]
    }

export type UserConfig = Simplify<InnerUserConfig>
const element: UserConfig = {}
element satisfies InnerUserConfig
// export type UserConfig = Simplify<Partial<Simplify<Required<InnerUserConfig>>>>
