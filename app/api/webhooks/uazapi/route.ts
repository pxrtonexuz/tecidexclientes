import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  // The first connection step only needs a stable public URL for UazAPI.
  // Once we capture the real event shape, this route will persist messages/status by tenant.
  console.log("[uazapi:webhook]", JSON.stringify(payload));

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "uazapi-webhook" });
}
