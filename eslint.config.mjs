// ESLint 9+ flat config
// 启用前请先安装：npm install -D eslint @eslint/js typescript-eslint eslint-plugin-vue
import js from "@eslint/js";
// import tseslint from "typescript-eslint";
// import pluginVue from "eslint-plugin-vue";

export default [
  js.configs.recommended,
  // tseslint.configs.recommended,
  // ...pluginVue.configs["flat/recommended"],
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist_electron/**",
      "build/**",
      ".next/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,vue}"],
    rules: {
      "no-console": "off",
      "no-debugger": "warn",
    },
  },
];
