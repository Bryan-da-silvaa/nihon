import { NextResponse } from "next/server";

const DEFAULT_AIVIS_URL = "http://127.0.0.1:10101";

export async function GET() {
  try {
    const engineBase = (process.env.AIVIS_ENGINE_URL || DEFAULT_AIVIS_URL).replace(/\/+$/, "");
    const res = await fetch(`${engineBase}/speakers`);
    if (!res.ok) {
      return NextResponse.json({ speakers: [] }, { status: 200 });
    }

    const rawSpeakers = await res.json();
    const speakers = (rawSpeakers || []).flatMap((speaker) => {
      const styles = Array.isArray(speaker.styles) ? speaker.styles : [];
      return styles.map((style) => ({
        id: style.id,
        name: `${speaker.name} - ${style.name}`,
      }));
    });

    return NextResponse.json({ speakers });
  } catch (error) {
    console.error("Aivis speakers fetch error:", error);
    return NextResponse.json({ speakers: [] }, { status: 200 });
  }
}

