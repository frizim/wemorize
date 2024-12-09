import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "none",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "@typescript-eslint/restrict-plus-operands": [
        "error",
        {
          "allowNumberAndString": true
        }
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          "allowNumber": true
        }
      ],
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-invalid-void-type": [
        "error",
        {
          allowAsThisParameter: true
        }
      ],
      },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts", "*.mjs", "*.js"]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    ignores: [
      "*.js",
      "*.d.ts"
    ]
  }
];