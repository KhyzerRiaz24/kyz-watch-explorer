import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';
const token = process.env.KYZ_E2E_TOKEN || randomBytes(32).toString('hex');
process.env.KYZ_E2E_TOKEN = token;
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4181',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4181/api/health',
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: '4181',
      HOST: '127.0.0.1',
      DATABASE_PATH: 'data/e2e.sqlite',
      ADMIN_TOKEN: token,
      OPENAI_API_KEY: '',
      OPENAI_MODEL: '',
    },
  },
});
