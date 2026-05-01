import { NextResponse } from 'next/server';
import { query, initDb } from '../../../../../lib/db';
import fs from 'fs/promises';
import path from 'path';

// POST: Sync existing media files from disk into the database
export async function POST() {
  try {
    await initDb();

    const mediaDir = path.join(process.cwd(), 'media');
    const audioDir = path.join(mediaDir, 'audio');
    const subsDir = path.join(mediaDir, 'transcripts');

    // Read existing audio files
    let audioFiles = [];
    try {
      audioFiles = (await fs.readdir(audioDir)).filter(f => f.endsWith('.wav'));
    } catch (_) {}

    let imported = 0;

    for (const audioFile of audioFiles) {
      const title = audioFile.replace(/\.wav$/, '');

      // Check if already in DB
      const existing = await query(
        `SELECT id FROM whisper_sessions WHERE audio_filename = ?`, [audioFile]
      );
      if (existing.length > 0) continue;

      // Try to read matching subtitle files
      const subsFile = path.join(subsDir, `${title}.srt`);
      const romajiFile = path.join(subsDir, `${title}_romaji.srt`);

      let subsContent = null;
      let romajiContent = null;

      try {
        subsContent = await fs.readFile(subsFile, 'utf8');
      } catch (_) {}

      try {
        romajiContent = await fs.readFile(romajiFile, 'utf8');
      } catch (_) {}

      // Check for video file
      const videoDir = path.join(mediaDir, 'video');
      let videoFile = null;
      try {
        const potentialMp4 = path.join(videoDir, `${title}.mp4`);
        await fs.access(potentialMp4);
        videoFile = `${title}.mp4`;
      } catch (_) {}

      // Insert into DB
      await query(
        `INSERT INTO whisper_sessions (title, audio_filename, video_filename, subs_content, romaji_content) VALUES (?, ?, ?, ?, ?)`,
        [title, audioFile, videoFile, subsContent, romajiContent]
      );
      imported++;
    }

    return NextResponse.json({ success: true, imported });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
