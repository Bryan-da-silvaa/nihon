import { NextResponse } from 'next/server';
import { getSystemConfig, saveSystemConfig } from '../../../lib/db';

const defaultConfig = {
  whisperCommand: "whisper",
  whisperPath: "",
  whisperModel: "base",
  ytdlpCommand: "yt-dlp",
  ffmpegCommand: "ffmpeg"
};

export async function GET() {
  try {
    const dbConfig = await getSystemConfig();
    return NextResponse.json(dbConfig || defaultConfig);
  } catch (error) {
    console.error("Erreur lecture configuration DB:", error);
    return NextResponse.json(defaultConfig); // Fallback to default if DB fails
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Read existing config or use default
    let currentConfig = { ...defaultConfig };
    try {
      const dbConfig = await getSystemConfig();
      if (dbConfig) {
        currentConfig = { ...currentConfig, ...dbConfig };
      }
    } catch (e) {
      // Ignored
    }

    // Update with new values
    const newConfig = { ...currentConfig, ...body };
    
    await saveSystemConfig(newConfig);
    return NextResponse.json({ success: true, config: newConfig });
  } catch (error) {
    console.error("Erreur de sauvegarde config DB:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde de la configuration" }, { status: 500 });
  }
}
