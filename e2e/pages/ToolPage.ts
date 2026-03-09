import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ToolPage extends BasePage {
    readonly addToolButton = this.page.getByRole('button', { name: /novo item|nova ferramenta|cadastrar ferramenta/i }).or(this.page.getByRole('button', { name: /\+/i }));
    readonly nameInput = this.page.locator('input[id="name"]');
    readonly brandInput = this.page.locator('input[id="brand"]');
    readonly modelInput = this.page.locator('input[id="model"]');
    readonly serialNumberInput = this.page.locator('input[id="serialNumber"]');
    readonly assetTagInput = this.page.locator('input[id="assetTag"]');
    readonly dailyRateInput = this.page.locator('input[id="dailyRate"]');
    readonly minRentalInput = this.page.locator('input[id="minRentalValue"]');
    readonly cleaningFeeInput = this.page.locator('input[id="cleaningFee"]');
    readonly costInput = this.page.locator('input[id="acquisitionCost"]');
    readonly dateInput = this.page.locator('input[id="acquisitionDate"]');
    readonly notesInput = this.page.locator('textarea[id="notes"]');
    readonly submitButton = this.page.getByRole('button', { name: /cadastrar ferramenta|salvar|integralizar|atualizar/i });

    readonly searchInput = this.page.locator('input[placeholder*="Pesquisar por nome"]');

    async createTool(name: string, dailyRate: string, extras?: {
        brand?: string,
        model?: string,
        assetTag?: string,
        serialNumber?: string,
        acquisitionCost?: string,
        acquisitionDate?: string,
        notes?: string
    }) {
        await this.addToolButton.first().click();

        // Fill Name
        await this.nameInput.fill(name);

        // Fill Technical Info
        await this.brandInput.fill(extras?.brand || 'Marca Teste');
        await this.modelInput.fill(extras?.model || 'Modelo Teste');
        await this.serialNumberInput.fill(extras?.serialNumber || `SN-${Date.now()}`);
        await this.assetTagInput.fill(extras?.assetTag || `PAT-${Date.now().toString().slice(-5)}`);

        // Select or create Category
        const categoryTrigger = this.page.getByRole('combobox').first();
        await categoryTrigger.click();

        const options = this.page.getByRole('option');
        const optionsCount = await options.count();

        if (optionsCount > 1) {
            // Pick the second option (first real category)
            await options.nth(1).click();
        } else {
            // Create new category
            await this.page.getByRole('option', { name: /nova categoria/i }).click();
            await this.page.getByPlaceholder(/nova categoria/i).fill('Geral');
            // Click the plus button to save category
            const categorySaveBtn = this.page.locator('button.bg-violet-600').filter({ has: this.page.locator('svg.lucide-plus') }).first();
            await categorySaveBtn.click();

            // Short wait for category to be created and selected
            await this.page.waitForTimeout(1000);
        }

        // Fill Daily Rate
        await this.dailyRateInput.fill(dailyRate);

        // Fill other rates for completeness
        await this.minRentalInput.fill('50');
        await this.cleaningFeeInput.fill('20');

        // Control Info
        await this.costInput.fill(extras?.acquisitionCost || '1000');
        if (extras?.acquisitionDate) {
            await this.dateInput.fill(extras.acquisitionDate);
        } else {
            const today = new Date().toISOString().split('T')[0];
            await this.dateInput.fill(today);
        }

        if (extras?.notes) await this.notesInput.fill(extras.notes);

        // Submit
        await this.submitButton.click();

        // Wait for modal to close or log errors
        try {
            await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
        } catch (e) {
            const errorTexts = await this.page.locator('p.text-red-500').allInnerTexts();
            if (errorTexts.length > 0) {
                console.error(`[E2E-ERROR] Tool creation failed with validation errors: ${errorTexts.join(', ')}`);
            }
            throw e;
        }
    }

    async searchTool(query: string) {
        await this.searchInput.fill(query);
        await this.page.waitForTimeout(500);
    }

    async editTool(name: string, newName: string) {
        // Find tool card/row and click edit
        const item = this.page.locator('div, tr').filter({ hasText: name }).first();
        await item.locator('button').filter({ has: this.page.locator('svg.lucide-pencil') }).click();

        // Sheet or modal should open
        await expect(this.page.locator('div[role="dialog"]')).toBeVisible();
        await this.nameInput.fill(newName);
        await this.page.getByRole('button', { name: /salvar alterações|atualizar equipamento/i }).click();

        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible();
    }

    async expectToolInList(name: string) {
        await this.page.waitForTimeout(500);
        await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
    }

    async deleteTool(name: string) {
        const item = this.page.locator('div, tr').filter({ hasText: name }).first();
        const deleteBtn = item.locator('button').filter({ has: this.page.locator('svg.lucide-trash-2') }).first();
        await deleteBtn.click();

        const confirmBtn = this.page.getByRole('button', { name: /confirmar|sim|excluir/i });
        await confirmBtn.click();

        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async expectValidationError(message: string) {
        await expect(this.page.locator('p.text-red-500').filter({ hasText: message }).first()).toBeVisible();
    }
}
