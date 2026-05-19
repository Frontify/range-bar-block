# Range Slider Block v2 — Change Log

## 1. Package Updates

| Package                               | Legacy (v1)       | New (v2)   |
| ------------------------------------- | ----------------- | ---------- |
| `@frontify/app-bridge`                | `3.0.0-beta.47`   | `^3.12.0`  |
| `@frontify/fondue`                    | `v12.0.0-beta.59` | `^13.1.3`  |
| `@frontify/guideline-blocks-settings` | `0.25.11`         | `^2.0.2`   |
| `react` / `react-dom`                 | `^17.0.2`         | `^18.2.0`  |
| `typescript`                          | `4.9.5`           | `^5.9.3`   |
| `eslint`                              | `8.34.0`          | `^9.39.3`  |
| `prettier`                            | `2.8.4`           | `^3.8.1`   |
| `@frontify/frontify-cli`              | `5.3.9`           | `^5.10.1`  |
| `@frontify/eslint-config-react`       | `0.15.5`          | `^1.0.11`  |
| `@types/react`                        | `17.0.50`         | `^18.3.28` |

Additional changes:

- Added `"type": "module"` to package.json
- Added `zustand` as a peer dependency (required by app-bridge)
- Added `deploy`, `lint`, `lint:fix`, `typecheck` scripts
- Added `"overrides": { "@udecode/plate-common": "31.3.2" }` — pins the version to resolve a dependency conflict introduced by `@frontify/fondue` v13 transitive deps, otherwise `npm install` fails.

### Vulnerabilities

|           | Legacy (v1) | New (v2) |
| --------- | ----------- | -------- |
| Critical  | 1           | 0        |
| High      | 74          | 22       |
| Moderate  | 14          | 3        |
| Low       | 4           | 0        |
| **Total** | **93**      | **25**   |

---

## 2. Functionality Changes

### 2.1 Fondue v13 API migration

- `TextInput.onChange` signature changed from `(value: string) => void` to `(e: ChangeEvent<HTMLInputElement>) => void`.
- Button API: `onClick` → `onPress`; icons passed as **children** instead of `icon` prop.
- Removed Fondue enum imports (`ButtonEmphasis`, `ButtonRounding`, `ButtonSize`, `ButtonStyle`, `ButtonType`, `TextInputType`, `DropdownSize`, `MultiInputLayout`) — replaced with string literals.
- `Color` type moved from `@frontify/fondue` to a local `RgbaColor` type in `helpers.ts` (no longer depends on fondue for types).

### 2.2 Per-row value label at handle position

Each slider row now has a `label` field displayed directly under the slider handle.

- **Edit mode:** a `TextInput` (placeholder "Label") centered under the indicator, allowing the editor to set descriptive text per slider.
- **View mode:** a `<span>` positioned at the handle's computed position (`left: ${maxPos + offset}%`), hidden when empty.
- New setting: `showValueLabel` (switch, default `true`) — toggles label visibility for the entire block.

### 2.3 Percentage input for slider value

A numeric percentage input field is displayed in edit mode (bottom-right of each row), allowing direct entry of the slider value (0–100) instead of only dragging. Includes validation with error feedback ("0 – 100").

| Before                 | After                             |
| ---------------------- | --------------------------------- |
| Only drag to set value | Drag **or** type exact percentage |

### 2.4 CSS scoping via `data-range-slider-block`

- Root `<div>` receives `data-range-slider-block={blockId}` (and `data-block-id={blockId}`) from `appBridge.context('blockId').get()`.
- A custom PostCSS plugin (`postcss/scope.cjs`) prefixes all global CSS selectors with `[data-range-slider-block]`, scoping both authored styles and any dependency CSS that passes through the bundle.
- CSS module styles (`.container`, `.sliderRow`, etc.) remain locally scoped by PostCSS Modules as-is.

### 2.5 Improved layout and overflow handling

- Labels (left/right) in view mode use `text-overflow: ellipsis` with constrained `max-width` to prevent layout breakage on long text.
- Editing inputs use flex-based layout (`inputSide`, `inputCenter`) instead of the legacy `Stack` component with fixed percentages.
- Proper spacing via `gap` instead of inline `margin`/`minWidth`/`maxWidth` style hacks.
