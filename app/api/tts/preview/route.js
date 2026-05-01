import { NextResponse } from "next/server";

const DEFAULT_AIVIS_URL = "http://127.0.0.1:10101";

export async function POST(request) {
  try {
    const { speaker, text } = await request.json();
    const previewText = (text && typeof text === "string" ? text : "こんにちは、音声プレビューです。").trim();
    const speakerId = Number.parseInt(String(speaker ?? "888753760"), 10);

    if (!previewText) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (!Number.isFinite(speakerId) || speakerId <= 0) {
      return NextResponse.json({ error: "Invalid speaker" }, { status: 400 });
    }

    const engineBase = (process.env.AIVIS_ENGINE_URL || DEFAULT_AIVIS_URL).replace(/\/+$/, "");
    const queryRes = await fetch(`${engineBase}/audio_query?text=${encodeURIComponent(previewText)}&speaker=${speakerId}`, {
      method: "POST",
    });
    if (!queryRes.ok) {
      return NextResponse.json({ error: "Aivis query failed" }, { status: 502 });
    }
    const audioQuery = await queryRes.json();

    const synthRes = await fetch(`${engineBase}/synthesis?speaker=${speakerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
    });
    if (!synthRes.ok) {
      return NextResponse.json({ error: "Aivis synthesis failed" }, { status: 502 });
    }

    const audioBuffer = await synthRes.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Aivis preview error:", error);
    return NextResponse.json({ error: "Preview unavailable" }, { status: 500 });
  }
}

