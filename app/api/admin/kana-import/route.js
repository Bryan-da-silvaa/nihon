import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json({ error: "User ID is required" }, { status: 400 });
		}

		// Resetting kana stats for the user
		// This removes all learned items and starts SRS from scratch
		await query(`DELETE FROM kana_stats WHERE user_id = ?`, [userId]);

		return NextResponse.json({ success: true, message: "Kana data reset successfully" });
	} catch (error) {
		console.error("Kana Import/Reset Error:", error);
		return NextResponse.json({ error: "Failed to reset kana data" }, { status: 500 });
	}
}
