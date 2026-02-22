import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/entry-*.tsx",
        "src/test/**",
        "tests/**",
        "src/routes/api/**",
        ".output/**",
        ".vinxi/**",
        ".solid/**",
        ".eslintrc.cjs",
        "src/lib/animation/**",
        "src/routes/(private)/components/**",
        "**/molecules/Charts/**",
        "**/molecules/PlotGraph/**",
        "**/molecules/GeoPlot/**",
        "**/molecules/Canvas3D/**",
        "**/molecules/VideoRecorder/**",
        "**/molecules/SortableList/**",
        "**/molecules/Dropzone/**",
        "**/molecules/DatePicker/**",
        "**/molecules/TimePicker/**",
        "**/atoms/Calendar.tsx",
        "**/atoms/Slider.tsx",
        "**/atoms/AgGrid/**",
      ],
      thresholds: {
        statements: 80,
        branches: 84,
        functions: 77,
        lines: 80,
      },
    },
  },
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": "/src",
    },
  },
});
