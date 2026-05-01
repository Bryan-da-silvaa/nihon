import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME;

    if (!dbHost || !dbUser || !dbName) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const args = [
      '-h', dbHost,
      '-u', dbUser,
      dbName
    ];
    
    if (dbPass) {
        args.push(`--password=${dbPass}`);
    }

    const mysqldump = spawn('mysqldump', args);

    const stream = new ReadableStream({
      start(controller) {
        mysqldump.stdout.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        mysqldump.stderr.on('data', (data) => {
          const str = data.toString();
          // Ignore the standard insecure password warning
          if (!str.includes('Using a password on the command line interface can be insecure')) {
             console.error(`mysqldump stderr: ${str}`);
          }
        });

        mysqldump.on('close', (code) => {
          if (code === 0) {
            controller.close();
          } else {
            controller.error(new Error(`mysqldump exited with code ${code}`));
          }
        });

        mysqldump.on('error', (err) => {
          controller.error(err);
        });
      }
    });

    const date = new Date().toISOString().split('T')[0];
    const headers = new Headers();
    headers.set('Content-Type', 'application/sql');
    headers.set('Content-Disposition', `attachment; filename="nihon_backup_${date}.sql"`);

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
