import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { uniqueUser } from '../utils/testData';

test.describe('Autenticação', () => {
    // Generate unique data ONCE per test file execution
    const testUser = uniqueUser('Auth');

    test('deve permitir criar uma conta com sucesso', async ({ page }) => {
        const authPage = new AuthPage(page);
        await authPage.goto();

        await authPage.signup(
            testUser.name,
            testUser.email,
            testUser.password,
            testUser.company,
            testUser.document
        );

        // After register, we expect to be on the onboarding or dashboard directly
        await expect(page).toHaveURL(/.*onboarding|.*dashboard|.*app/, { timeout: 15000 });
    });

    test('deve permitir fazer login com credenciais válidas', async ({ page }) => {
        const authPage = new AuthPage(page);
        await authPage.gotoLogin();
        // Using the user created in previous step or a known one
        // For E2E we usually want to isolate, but let's assume we use a seed or this one
        await authPage.login(testUser.email, testUser.password);
        // Acceptance of onboarding or dashboard for new accounts
        await expect(page).toHaveURL(/.*dashboard|.*onboarding|.*app/, { timeout: 10000 });
    });

    test('deve bloquear acesso a rotas protegidas sem login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*login/);
    });

    test('deve exibir erro ao tentar login com credenciais inválidas', async ({ page }) => {
        const authPage = new AuthPage(page);
        await authPage.gotoLogin();
        await authPage.login('invalido@teste.com', 'senhaerrada');
        // Match "Credenciais inválidas" regardless of case or accents
        await expect(page.locator('text=/inválid/i').or(page.locator('text=/incorret/i'))).toBeVisible({ timeout: 10000 });
    });
});
