import { test, expect } from '@playwright/test';

test.describe('Pages Render Smoke Tests', () => {
    test('Welcome page renders', async ({ page }) => {
        await page.goto('/');
        // Check main headings and cards
        await expect(page.locator('h1', { hasText: 'GravVPE' })).toBeVisible();
        await expect(page.locator('text=Fun Mode')).toBeVisible();
        await expect(page.locator('text=Pro Mode')).toBeVisible();
        await expect(page.locator('text=Video Mode')).toBeVisible();
    });

    test('Fun page renders', async ({ page }) => {
        await page.goto('/fun');
        // Check heading for Fun Mode
        await expect(page.locator('h1', { hasText: '🎮 Fun Mode' })).toBeVisible();
    });
});
