import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { uniqueUser } from '../utils/testData';

test.describe('Onboarding', () => {
    test.setTimeout(60000); // Increase timeout for slower local environments

    test('deve exibir o guia de onboarding para um novo usuário', async ({ page }) => {
        const authPage = new AuthPage(page);
        const user = uniqueUser('Onboarding');

        await authPage.goto();
        await authPage.signup(user.name, user.email, user.password, user.company, user.document);

        // Initial expectation: User should hit onboarding after instant login
        await expect(page).toHaveURL(/.*onboarding|.*app/, { timeout: 15000 });

        // Step 1: Boas-vindas (Iniciar Configuração)
        const startBtn = page.getByRole('button', { name: /iniciar configuração/i });
        await expect(startBtn).toBeVisible({ timeout: 15000 });
        await startBtn.click();

        // Step 2: Primeira Ferramenta (Pular)
        const skipBtn = page.getByRole('button', { name: /pular/i });
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();

        // Step 3: Cliente (Pular)
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();

        // Step 4: Final (Completar Onboarding)
        const finishBtn = page.getByRole('button', { name: /completar onboarding/i });
        await expect(finishBtn).toBeVisible({ timeout: 10000 });
        await finishBtn.click();

        // Final expectation: Dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 20000 });
    });
});
