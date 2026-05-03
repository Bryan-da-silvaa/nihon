import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const sqlContent = body.sql;

    if (!sqlContent) {
      return NextResponse.json({ error: "No SQL content provided" }, { status: 400 });
    }

    // Split the SQL dump into individual statements
    // This is a simple split by semicolon + newline.
    // Real SQL parsing is complex, but for our own dumps it works.
    const statements = sqlContent
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const sql of statements) {
      await query(sql);
    }

    return NextResponse.json({ success: true, message: "Database imported successfully from SQL" });
  } catch (error) {
    console.error("Database Import Error:", error);
    return NextResponse.json({ error: "Failed to import database" }, { status: 500 });
  }
}
