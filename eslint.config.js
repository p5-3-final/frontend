// 규칙 세트와 이 레포 규칙의 대응은 .claude/rules/lint.md에 있다. 규칙을 끄거나 warn으로 낮추지 않는다.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  // lint.md 설정 단위 예외: 생성 코드(OpenAPI 타입, MSW 워커)는 검사하지 않는다.
  {
    ignores: [
      "dist",
      "coverage",
      "playwright-report",
      "test-results",
      ".service-contracts",
      "src/api/generated",
      "mocks/public/mockServiceWorker.js",
    ],
  },
  js.configs.recommended,
  // 타입 기반 규칙은 TypeScript 파일에만 건다. 설정 파일(eslint.config.js)은 타입 정보가 없다.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
      ],
      "no-console": "error",
    },
  },
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { node: { extensions: [".ts", ".tsx", ".js"] } },
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "page", pattern: "src/pages" },
        { type: "feature", pattern: "src/features/*", capture: ["featureName"] },
        { type: "shared", pattern: "src/shared" },
        { type: "api-generated", pattern: "src/api/generated" },
      ],
    },
    rules: {
      // import 방향: app → pages → features → shared. feature끼리는 상대의 index.ts로만 import한다.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { types: { anyOf: ["app", "page", "shared"] } } } },
            },
            {
              from: { element: { types: { anyOf: ["app", "page"] } } },
              allow: { to: { element: { type: "feature", fileInternalPath: "index.ts" } } },
            },
            {
              from: { element: { type: "page" } },
              allow: { to: { element: { types: { anyOf: ["page", "shared"] } } } },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    captured: { featureName: "{{from.captured.featureName}}" },
                  },
                },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: { element: { types: { anyOf: ["shared", "api-generated"] } } },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: "feature", fileInternalPath: "index.ts" } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { types: { anyOf: ["shared", "api-generated"] } } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    ...testingLibrary.configs["flat/react"],
  },
  {
    files: ["*.config.{js,ts}", "tests/**/*.ts", "mocks/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
