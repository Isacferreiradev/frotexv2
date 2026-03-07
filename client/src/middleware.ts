import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    // Allow public paths and Next.js internals
    if (isPublic || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Check for auth token in cookies
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        // Protect all internal application routes
        const protectedRoutes = ['/dashboard', '/ferramentas', '/clientes', '/locacoes', '/manutencao', '/configuracoes', '/financeiro'];
        const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

        if (isProtected) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
