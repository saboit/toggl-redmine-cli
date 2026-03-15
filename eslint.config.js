import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"] },
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat["jsx-runtime"],
    languageOptions: {
      ...pluginReact.configs.flat["jsx-runtime"].languageOptions,
      globals: globals.node,
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    plugins: { "react-hooks": pluginReactHooks },
    rules: pluginReactHooks.configs.recommended.rules,
  },
  {
    rules: {
      // React must be in scope with jsx:"react" transform — suppress the false unused-var positive.
      // Also allow _-prefixed vars/args to mark intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^(React|_)",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Downgrade to warn: many API calls use `as any` due to imperfect generated types
      "@typescript-eslint/no-explicit-any": "warn",
      // Requires ES2022 Error cause — incompatible with this project's ES2020 target
      "preserve-caught-error": "off",
    },
  },
);
