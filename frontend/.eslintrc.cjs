module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "solid"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:solid/recommended",
  ],
  env: { browser: true, node: true, es2022: true },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "solid/reactivity": "off", // eslint-plugin-solid 0.13 crashes on TSAsExpression nodes
    "solid/prefer-for": "off", // chart components use .map() on static data (Plot color domains, legend items)
    "@typescript-eslint/ban-ts-comment": "warn", // existing @ts-ignore usage in component library
    "no-inner-declarations": "warn",
    "no-unsafe-finally": "off",
  },
  ignorePatterns: ["dist/", ".output/", ".vinxi/", "node_modules/"],
};
