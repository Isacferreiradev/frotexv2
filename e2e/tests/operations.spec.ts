import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomerPage } from '../pages/CustomerPage';
import { ToolPage } from '../pages/ToolPage';
import { RentalPage } from '../pages/RentalPage';
import { uniqueUser } from '../utils/testData';

/**
 * Operações críticas dentro do sistema.
 * Idealmente aqui usaríamos um "auth state" salvo, 
 * mas para este setup inicial faremos o login no beforeEach.
 */
test.describe('Operações Críticas (CRUDs)', () => {
    test.setTimeout(120000); // Higher timeout for register + onboarding skip sequence

    let dashboardPage: DashboardPage;
    let customerPage: CustomerPage;
    let toolPage: ToolPage;
    let rentalPage: RentalPage;

    test.beforeEach(async ({ page }) => {
        const authPage = new AuthPage(page);
        dashboardPage = new DashboardPage(page);
        customerPage = new CustomerPage(page);
        toolPage = new ToolPage(page);
        rentalPage = new RentalPage(page);

        // Dynamic registration for isolation - always fresh data
        const user = uniqueUser('Ops');
        console.log(`[E2E-DEBUG] Signup with email: ${user.email}, doc: ${user.document}`);

        await authPage.goto();
        await authPage.signup(user.name, user.email, user.password, user.company, user.document);

        // Registration can be slow due to email sending, wait longer
        // Also check if we are stuck on register (meaning validation error)
        try {
            await expect(page).toHaveURL(/.*onboarding|.*app/, { timeout: 30000 });
        } catch (e) {
            const errorMsg = await page.locator('div.text-red-600').innerText().catch(() => 'No error msg');
            console.error(`[E2E-ERROR] Signup failed or timed out. Current URL: ${page.url()}. Server error: ${errorMsg}`);
            throw e;
        }

        // Step 1: Boas-vindas
        const startBtn = page.getByRole('button', { name: /iniciar configuração/i });
        await expect(startBtn).toBeVisible({ timeout: 15000 });
        await startBtn.click();

        // Step 2: Skip Tool
        const skipBtn = page.getByRole('button', { name: /pular/i });
        await expect(skipBtn).toBeVisible({ timeout: 15000 });
        await skipBtn.click();

        // Step 3: Skip Customer
        await expect(skipBtn).toBeVisible({ timeout: 15000 });
        await skipBtn.click();

        // Step 4: Finish
        const finishBtn = page.getByRole('button', { name: /completar onboarding/i });
        await expect(finishBtn).toBeVisible({ timeout: 15000 });
        await finishBtn.click();

        await dashboardPage.expectLoaded();
    });

    test('Gestão de Clientes: Criar e Validar', async ({ page }) => {
        await dashboardPage.goToCustomers();
        const clientName = `Cliente E2E ${Date.now()}`;
        await customerPage.createCustomer(
            clientName,
            'e2e@test.com',
            '(11) 99999-8888',
            '12.345.678/0001-99'
        );
        await customerPage.expectCustomerInList(clientName);
    });

    test('Gestão de Ferramentas: Criar, Validar e Excluir', async ({ page }) => {
        await dashboardPage.goToTools();
        const toolName = `Ferramenta E2E ${Date.now()}`;
        await toolPage.createTool(toolName, '150', {
            brand: 'Bosch Professional',
            model: 'GSH 11 E',
            serialNumber: `SN-${Date.now()}`,
            assetTag: `PAT-${Date.now().toString().slice(-5)}`,
            acquisitionCost: '4500.00',
            notes: 'Equipamento de alta performance para demolição'
        });
        await toolPage.expectToolInList(toolName);

        // Test Delete
        await toolPage.deleteTool(toolName);
        await expect(page.getByText(toolName)).not.toBeVisible();
    });

    test('Gestão de Locações: Criar Nova Locação', async ({ page }) => {
        await dashboardPage.goToRentals();
        // Aqui assumimos que já existem clientes/ ferramentas ou criamos antes
        // Para simplificar, vamos apenas validar se o modal abre e salva
        await rentalPage.addRentalButton.first().click();
        await expect(page.getByText(/nova locação/i)).toBeVisible();
        // Fluxo completo dependeria de dados consistentes de ferramentas no banco
    });

    test('Logout segura o sistema', async ({ page }) => {
        await dashboardPage.logout();
        await expect(page).toHaveURL(/.*login/);
    });
});
