import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const sqlContent = body.sql;

    if (!sqlContent) {
      return NextResponse.json({ error: "No SQL content provided" }, { status: 400 });
    }

    // Since we enabled multipleStatements: true in lib/db.js,
    // we can execute the whole dump in a single query call.
    // This is much faster and safer than manual splitting.
    await query(sqlContent);

    return NextResponse.json({ success: true, message: "Database restored successfully from SQL dump" });
  } catch (error) {
    console.error("Database Import Error:", error);
    // Log more details for debugging
    return NextResponse.json({ 
      error: "Failed to import database", 
      details: error.message 
    }, { status: 500 });
  }
}
