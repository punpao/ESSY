import turbo from "eslint-config-turbo";
import prettier from "eslint-config-prettier";

export default [
  ...turbo,
  prettier,
  {
    rules: {
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
];
