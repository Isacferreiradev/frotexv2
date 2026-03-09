import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
    readonly sidebar = this.page.locator('aside');

    // Direct logout button — inside sidebar, has span "Sair"
    readonly logoutButton = this.page.locator('aside button').filter({ hasText: 'Sair' });

    readonly statsCards = this.page.locator('.shadow-premium');

    async expectLoaded() {
        await expect(this.sidebar).toBeVisible({ timeout: 15000 });
    }

    /** Navigate by URL — more reliable than clicking sidebar links in auth-state tests */
    async goToCustomers() {
        await this.page.goto('/clientes');
        await this.page.waitForLoadState('networkidle');
    }

    async goToTools() {
        await this.page.goto('/ferramentas');
        await this.page.waitForLoadState('networkidle');
    }

    async goToRentals() {
        await this.page.goto('/locacoes');
        await this.page.waitForLoadState('networkidle');
    }

    async goToQuotes() {
        await this.page.goto('/orcamentos');
        await this.page.waitForLoadState('networkidle');
    }

    async logout() {
        await this.logoutButton.click();
    }
}
