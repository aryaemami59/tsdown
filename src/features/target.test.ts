import { expect, test } from 'vitest'
import { expandBaselineTarget, resolvePackageTarget } from './target.ts'

test('expandBaselineTarget', () => {
  expect(expandBaselineTarget(['baseline-widely-available'])).toEqual([
    'chrome118',
    'edge118',
    'firefox119',
    'safari17',
    'ios17',
  ])

  expect(expandBaselineTarget(['es2020'])).toEqual(['es2020'])

  expect(expandBaselineTarget(['node18', 'baseline-widely-available'])).toEqual(
    ['node18', 'chrome118', 'edge118', 'firefox119', 'safari17', 'ios17'],
  )
})

test('resolvePackageTarget', () => {
  expect(testVersion('>= 14')).toMatchInlineSnapshot(`"node14.0.0"`)
  expect(testVersion('^16')).toMatchInlineSnapshot(`"node16.0.0"`)
  expect(testVersion('>=0.10.3 <15')).toMatchInlineSnapshot(`"node0.10.3"`)
  expect(testVersion('>15')).toMatchInlineSnapshot(`"node16.0.0"`)
  expect(testVersion('<22')).toMatchInlineSnapshot(`undefined`)
  expect(testVersion('^12.22.0 || ^14.17.0 || >=16.0.0')).toMatchInlineSnapshot(
    `"node12.22.0"`,
  )

  function testVersion(version: string) {
    return resolvePackageTarget({ engines: { node: version } })
  }
})
