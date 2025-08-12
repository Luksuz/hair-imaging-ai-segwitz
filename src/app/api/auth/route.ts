import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  const ok = username === u && password === p;
  const res = NextResponse.json({ ok });
  if (ok) res.cookies.set("auth", "1", { httpOnly: false, sameSite: "lax" });
  return res;
}




