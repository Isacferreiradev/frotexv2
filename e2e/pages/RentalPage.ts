import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RentalPage extends BasePage {
    readonly addRentalButton = this.page.getByRole('button', { name: /nova locação|cadastrar locação/i }).or(this.page.getByRole('button', { name: /\+/i }));
    readonly customerSelect = this.page.locator('button[role="combobox"]').first();
    readonly toolSelect = this.page.locator('button[role="combobox"]').nth(1);
    readonly searchInput = this.page.locator('input[placeholder*="Pesquisar por código"]');
    readonly submitButton = this.page.getByRole('button', { name: /criar locação|finalizar/i });
    readonly confirmReturnButton = this.page.getByRole('button', { name: /confirmar retorno/i });

    async createSimpleRental(customerName: string, toolName: string) {
        await this.addRentalButton.first().click();

        // Select Customer
        await this.customerSelect.click();
        await this.page.getByRole('option', { name: customerName }).click();

        // Select Tool
        await this.toolSelect.click();
        await this.page.getByRole('option', { name: toolName }).click();

        await this.submitButton.click();

        // Wait for sheet to close
        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible();
    }

    async searchRental(query: string) {
        await this.searchInput.fill(query);
        await this.page.waitForTimeout(500);
    }

    async returnRental(rentalCode: string) {
        const row = this.page.locator('tr, .group').filter({ hasText: rentalCode }).first();
        await row.getByRole('button', { name: /devolver/i }).click();

        // Dialog should open
        await expect(this.page.locator('div[role="dialog"]')).toBeVisible();
        await this.confirmReturnButton.click();

        // Wait for dialog to close
        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible();
    }

    async cancelRental(rentalCode: string) {
        const row = this.page.locator('tr, .group').filter({ hasText: rentalCode }).first();
        const cancelBtn = row.locator('button').filter({ has: this.page.locator('svg.lucide-x') }).first();
        await cancelBtn.click();

        const confirmBtn = this.page.getByRole('button', { name: /confirmar|sim|cancelar/i });
        await confirmBtn.click();
    }

    async expectRentalCreated() {
        await expect(this.page).toHaveURL(/.*locacoes|.*rentals/);
    }
}
