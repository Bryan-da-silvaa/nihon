import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET: Serve thumbnail image
export async function GET(request, { params }) {
	const { filename } = await params;
	const decodedFilename = decodeURIComponent(filename);
	const filePath = path.join(process.cwd(), 'media', 'thumbnails', decodedFilename);

	// Check file exists
	if (!fs.existsSync(filePath)) {
		return NextResponse.json({ error: 'File not found' }, { status: 404 });
	}

	const stat = fs.statSync(filePath);
	const fileSize = stat.size;
	const contentType = decodedFilename.endsWith('.png') ? 'image/png' : 'image/jpeg';

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
				try { controller.close(); } catch (e) { }
			});
			stream.on('error', (err) => {
				try { controller.error(err); } catch (e) { }
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
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
}
