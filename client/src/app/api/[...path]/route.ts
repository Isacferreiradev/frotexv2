import { NextRequest, NextResponse } from 'next/server';

// Frontend and backend run in the SAME Railway container via concurrently.
// Backend always binds to port 4000 (INTERNAL_BACKEND_PORT=4000).
let BACKEND_URL = (process.env.BACKEND_URL
    ? process.env.BACKEND_URL.replace(/\/$/, '')
    : 'http://127.0.0.1:4000'
);

// Prevent infinite loop if user accidentally sets BACKEND_URL to the external Railway domain
if (BACKEND_URL.includes('railway.app') || BACKEND_URL.includes('locattus')) {
    BACKEND_URL = 'http://127.0.0.1:4000';
}

export const dynamic = 'force-dynamic';

async function handler(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    const pathString = path.join('/');
    const search = req.nextUrl.search ?? '';
    const targetUrl = `${BACKEND_URL}/api/${pathString}${search}`;

    // Forward all headers except 'host'
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
        console.error(`[Proxy] FAILED → ${req.method} ${targetUrl} | Error: ${err.message}`);
        return NextResponse.json(
            {
                success: false,
                message: 'Backend unreachable',
                target: targetUrl,
                detail: err.message,
            },
            { status: 502 }
        );
    }

    console.log(`[Proxy] ${req.method} ${targetUrl} → ${response.status}`);

    const responseBody = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'application/json';

    return new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: { 'content-type': contentType },
    });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
