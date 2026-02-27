import { test, expect } from '@playwright/test';

test.describe('Integration - Billing Access Control', () => {

    test('User without Pro access sees Paywall on /pro', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('token', 'fake-jwt-token');
            window.localStorage.setItem('user', JSON.stringify({
                id: '1',
                email: 'test@example.com',
                name: 'Free User',
                isPro: false
            }));
        });

        await page.goto('/pro');

        // Check for Paywall visibility
        await expect(page.locator('text=Откройте возможности Pro')).toBeVisible();
        await expect(page.locator('button', { hasText: 'Оплатить доступ' })).toBeVisible();
    });

    test('User with Pro access can successfully access /pro', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('token', 'fake-jwt-token');
            window.localStorage.setItem('user', JSON.stringify({
                id: '1',
                email: 'test@example.com',
                name: 'Pro User',
                isPro: true
            }));
        });

        await page.goto('/pro');

        // Paywall should NOT be visible
        await expect(page.locator('text=Откройте возможности Pro')).toBeHidden();

        // Page content should render (we check for a logout or Pro Mode specific element if available)
        await expect(page.locator('h1', { hasText: '⚡ Pro Mode' })).toBeVisible();
    });
});
