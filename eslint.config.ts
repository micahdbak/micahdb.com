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
  }/*,
  {
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "class", "format": ["PascalCase"] },
        { "selector": "property", "format": ["snake_case"] },
        { "selector": "property", "modifiers": ["readonly"], "format": ["UPPER_CASE"] },
        { "selector": "variable", "format": ["snake_case"] }
        { "selector": "variable", "modifiers": ["const", "global"], "format": ["UPPER_CASE"] },
      ]
    }
  }*/
]);
