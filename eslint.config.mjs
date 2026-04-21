// @ts-check
import frontifyConfigReact from '@frontify/eslint-config-react';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    frontifyConfigReact,
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        languageOptions: {
            globals: {
                ...globals.browser,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
        },
    },
]);
