import type { UserConfig as TsdownUserConfig } from '../src/index.ts'

type AnyNonNullishValue = NonNullable<unknown>

type Simplify<BaseType> = BaseType extends
  | ((...args: never[]) => unknown)
  | (abstract new (...args: never[]) => unknown)
  | (new (...args: never[]) => unknown)
  ? BaseType
  : AnyNonNullishValue & {
      [KeyType in keyof BaseType]: NonNullable<
        Required<BaseType>[KeyType]
      > extends (...args: never[]) => unknown
        ? never
        : { enabled?: boolean } extends BaseType[KeyType]
          ? Simplify<BaseType[KeyType]>
          : NonNullable<BaseType[KeyType]> extends NonNullable<
                BaseType[KeyType]
              >[]
            ? Simplify<BaseType[KeyType] | BaseType[KeyType][]>
            : BaseType[KeyType]
    }

export type UserConfig = Simplify<Simplify<Simplify<TsdownUserConfig>>>
