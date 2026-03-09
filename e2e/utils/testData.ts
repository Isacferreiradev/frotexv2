/**
 * Helpers to generate unique test data on every run.
 * Prevents "document already registered" errors when running the suite multiple times.
 */

/** Returns a unique suffix based on timestamp + random number */
function uid(): string {
    return `${Date.now()}${Math.floor(Math.random() * 9000) + 1000}`;
}

/** Generates a unique fake CNPJ in the format XX.XXX.XXX/0001-XX */
export function uniqueCNPJ(): string {
    const n = uid().slice(-8).padStart(8, '0');
    const suffix = String(Math.floor(Math.random() * 89) + 10);
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/0001-${suffix}`;
}

/** Generates a unique fake CPF in the format XXX.XXX.XXX-XX */
export function uniqueCPF(): string {
    const n = uid().slice(-9).padStart(9, '0');
    const suffix = String(Math.floor(Math.random() * 89) + 10);
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${suffix}`;
}

/** Generates a unique test email */
export function uniqueEmail(prefix = 'test'): string {
    return `${prefix}_${uid()}@frotex-e2e.com`;
}

/** Builds a complete unique test user object, ready for AuthPage.signup() */
export function uniqueUser(prefix = 'E2E') {
    const id = uid();
    return {
        name: `${prefix} User ${id}`,
        email: uniqueEmail(prefix.toLowerCase()),
        password: 'Password123!',
        company: `${prefix} Corp ${id}`,
        document: uniqueCNPJ(),
    };
}
