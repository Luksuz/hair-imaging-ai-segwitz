import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    // Forward to Flask via internal URL to avoid CORS
    const baseUrl = process.env.FLASK_INTERNAL_URL || process.env.NEXT_PUBLIC_FLASK_BASE_URL || "http://127.0.0.1:5328";
    const r = await fetch(`${baseUrl}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    const ok = !!(data.success ?? data.ok);
    // Return both keys to keep frontend shape consistent regardless of source
    const res = NextResponse.json({ ok, success: ok });
    if (ok) res.cookies.set("auth", "1", { httpOnly: false, sameSite: "lax" });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}




