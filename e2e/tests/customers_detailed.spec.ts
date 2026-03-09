import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerPage } from '../pages/CustomerPage';

test.describe('Customer Detailed Management (CRM Deep Dive)', () => {
    let dashboardPage: DashboardPage;
    let customerPage: CustomerPage;

    test.beforeEach(async ({ page }) => {
        dashboardPage = new DashboardPage(page);
        customerPage = new CustomerPage(page);

        await page.goto('/clientes');
        await page.waitForLoadState('networkidle');
    });

    test('should validate required fields on empty form submit', async ({ page }) => {
        await customerPage.addCustomerButton.first().click();

        // Wait for the dialog to open
        await expect(page.locator('div[role="dialog"]')).toBeVisible({ timeout: 10000 });

        // Try empty submit
        await customerPage.submitButton.click();

        // Expect validation errors
        const errors = page.locator('p[class*="text-red"], p[class*="destructive"], [class*="error"]');
        await expect(errors.first()).toBeVisible({ timeout: 5000 });
    });

    test('should perform full CRUD: Create, Search, Edit, Delete', async ({ page }) => {
        const customerName = `E2E Client ${Date.now()}`;
        const updatedName = `${customerName} EDITED`;

        // 1. Create
        await customerPage.createCustomer(
            customerName,
            'e2eclient@test.com',
            '11999999999',
            '123.456.789-01'
        );

        // 2. Search and verify
        await customerPage.searchCustomer(customerName);
        await customerPage.expectCustomerInList(customerName);

        // 3. Edit
        await customerPage.editCustomer(customerName, updatedName);
        await customerPage.searchCustomer(updatedName);
        await customerPage.expectCustomerInList(updatedName);

        // 4. Delete
        await customerPage.deleteCustomer(updatedName);
    });

    test('should show empty state for non-existent search query', async ({ page }) => {
        await customerPage.searchCustomer('XYZNOTEXISTENTCLIENT9999');

        // Either empty state text or no results text
        const emptyState = page.getByText(/nenhum cliente|sem resultados|não encontrado/i);
        await expect(emptyState).toBeVisible({ timeout: 8000 });
    });
});
