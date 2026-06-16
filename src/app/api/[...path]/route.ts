export const maxDuration = 60;

async function handler(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const urlObj = new URL(req.url);
  const target = `${process.env.API_BASE_URL}/${path}${urlObj.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body != null;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-ignore — required for streaming request body in Node 18+
    ...(hasBody && { duplex: "half" }),
  });

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");

  if (contentType) responseHeaders.set("content-type", contentType);
  const contentDisposition = upstream.headers.get("content-disposition");

  if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);

  const bodyless = upstream.status === 204 || upstream.status === 304;

  return new Response(bodyless ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { handler as DELETE, handler as GET, handler as POST, handler as PUT, handler as PATCH };
