async function handler(req: Request, { params }: { params: Promise<any> }) {
  const path = (await params).path.join("/");

  const urlObj = new URL(req.url);

  const target = `${process.env.API_BASE_URL}/${path}${urlObj.search}`;

  const res = await fetch(target, {
    method: req.method,
    headers: {
      ...Object.fromEntries(req.headers),
    },
    body: req.method !== "GET" ? await req.text() : undefined,
  });

  return new Response(await res.text(), {
    status: res.status,
  });
}

export { handler as DELETE, handler as GET, handler as POST, handler as PUT };
