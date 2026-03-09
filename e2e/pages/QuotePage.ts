import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class QuotePage extends BasePage {
    readonly addQuoteButton = this.page.getByRole('button', { name: /novo orçamento|cadastrar orçamento/i }).or(this.page.getByRole('button', { name: /\+/i }));
    readonly customerSelect = this.page.locator('button[role="combobox"]').first();
    readonly startDateInput = this.page.locator('input[name="startDate"]');
    readonly endDateInput = this.page.locator('input[name="endDateExpected"]');
    readonly toolSelect = this.page.locator('button[role="combobox"]').nth(1);
    readonly nextStepButton = this.page.getByRole('button', { name: /próximo passo/i });
    readonly finalizeButton = this.page.getByRole('button', { name: /finalizar & gerar/i });

    async createSimpleQuote(customerName: string, toolName: string) {
        await this.addQuoteButton.first().click();

        // Step 1: Customer & Logistics
        await this.customerSelect.click();
        await this.page.getByRole('option', { name: customerName }).click();

        // Fill dates if needed (defaults usually work for today)
        await this.nextStepButton.click();

        // Step 2: Items
        await this.toolSelect.click();
        await this.page.getByRole('option', { name: toolName }).click();
        await this.nextStepButton.click();

        // Step 3: Finalization
        await this.finalizeButton.click();

        // Wait for completion
        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible();
    }

    async convertToRental(quoteCode: string) {
        const row = this.page.locator('tr, .group').filter({ hasText: quoteCode }).first();
        await row.getByRole('button', { name: /converter/i }).click();

        // Confirm conversion
        const confirmBtn = this.page.getByRole('button', { name: /confirmar|sim|converter/i });
        await confirmBtn.click();
    }

    async expectQuoteInList(quoteCode: string) {
        await expect(this.page.getByText(quoteCode).first()).toBeVisible();
    }
}
