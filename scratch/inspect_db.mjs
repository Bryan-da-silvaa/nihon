import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectDb() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	try {
		const [tables] = await connection.query('SHOW TABLES');
		console.log("📋 Tables trouvées:", tables.map(t => Object.values(t)[0]));

		for (const tableObj of tables) {
			const tableName = Object.values(tableObj)[0];
			if (tableName.includes('kanji') || tableName.includes('dict')) {
				const [columns] = await connection.query(`DESCRIBE ${tableName}`);
				console.log(`\n🔍 Structure de ${tableName}:`);
				console.table(columns.map(c => ({ Champ: c.Field, Type: c.Type })));
			}
		}
	} catch (err) {
		console.error("❌ Erreur d'inspection:", err);
	} finally {
		await connection.end();
	}
}

inspectDb();
