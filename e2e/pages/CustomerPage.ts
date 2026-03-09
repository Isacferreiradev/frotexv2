import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CustomerPage extends BasePage {
    readonly addCustomerButton = this.page.getByRole('button', { name: /cadastrar cliente/i })
        .or(this.page.getByText(/cadastrar cliente/i).locator('..'))
        .or(this.page.locator('button').filter({ hasText: /novo cliente|cadastrar/i }));
    readonly nameInput = this.page.locator('input[id="fullName"]');
    readonly emailInput = this.page.locator('input[id="email"]');
    readonly phoneInput = this.page.locator('input[id="phoneNumber"]');
    readonly documentInput = this.page.locator('input[id="documentNumber"]');
    readonly submitButton = this.page.getByRole('button', { name: /cadastrar cliente|salvar/i });

    readonly searchInput = this.page.locator('input[placeholder*="Pesquisar por nome"]');
    readonly addressStreetInput = this.page.locator('input[id="addressStreet"]');
    readonly addressNumberInput = this.page.locator('input[id="addressNumber"]');
    readonly addressNeighborhoodInput = this.page.locator('input[id="addressNeighborhood"]');
    readonly addressCityInput = this.page.locator('input[id="addressCity"]');
    readonly addressStateInput = this.page.locator('input[id="addressState"]');
    readonly notesInput = this.page.locator('textarea[id="notes"]');
    readonly tagsInput = this.page.locator('input[placeholder*="Adicionar tag"]');
    readonly addTagButton = this.page.getByRole('button', { name: /add/i });

    async createCustomer(name: string, email: string, phone: string, doc: string, options?: {
        street?: string,
        number?: string,
        neighborhood?: string,
        city?: string,
        state?: string,
        tags?: string[]
    }) {
        await this.addCustomerButton.first().click();

        // Select document type based on length/format
        const isCnpj = doc.replace(/\D/g, '').length > 11;
        if (isCnpj) {
            const selectTrigger = this.page.getByRole('combobox').first();
            await selectTrigger.click();
            await this.page.getByRole('option', { name: /CNPJ/i }).click();
        }

        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.phoneInput.fill(phone);
        await this.documentInput.fill(doc);

        if (options?.street) await this.addressStreetInput.fill(options.street);
        if (options?.number) await this.addressNumberInput.fill(options.number);
        if (options?.neighborhood) await this.addressNeighborhoodInput.fill(options.neighborhood);
        if (options?.city) await this.addressCityInput.fill(options.city);
        if (options?.state) await this.addressStateInput.fill(options.state);

        if (options?.tags) {
            for (const tag of options.tags) {
                await this.tagsInput.fill(tag);
                await this.addTagButton.click();
            }
        }

        await this.submitButton.click();

        // Wait for modal to close
        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    }

    async searchCustomer(query: string) {
        await this.searchInput.fill(query);
        await this.page.waitForTimeout(500); // Wait for debounce filter
    }

    async editCustomer(name: string, newName: string) {
        const row = this.page.locator('tr').filter({ hasText: name }).first();
        await row.locator('button').filter({ has: this.page.locator('svg.lucide-pencil') }).click();

        // Should open Sheet
        await expect(this.page.locator('div[role="dialog"]')).toBeVisible();
        await this.nameInput.fill(newName);
        await this.page.getByRole('button', { name: /salvar alterações/i }).click();

        // Wait for sheet to close
        await expect(this.page.locator('div[role="dialog"]')).not.toBeVisible();
    }

    async deleteCustomer(name: string) {
        const row = this.page.locator('tr').filter({ hasText: name }).first();
        await row.locator('button').filter({ has: this.page.locator('svg.lucide-trash-2') }).click();

        // Confirm Modal
        const confirmBtn = this.page.getByRole('button', { name: /confirmar|sim|excluir/i });
        await confirmBtn.click();

        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async expectCustomerInList(name: string) {
        await expect(this.page.getByText(name).first()).toBeVisible();
    }

    async expectValidationError(message: string) {
        await expect(this.page.locator('p.text-red-500').filter({ hasText: message }).first()).toBeVisible();
    }
}
