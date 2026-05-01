import { NextResponse } from "next/server";

const DEFAULT_AIVIS_URL = "http://127.0.0.1:10101";
const DEFAULT_SPEAKER = 888753760;

export async function POST(request) {
  try {
    const { text, speaker } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const engineBase = (process.env.AIVIS_ENGINE_URL || DEFAULT_AIVIS_URL).replace(/\/+$/, "");
    const speakerId = Number.isInteger(speaker) ? speaker : DEFAULT_SPEAKER;

    const queryUrl = `${engineBase}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`;
    const queryRes = await fetch(queryUrl, { method: "POST" });
    if (!queryRes.ok) {
      return NextResponse.json({ error: "Aivis query failed" }, { status: 502 });
    }
    const audioQuery = await queryRes.json();

    const synthUrl = `${engineBase}/synthesis?speaker=${speakerId}`;
    const synthRes = await fetch(synthUrl, {
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
    console.error("Local Aivis TTS error:", error);
    return NextResponse.json({ error: "Local TTS unavailable" }, { status: 500 });
  }
}

