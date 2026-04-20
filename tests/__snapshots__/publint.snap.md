## index.cjs

```cjs
//#region src/index.ts
const foo = 42;
//#endregion
module.exports = foo;

```

## index.d.cts

```cts
//#region src/index.d.ts
declare const foo = 42;
export = foo;
```

## index.d.mts

```mts
//#region src/index.d.ts
declare const foo = 42;
//#endregion
export { foo as default };
```

## index.mjs

```mjs
//#region src/index.ts
const foo = 42;
//#endregion
export { foo as default };

```
