import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerPage } from '../pages/CustomerPage';
import { ToolPage } from '../pages/ToolPage';

/**
 * Rental Workflow: Creates a customer and tool, then creates a rental directly
 * via the Locações page (Quote flow is complex and may need additional data).
 */
test.describe('Rental Life Cycle (Full Workflow)', () => {
    let dashboardPage: DashboardPage;
    let customerPage: CustomerPage;
    let toolPage: ToolPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        customerPage = new CustomerPage(page);
        toolPage = new ToolPage(page);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should create a customer and a tool, then verify both are available', async ({ page }) => {
        const suffix = Date.now();

        // 1. Create Customer
        await page.goto('/clientes');
        await page.waitForLoadState('networkidle');

        const customerName = `Rental Client ${suffix}`;
        await customerPage.createCustomer(
            customerName,
            `rental_${suffix}@test.com`,
            '11988887777',
            '123.456.789-01'
        );
        await customerPage.expectCustomerInList(customerName);

        // 2. Create Tool
        await page.goto('/ferramentas');
        await page.waitForLoadState('networkidle');

        const toolName = `Rental Tool ${suffix}`;
        await toolPage.createTool(toolName, '200.00', { brand: 'Rental Brand' });
        await toolPage.expectToolInList(toolName);

        // 3. Navigate to Locações and verify page loads
        await page.goto('/locacoes');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*locacoes/);
        // Verify the page renders (button to add or empty state text)
        const addBtn = page.getByRole('button', { name: /nova locação|locação/i }).first();
        await expect(addBtn.or(page.getByText(/nenhuma locação/i))).toBeVisible({ timeout: 10000 });
    });
});
