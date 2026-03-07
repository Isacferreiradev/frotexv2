import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow Next.js internals and static assets always
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // 2. Identify public paths
    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    // 3. Auth Check
    const token = request.cookies.get('access_token')?.value;

    // If no token and NOT a public path -> Redirect to login
    if (!token && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If token exists and trying to access login/register -> Redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
