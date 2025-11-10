module.exports = {
  root: true,
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  env: {
    node: true,
    browser: true,
    es2022: true
  },
  ignorePatterns: ["dist", ".turbo", "coverage"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier"
      ],
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn"
      }
    }
  ]
};
