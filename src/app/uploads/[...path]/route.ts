export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const backendBase = (process.env.API_BASE_URL ?? "").replace(/\/api\/?$/, "");
  const target = `${backendBase}/uploads/${path}`;

  const upstream = await fetch(target, { method: "GET" });

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentType) responseHeaders.set("content-type", contentType);
  if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
