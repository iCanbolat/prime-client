import { defineConfig, devices } from "@playwright/test"

/**
 * Uçtan uca testler MSW mock API'si açık dev server üzerinde koşar.
 * İlk kurulum: `pnpm exec playwright install chromium`
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    locale: "tr-TR",
  },
  projects: [
    // Masaüstü: iş akışları, erişilebilirlik, klavye
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobil\.spec\.ts/,
    },
    // Mobil: responsive düzen, menü, portal
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /(mobil|smoke)\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
})
