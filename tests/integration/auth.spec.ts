import { test, expect } from '@playwright/test';

test.describe('Integration - Auth Checks', () => {
    test('Unauthorized user sees login prompt on /pro', async ({ page }) => {
        await page.goto('/pro');
        await expect(page.locator('text=Вы должны войти в систему для доступа к этому разделу')).toBeVisible();
        await expect(page.locator('button', { hasText: /Google/i }).or(page.locator('text=Войти'))).toBeVisible();
    });

    test('Unauthorized user sees login prompt on /video', async ({ page }) => {
        await page.goto('/video');
        await expect(page.locator('text=Вы должны войти в систему для доступа к этому разделу')).toBeVisible();
        await expect(page.locator('button', { hasText: /Google/i }).or(page.locator('text=Войти'))).toBeVisible();
    });
});
