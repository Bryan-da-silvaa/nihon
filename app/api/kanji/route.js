import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const level = searchParams.get('level');
		const search = searchParams.get('search');
		const strict = searchParams.get('strict') === 'true';
		const limit = parseInt(searchParams.get('limit')) || 100;
		const offset = parseInt(searchParams.get('offset')) || 0;

		let sql = 'SELECT * FROM kanji_data';
		let countSql = 'SELECT COUNT(*) as total FROM kanji_data';
		let conditions = [];
		let params = [];

		if (level) {
			if (level === 'null') {
				conditions.push('jlpt IS NULL');
			} else {
				conditions.push('jlpt = ?');
				params.push(level);
			}
		}

		if (search) {
			if (strict) {
				conditions.push('literal = ?');
				params.push(search);
			} else {
				conditions.push('(literal LIKE ? OR meanings_en LIKE ? OR meanings_fr LIKE ?)');
				const searchParam = `%${search}%`;
				params.push(searchParam, searchParam, searchParam);
			}
		}

		if (conditions.length > 0) {
			const whereClause = ' WHERE ' + conditions.join(' AND ');
			sql += whereClause;
			countSql += whereClause;
		}

		sql += ' ORDER BY jlpt DESC, frequency ASC LIMIT ? OFFSET ?';
		const queryParams = [...params, limit, offset];

		const [kanjis, countResult] = await Promise.all([
			query(sql, queryParams),
			query(countSql, params)
		]);

		return NextResponse.json({
			kanjis,
			total: countResult[0].total,
			limit,
			offset
		});
	} catch (error) {
		console.error("Kanji API Error:", error);
		return NextResponse.json({ error: "Failed to fetch kanjis" }, { status: 500 });
	}
}
