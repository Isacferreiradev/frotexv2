import { NextRequest, NextResponse } from 'next/server';

// This runs SERVER-SIDE on every request — reads env vars at RUNTIME, not build time.
// No CORS issues: browser calls locattus.com/api/*, this server-side handler calls backend.
const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

async function handler(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    const pathString = path.join('/');
    const search = req.nextUrl.search ?? '';
    const targetUrl = `${BACKEND_URL}/api/${pathString}${search}`;

    // Forward all headers except 'host' (which must be the backend's host)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
            headers[key] = value;
        }
    });

    // Read body for non-GET methods
    let body: ArrayBuffer | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        body = await req.arrayBuffer();
    }

    let response: Response;
    try {
        response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: body && body.byteLength > 0 ? body : undefined,
        });
    } catch (err: any) {
        console.error(`[API Proxy] Failed to reach backend at ${targetUrl}:`, err.message);
        return NextResponse.json(
            { success: false, message: 'Backend unavailable', detail: err.message },
            { status: 502 }
        );
    }

    // Forward response body and status
    const responseBody = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'application/json';

    return new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'content-type': contentType,
        },
    });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
