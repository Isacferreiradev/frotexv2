import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { ToolPage } from '../pages/ToolPage';

test.describe('Tool Detailed Management (Inventory Deep Dive)', () => {
    let dashboardPage: DashboardPage;
    let toolPage: ToolPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        toolPage = new ToolPage(page);

        await page.goto('/ferramentas');
        await page.waitForLoadState('networkidle');
    });

    test('should validate tool creation with technical and financial fields', async ({ page }) => {
        const toolName = `Drill E2E ${Date.now()}`;

        await toolPage.createTool(toolName, '250.00', {
            brand: 'DeWalt',
            model: 'DCD996',
            serialNumber: `SN-${Date.now()}`,
            assetTag: `PAT-${Date.now().toString().slice(-5)}`,
            acquisitionCost: '1800.00',
            notes: 'Equipamento premium para perfuração.'
        });

        await toolPage.expectToolInList(toolName);
    });

    test('should handle category creation and tool listing', async ({ page }) => {
        const toolName = `Cat Tool ${Date.now()}`;

        // Open add tool sheet  
        await toolPage.addToolButton.first().click();
        await expect(page.locator('div[role="dialog"]')).toBeVisible({ timeout: 10000 });

        // Fill minimum required fields
        await toolPage.nameInput.fill(toolName);

        // Handle category
        const categoryTrigger = page.getByRole('combobox').first();
        await categoryTrigger.click();

        const options = page.getByRole('option');
        const count = await options.count();
        if (count > 0) {
            await options.first().click();
        }

        await toolPage.dailyRateInput.fill('100');
        await toolPage.submitButton.click();

        await toolPage.expectToolInList(toolName);
    });

    test('should perform tool edit and removal', async ({ page }) => {
        const toolName = `Edit Tool ${Date.now()}`;
        const newName = `Edited Tool ${Date.now()}`;

        await toolPage.createTool(toolName, '50');
        await toolPage.searchTool(toolName);
        await toolPage.expectToolInList(toolName);

        await toolPage.editTool(toolName, newName);
        await toolPage.searchTool(newName);
        await toolPage.expectToolInList(newName);

        await toolPage.deleteTool(newName);
    });
});
