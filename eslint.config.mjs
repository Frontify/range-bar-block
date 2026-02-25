// @ts-check
import frontifyConfigReact from '@frontify/eslint-config-react';
import { defineConfig } from 'eslint/config';

export default defineConfig(frontifyConfigReact, {
    languageOptions: {
        parserOptions: {
            project: ['./tsconfig.json', './tsconfig.node.json'],
            tsconfigRootDir: import.meta.dirname,
        },
    },
});
