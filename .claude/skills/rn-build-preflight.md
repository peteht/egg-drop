---
name: rn-build-preflight
description: Check React Native / Expo project configuration before triggering an EAS build. Use before every production build submission. Catches version mismatches, missing config files, and stale caches that cause cryptic Xcode or Hermes build failures — problems that waste 20+ minutes per failed build cycle.
---

# React Native Build Preflight

A failed EAS build costs 15-30 minutes. Most failures are predictable from the project config before a single byte is uploaded. Run this check first.

## Checks

### 1. Package version alignment
Run `npx expo install --fix` and verify it reports no changes. If it changes anything, commit those changes before building — mismatched versions cause Hermes bytecode compilation errors, pod version conflicts, and Metro bundler failures that are hard to diagnose from the Xcode log.

Specifically verify:
- `expo` version matches `react-native` version in `node_modules/expo/bundledNativeModules.json`
- `babel-preset-expo` major version matches the Expo SDK major version
- `jest-expo` major version matches the Expo SDK major version

### 2. Required config files
- `babel.config.js` exists and uses `babel-preset-expo`
- `metro.config.js` exists (even if minimal) — absence causes silent bundler misconfiguration on EAS servers
- `eas.json` exists and has a `production` build profile
- `app.json` has `ios.bundleIdentifier` set — building without it fails late in the process

### 3. Cache hygiene
If the previous build failed with Hermes errors (`private properties are not supported`, `cannot find module`, unexpected bytecode errors), add `"cache": { "disabled": true }` to the production profile in `eas.json` before retrying. Stale CocoaPods caches on EAS servers can bundle the wrong Hermes version.

### 4. TypeScript
Run `npx tsc --noEmit`. Build failures from type errors are the slowest possible way to find them.

### 5. Bundle smoke test
Run `npx expo export --platform ios --output-dir /tmp/preflight-check` locally. If Metro can't bundle the app, EAS can't either. This catches missing imports, bad requires, and circular dependencies in under a minute.

## Call

- **Blocking:** version mismatch detected; missing babel.config.js or metro.config.js; TypeScript errors; bundle export fails.
- **Should fix:** `eas.json` cache not disabled after a previous Hermes failure; bundleIdentifier not set.
- **Note:** any package with a major version ahead of the Expo SDK (may work now, may not on next build).
