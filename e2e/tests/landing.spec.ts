import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';

test.describe('Landing Page', () => {
    test('deve carregar a landing page com sucesso e exibir o CTA', async ({ page }) => {
        const landingPage = new LandingPage(page);
        await landingPage.goto();
        await landingPage.expectLoaded();
    });

    test('deve redirecionar para a tela de cadastro ao clicar no CTA', async ({ page }) => {
        const landingPage = new LandingPage(page);
        await landingPage.goto();
        await landingPage.clickCTA();
        await expect(page).toHaveURL(/.*register|.*cadastro/);
    });
});
