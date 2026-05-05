import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET() {
  try {
    // 1. Récupérer dynamiquement toutes les tables de la base de données
    const dbName = process.env.DB_NAME;
    const rawTables = await query(`SHOW TABLES`);
    
    // Le nom de la propriété retournée par MySQL est dynamiquement 'Tables_in_[nom_de_la_db]'
    const tableKey = `Tables_in_${dbName}`;
    const tables = rawTables.map(t => t[tableKey] || Object.values(t)[0]);

    let sqlDump = `-- Nihon Universal Database Dump\n-- Generated on ${new Date().toISOString()}\n-- Database: ${dbName}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      // Ignorer les tables de log ou temporaires si nécessaire (optionnel)
      // if (table.startsWith('tmp_')) continue;

      const rows = await query(`SELECT * FROM \`${table}\``);
      
      sqlDump += `-- Table: ${table}\n`;
      sqlDump += `TRUNCATE TABLE \`${table}\`;\n`;

      if (rows.length === 0) {
        sqlDump += '\n';
        continue;
      }

      const columns = Object.keys(rows[0]);
      const columnNames = columns.map(c => `\`${c}\``).join(', ');

      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valuesList = batch.map(row => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            
            let strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `'${strVal.replace(/'/g, "''")}'`;
          }).join(', ');
          return `(${values})`;
        }).join(',\n');

        sqlDump += `INSERT INTO \`${table}\` (${columnNames}) VALUES \n${valuesList};\n`;
      }
      sqlDump += '\n';
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `nihon_universal_dump_${timestamp}.sql`;

    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Universal Database Export Error:", error);
    return NextResponse.json({ error: "Failed to export database" }, { status: 500 });
  }
}
