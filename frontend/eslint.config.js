import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // shadcn/ui pattern: components + variants (cva) live together;
      // this is not a fast-refresh bug, so keep it silent.
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Empty catches are used for background refreshes where the UI
      // already shows skeletons/empty states — keep them explicit.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
