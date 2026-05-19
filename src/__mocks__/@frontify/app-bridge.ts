import { vi } from 'vitest';

// These are overridden per-test in Block.test.tsx via module-level let bindings.
// We export mutable references that test files can replace.

export const useBlockSettings = vi.fn(() => [{}, vi.fn().mockResolvedValue(undefined)]);
export const useEditorState = vi.fn(() => false);

// Minimal Color type re-export so typed imports don't break
export type Color = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    name?: string;
};

export type BlockProps = {
    appBridge: unknown;
};
