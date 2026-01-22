import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "generated/**",
      "src/generated/**",
      "dist/**",
      "bot/dist/**",
      "temp_extract/**",
      "scripts/**",
      "temp/**",
      "downloads/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@next/next": nextPlugin,
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  eslintConfigPrettier,
);
