import { Page, expect } from '@playwright/test';

export class BasePage {
    constructor(protected page: Page) { }

    async navigate(path: string = '/') {
        await this.page.goto(path);
    }

    async wait(ms: number) {
        await this.page.waitForTimeout(ms);
    }
}
