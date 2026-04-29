export const maxDuration = 60;

async function handler(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const urlObj = new URL(req.url);
  const target = `${process.env.API_BASE_URL}/${path}${urlObj.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  // Next.js 15+ strips the Authorization header from incoming requests in route handlers.
  // We read it directly from the raw request header and re-set it explicitly.
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-ignore — required for streaming request body in Node 18+
    duplex: "half",
  });

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
