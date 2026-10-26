import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 60000,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: process.env.ESPO_URL || 'http://localhost:8080',
        viewport: { width: 1400, height: 900 },
        launchOptions: process.env.SMART_FILTER_CHROMIUM
            ? { executablePath: process.env.SMART_FILTER_CHROMIUM, args: ['--no-sandbox'] }
            : {},
    },
});
