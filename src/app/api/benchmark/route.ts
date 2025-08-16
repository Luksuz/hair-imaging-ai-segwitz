import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const baseUrl = process.env.FLASK_INTERNAL_URL || process.env.NEXT_PUBLIC_FLASK_BASE_URL || "http://127.0.0.1:5328";
    const r = await fetch(`${baseUrl}/api/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      let err: any = null;
      try { err = await r.json(); } catch (_) {}
      return NextResponse.json(err || { error: `Flask error ${r.status}` }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}


