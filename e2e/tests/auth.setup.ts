import { test as setup, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { uniqueUser } from '../utils/testData';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
    const authPage = new AuthPage(page);
    const user = uniqueUser('Setup');

    await authPage.goto();
    await authPage.signup(user.name, user.email, user.password, user.company, user.document);
    await authPage.skipOnboarding();

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

    await page.context().storageState({ path: authFile });
});
