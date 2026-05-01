import { spawn } from 'child_process';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No SQL file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempPath = path.join(os.tmpdir(), `import_${Date.now()}.sql`);
    await fs.writeFile(tempPath, buffer);

    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME;

    const args = [
      '-h', dbHost,
      '-u', dbUser,
      dbName,
      '-e', `source ${tempPath}`
    ];
    
    if (dbPass) {
        args.splice(2, 0, `--password=${dbPass}`);
    }

    await new Promise((resolve, reject) => {
      const mysql = spawn('mysql', args);
      
      let errorOut = '';
      mysql.stderr.on('data', (data) => {
        const str = data.toString();
        if (!str.includes('Using a password on the command line interface can be insecure')) {
            errorOut += str;
        }
      });

      mysql.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`MySQL import failed: ${errorOut}`));
      });
      
      mysql.on('error', reject);
    });

    // Cleanup
    await fs.unlink(tempPath).catch(() => {});

    return NextResponse.json({ success: true, message: 'Database imported successfully' });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
