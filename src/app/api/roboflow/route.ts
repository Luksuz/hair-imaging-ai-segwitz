import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Accept multipart/form-data uploads only (raw image)
    const data = await req.formData();
    const file = data.get("image") as unknown as File | undefined;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Forward the image to our Flask API
    const flaskFormData = new FormData();
    flaskFormData.append("image", file);

    // Prefer env-configured internal URL for Railway; default to localhost for dev
    const baseUrl = process.env.NEXT_PUBLIC_FLASK_BASE_URL || "http://127.0.0.1:5328";

    const flaskResponse = await fetch(`${baseUrl}/api/process-image`, {
      method: "POST",
      body: flaskFormData,
    });

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      console.error("Flask API error response:", errorText);
      return NextResponse.json(
        { error: `Flask API error: ${flaskResponse.status} ${flaskResponse.statusText}` },
        { status: flaskResponse.status }
      );
    }

    const data_response = await flaskResponse.json();
    return NextResponse.json(data_response);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Error in roboflow route:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}