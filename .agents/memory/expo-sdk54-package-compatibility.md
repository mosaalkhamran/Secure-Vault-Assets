---
name: Expo SDK 54 package compatibility
description: Which packages crash in Expo Go SDK 54 and the correct versions / alternatives
---

## The rule
When adding Expo packages to an SDK 54 project with `pnpm add`, always pin to the SDK-compatible version. Running `pnpm add expo-X` without a version installs the latest (e.g. v57), which requires native modules NOT bundled in the SDK 54 Expo Go binary — causing immediate runtime crashes.

## Correct SDK 54 versions (pin these)
| Package | Pin |
|---|---|
| expo-secure-store | `~15.0.8` |
| expo-local-authentication | `~17.0.8` |
| expo-file-system | `~19.0.23` |
| expo-clipboard | `~8.0.8` |
| expo-crypto | ❌ **Do not use** (see below) |

## expo-crypto — do not use in Expo Go SDK 54
`expo-crypto@15.x` (the expected version) crashes with `Cannot find native module 'ExpoCryptoAES'` because Expo Go for SDK 54 does not bundle the AES native module.

**Fix:** Use `js-sha256` (pure JS, no native modules):
```ts
import { sha256 } from 'js-sha256';
const hash = sha256(`salt_${value}`); // synchronous, returns hex string
```

## global.crypto.subtle — also unavailable in SDK 54 Expo Go
Hermes in SDK 54's Expo Go does not expose `global.crypto.subtle`. Calling it throws:
`TypeError: Cannot read property 'subtle' of undefined`

Use `js-sha256` instead (pure JS, works everywhere).

**Why:** These are Expo Go binary limitations — a full development build (EAS Build) would have all native modules and the full Hermes with crypto.subtle. In Expo Go, only the modules bundled into the binary for that SDK version are available.

**How to apply:** Any time you add crypto/hashing to a Vaultora feature, use `js-sha256` directly. If the project is ever migrated to a development build, feel free to revisit native crypto.
