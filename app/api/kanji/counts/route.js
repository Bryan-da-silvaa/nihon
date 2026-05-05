import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const sql = 'SELECT jlpt, COUNT(*) as count FROM kanji_data GROUP BY jlpt';
		const counts = await query(sql);
		return NextResponse.json(counts);
	} catch (error) {
		console.error("Kanji Counts API Error:", error);
		return NextResponse.json({ error: "Failed to fetch kanji counts" }, { status: 500 });
	}
}
