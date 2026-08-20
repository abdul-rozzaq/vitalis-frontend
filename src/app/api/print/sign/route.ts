import { createSign } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

function loadPrivateKey(): string {
  if (process.env.QZ_PRIVATE_KEY) {
    return Buffer.from(process.env.QZ_PRIVATE_KEY, "base64").toString("utf8");
  }
  const path = process.env.QZ_PRIVATE_KEY_PATH || join(process.cwd(), "src", "server", "qz-keys", "private-key.pem");
  return readFileSync(path, "utf8");
}

const PRIVATE_KEY = loadPrivateKey();

export async function POST(req: Request) {
  const { request } = await req.json();

  const signer = createSign("RSA-SHA512");
  signer.update(request ?? "");
  signer.end();

  return NextResponse.json({ signature: signer.sign(PRIVATE_KEY, "base64") });
}
