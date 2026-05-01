import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync('node scripts/generate-furigana.js', {
      cwd: process.cwd(),
      timeout: 30000, // 30s max
    });

    // Parse the count from stdout (e.g. "✅ Generated 98 entries...")
    const match = stdout.match(/Generated (\d+) entries/);
    const count = match ? parseInt(match[1]) : 0;

    return NextResponse.json({
      success: true,
      count,
      output: stdout,
    });
  } catch (err) {
    console.error('Furigana generation error:', err);
    return NextResponse.json(
      { error: err.message, stderr: err.stderr || '' },
      { status: 500 }
    );
  }
}
