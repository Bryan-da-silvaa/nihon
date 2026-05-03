import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET() {
  try {
    const tables = [
      'users',
      'whisper_sessions',
      'user_library',
      'user_tags',
      'game_sessions',
      'kana_stats',
      'system_settings'
    ];

    let sqlDump = `-- Nihon Database Dump\n-- Generated on ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      const rows = await query(`SELECT * FROM ${table}`);
      if (rows.length === 0) continue;

      sqlDump += `-- Table: ${table}\n`;
      sqlDump += `DELETE FROM ${table};\n`; // Optional: clear table before insert if desired in the dump

      const columns = Object.keys(rows[0]);
      const columnNames = columns.map(c => `\`${c}\``).join(', ');

      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        sqlDump += `INSERT INTO ${table} (${columnNames}) VALUES (${values});\n`;
      }
      sqlDump += '\n';
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `nihon_dump_${timestamp}.sql`;

    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Database Export Error:", error);
    return NextResponse.json({ error: "Failed to export database" }, { status: 500 });
  }
}
