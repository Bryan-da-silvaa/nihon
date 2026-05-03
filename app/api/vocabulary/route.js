import { NextResponse } from 'next/server';
import { query, initDb } from '../../../lib/db';

// GET: Fetch all vocabulary for a user
export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get('userId');

	if (!userId) {
		return NextResponse.json({ error: 'User ID required' }, { status: 400 });
	}

	try {
		await initDb();
		const rows = await query(
			`SELECT word, reading, status FROM user_vocabulary WHERE user_id = ?`,
			[userId]
		);
		return NextResponse.json({ vocabulary: rows });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

// POST: Update or add a word to user vocabulary
export async function POST(request) {
	try {
		const { userId, word, reading, status } = await request.json();

		if (!userId || !word) {
			return NextResponse.json({ error: 'User ID and word required' }, { status: 400 });
		}

		await initDb();
		
		// Use INSERT ... ON DUPLICATE KEY UPDATE for efficiency
		await query(
			`INSERT INTO user_vocabulary (user_id, word, reading, status) 
			 VALUES (?, ?, ?, ?) 
			 ON DUPLICATE KEY UPDATE status = ?, reading = ?`,
			[userId, word, reading, status, status, reading]
		);

		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
