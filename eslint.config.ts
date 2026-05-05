// See: https://eslint.org/docs/latest/use/configure/configuration-files
import js from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/coverage", "**/dist", "**/linter", "**/node_modules"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
      },

      ecmaVersion: 2023,
      sourceType: "module",

      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "__fixtures__/*.ts",
            "__tests__/*.ts",
            "eslint.config.ts",
            "vitest.config.ts",
            "rollup.config.ts"
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "tsconfig.json"
        }
      }
    },

    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
      "no-console": "off",
      "no-shadow": "off",
      "no-unused-vars": "off"
    }
  }
);
