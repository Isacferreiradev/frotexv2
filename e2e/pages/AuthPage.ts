import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
    // Selectors
    readonly emailInput = this.page.locator('input[type="email"]');
    readonly passwordInput = this.page.locator('input[type="password"]');
    readonly fullNameInput = this.page.locator('input[name="fullName"]');
    readonly nextButton = this.page.getByRole('button', { name: /avançar/i });
    readonly submitButton = this.page.locator('button[type="submit"]').or(this.page.getByRole('button', { name: /concluir|acessar/i }));

    // Step 2 Fields
    readonly tenantNameInput = this.page.locator('input[name="tenantName"]');
    readonly documentInput = this.page.locator('input[name="documentNumber"]');
    readonly phoneInput = this.page.locator('input[name="phoneNumber"]');
    readonly cityInput = this.page.locator('input[name="city"]');
    readonly stateInput = this.page.locator('input[name="state"]');

    // Step 3 Fields
    readonly controlMethodButton = (method: string) => this.page.getByRole('button', { name: new RegExp(method, 'i') });

    async goto() {
        await this.navigate('/register');
    }

    async gotoLogin() {
        await this.navigate('/login');
    }

    async login(email: string, pass: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
        await this.submitButton.click();
    }

    async signup(name: string, email: string, pass: string, company: string, doc?: string) {
        // Step 1: Account
        await this.fullNameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
        await this.nextButton.click();

        // Step 2: Company
        await this.tenantNameInput.fill(company);
        await this.documentInput.fill(doc || '12.345.678/0001-99');
        await this.phoneInput.fill('(11) 99999-9999');
        await this.cityInput.fill('São Paulo');
        await this.stateInput.fill('SP');
        await this.nextButton.click();

        // Step 3: Operation
        await this.controlMethodButton('Planilha Excel').click();
        await this.submitButton.click();
    }

    async skipOnboarding() {
        // Many tests want to go straight to dashboard after signup
        await this.page.goto('/dashboard');
        // If there's a specific "Skip" button or logic, we'd add it here.
        // For now, navigating directly usually bypasses onboarding if it's already done.
        // Or if it's a persistent UI, we might need a locator.
    }

    async expectAuthenticated() {
        await expect(this.page).toHaveURL(/.*dashboard|.*app/);
    }
}
