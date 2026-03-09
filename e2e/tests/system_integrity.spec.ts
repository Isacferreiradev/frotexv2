import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerPage } from '../pages/CustomerPage';
import { ToolPage } from '../pages/ToolPage';

test.describe('System Wide Integrity & UX', () => {
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should validate dashboard loads stats section', async ({ page }) => {
        // Verify sidebar and key sections are visible
        await expect(page.locator('aside')).toBeVisible();
        // Check for any heading referencing dashboard content
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate between pages without errors', async ({ page }) => {
        const toolPage = new ToolPage(page);

        await page.goto('/ferramentas');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*ferramentas/);

        await page.goto('/clientes');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*clientes/);

        await page.goto('/locacoes');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*locacoes/);
    });

    test('should render sidebar correctly on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const sidebar = page.locator('aside');
        await expect(sidebar).toBeVisible();

        // Nav items should be visible
        await expect(page.locator('#tour-nav-ferramentas')).toBeVisible();
        await expect(page.locator('#tour-nav-clientes')).toBeVisible();
    });
});
