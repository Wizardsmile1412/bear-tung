import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            include: ["src/domain/**", "src/components/**", "src/app/dashboard/**"],
            thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
        },
    },
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
