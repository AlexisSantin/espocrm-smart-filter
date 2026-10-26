import { test, expect } from '@playwright/test';

const USERNAME = process.env.ESPO_USERNAME;
const PASSWORD = process.env.ESPO_PASSWORD;

test.beforeAll(() => {
    if (!USERNAME || !PASSWORD) {
        throw new Error('Set ESPO_USERNAME and ESPO_PASSWORD to run the Smart Filter tests.');
    }
});

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#field-userName', USERNAME);
    await page.fill('#field-password', PASSWORD);
    await page.click('#btn-login');
    await page.waitForLoadState('networkidle');

    await page.goto('/#Contact');
    await page.waitForSelector('button.add-filter-button');
    await page.waitForLoadState('networkidle');
});

test('shows the filter icon instead of the ellipsis', async ({ page }) => {
    await expect(page.locator('button.add-filter-button > span.fa-filter')).toHaveCount(1);
    await expect(page.locator('button.add-filter-button > span.fa-ellipsis-v')).toHaveCount(0);
});

test('keeps the field menu open after adding a filter', async ({ page }) => {
    await page.click('button.add-filter-button');
    await page.click('ul.filter-list a[data-name="assignedUser"]');

    await expect(page.locator('.advanced-filters > .filter[data-name="assignedUser"]')).toBeVisible();
    await expect(page.locator('ul.filter-list')).toBeVisible();
});

test('quick search narrows the field list', async ({ page }) => {
    await page.click('button.add-filter-button');
    await page.locator('input.field-filter-quick-search-input').pressSequentially('assign');

    const visible = page.locator('ul.filter-list li.filter-item:not(.search-hidden)');
    await expect(visible.filter({ hasText: 'Assigned User' })).toHaveCount(1);
    await expect(visible).not.toHaveCount(13);
});

test('hides the reset button when no filter is set', async ({ page }) => {
    await expect(page.locator('.smart-filters-reset')).toBeHidden();
});

test('applies a text search automatically without an Apply button', async ({ page }) => {
    const searchRequest = page.waitForResponse(
        response => response.url().includes('/api/v1/Contact') && response.url().includes('smartfiltertest')
    );

    await page.fill('input.text-filter', 'smartfiltertest');
    await page.press('input.text-filter', 'Enter');

    await searchRequest;
    await expect(page.locator('.smart-filters-counter')).toHaveCount(1);
    await expect(page.locator('.smart-filters-reset')).toBeVisible();
});
