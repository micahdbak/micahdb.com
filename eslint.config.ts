import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "default", "format": ["snake_case"] },
        { "selector": "import", "format": null },
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "enum", "format": ["PascalCase"] },
        { "selector": "enumMember", "format": ["UPPER_CASE"] },
        { "selector": "typeAlias", "format": ["PascalCase"] },
        { "selector": "class", "format": ["PascalCase"] },
        { "selector": "property", "modifiers": ["readonly"], "format": ["UPPER_CASE"] },
        { "selector": "method", "format": ["camelCase"] },
        { "selector": "variable", "modifiers": ["const", "global"], "format": ["UPPER_CASE"] }
      ]
    }
  }
]);
