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
    // Showcase/chart code and third-party bindings (Plot, D3, GSAP) rely on any.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // Evaluated eslint-plugin-solid@0.14.5 (A2): no TSAsExpression crash (0.13 bug fixed).
    // Re-enabling yields 22 warnings — false positives in imperative chart code (BarRace),
    // stable auto-generated IDs (Input/NumberInput), and render-prop APIs (MenuTrigger).
    // Fixing would add wrapper noise without runtime benefit; revisit on major UI refactors.
    "solid/reactivity": "off",
    // Observable Plot color domains and legend items are static arrays, not reactive lists.
    "solid/prefer-for": "off",
    // Two @ts-expect-error usages (gsap plugins, streaming duplex) — warn to flag new ones.
    "@typescript-eslint/ban-ts-comment": "warn",
    // D3/chart modules use function declarations inside callbacks for hoisting clarity.
    "no-inner-declarations": "warn",
    // No current violations; off avoids TS-eslint 8 noise on intentional finally/return patterns.
    "no-unsafe-finally": "off",
  },
  ignorePatterns: ["dist/", ".output/", ".vinxi/", "node_modules/"],
};
