import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
    readonly ctaButton = this.page.getByRole('link', { name: /começar agora|criar conta/i });
    readonly logo = this.page.getByText(/locattus/i);

    async goto() {
        await this.navigate('/');
    }

    async clickCTA() {
        await this.ctaButton.first().click();
    }

    async expectLoaded() {
        await expect(this.logo.first()).toBeVisible();
        await expect(this.ctaButton.first()).toBeVisible();
    }
}
