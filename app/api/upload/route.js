import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.mp4';
    const sessionId = Date.now().toString();
    const fileId = `nihon_up_${sessionId}${ext}`;
    const tempPath = path.join(os.tmpdir(), fileId);
    
    await fs.writeFile(tempPath, buffer);

    return NextResponse.json({ success: true, fileId, originalName: file.name });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
