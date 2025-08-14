import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const baseUrl = process.env.FLASK_INTERNAL_URL || process.env.NEXT_PUBLIC_FLASK_BASE_URL || "http://127.0.0.1:5328";
    const r = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Bubble up backend error bodies as JSON if not ok
    if (!r.ok) {
      let err: any = null;
      try { err = await r.json(); } catch (_) {}
      return NextResponse.json(err || { error: `Flask error ${r.status}` }, { status: r.status });
    }

    // Forward PDF bytes
    const arrayBuf = await r.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    const cd = r.headers.get("content-disposition") || "attachment; filename=hair_follicle_report.pdf";
    headers.set("Content-Disposition", cd);
    return new Response(Buffer.from(arrayBuf), { status: 200, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


