import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET: Stream video file with Range support for seeking
export async function GET(request, { params }) {
  const { filename } = await params;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(process.cwd(), 'media', 'video', decodedFilename);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get('range');
  const contentType = decodedFilename.endsWith('.webm') ? 'video/webm' : 'video/mp4';

  if (range) {
    // Range request for seeking
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch (e) {
            stream.destroy();
          }
        });
        stream.on('end', () => {
          try { controller.close(); } catch (e) {}
        });
        stream.on('error', (err) => {
          try { controller.error(err); } catch (e) {}
        });
      },
      cancel() {
        stream.destroy();
      }
    });

    return new Response(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
      },
    });
  }

  // Full file request
  const stream = fs.createReadStream(filePath);
  const readable = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => {
        try {
          controller.enqueue(chunk);
        } catch (e) {
          stream.destroy();
        }
      });
      stream.on('end', () => {
        try { controller.close(); } catch (e) {}
      });
      stream.on('error', (err) => {
        try { controller.error(err); } catch (e) {}
      });
    },
    cancel() {
      stream.destroy();
    }
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    },
  });
}
