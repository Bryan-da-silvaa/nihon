import fs from 'fs/promises';
import { join } from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

async function importJmdict() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nihon',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Lecture du fichier jmdict-fre-3.6.2.json...");
        const filePath = join(process.cwd(), 'public', 'jmdict-fre-3.6.2.json');
        const fileContent = await fs.readFile(filePath, 'utf8');
        const dictData = JSON.parse(fileContent);

        console.log("Création des tables relationnelles...");
        
        // Supprime l'ancienne table pour faire place nette et éviter les conflits de types
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('DROP TABLE IF EXISTS dictionary_meaning, dictionary_kana, dictionary_kanji, dictionary');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Table principale
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary (
                id VARCHAR(20) PRIMARY KEY,
                part_of_speech JSON
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Table des Kanjis (avec index de recherche)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary_kanji (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dict_id VARCHAR(20),
                kanji VARCHAR(255),
                FOREIGN KEY (dict_id) REFERENCES dictionary(id) ON DELETE CASCADE,
                INDEX idx_kanji (kanji)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Table des Kanas (avec index de recherche)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary_kana (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dict_id VARCHAR(20),
                kana VARCHAR(255),
                FOREIGN KEY (dict_id) REFERENCES dictionary(id) ON DELETE CASCADE,
                INDEX idx_kana (kana)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Table des sens/traductions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary_meaning (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dict_id VARCHAR(20),
                meaning TEXT,
                FOREIGN KEY (dict_id) REFERENCES dictionary(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const words = dictData.words;
        console.log(`Fichier lu avec succès : ${words.length} entrées trouvées.`);

        console.log("Nettoyage des anciennes données (par sécurité)...");
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE dictionary_meaning');
        await pool.query('TRUNCATE TABLE dictionary_kana');
        await pool.query('TRUNCATE TABLE dictionary_kanji');
        await pool.query('TRUNCATE TABLE dictionary');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Début de l'insertion...");
        const BATCH_SIZE = 1000;
        
        // On insère par lots pour optimiser
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
            const batch = words.slice(i, i + BATCH_SIZE);
            
            const mainValues = [];
            const kanjiValues = [];
            const kanaValues = [];
            const meaningValues = [];

            batch.forEach(w => {
                const id = w.id;
                const pos = new Set();
                
                if (Array.isArray(w.sense)) {
                    w.sense.forEach(s => {
                        if (s.partOfSpeech) s.partOfSpeech.forEach(p => pos.add(p));
                        if (s.gloss) s.gloss.forEach(g => meaningValues.push([id, g.text]));
                    });
                }

                mainValues.push([id, JSON.stringify(Array.from(pos))]);

                // Préparation des Kanjis
                if (w.kanji && w.kanji.length > 0) {
                    w.kanji.forEach(k => kanjiValues.push([id, k.text]));
                }

                // Préparation des Kanas
                if (w.kana && w.kana.length > 0) {
                    w.kana.forEach(k => kanaValues.push([id, k.text]));
                }
            });

            // Exécution des requêtes d'insertion
            if (mainValues.length > 0) {
                await pool.query('INSERT INTO dictionary (id, part_of_speech) VALUES ?', [mainValues]);
            }
            if (kanjiValues.length > 0) {
                await pool.query('INSERT INTO dictionary_kanji (dict_id, kanji) VALUES ?', [kanjiValues]);
            }
            if (kanaValues.length > 0) {
                await pool.query('INSERT INTO dictionary_kana (dict_id, kana) VALUES ?', [kanaValues]);
            }
            if (meaningValues.length > 0) {
                await pool.query('INSERT INTO dictionary_meaning (dict_id, meaning) VALUES ?', [meaningValues]);
            }

            console.log(`Progression : ${Math.min(i + BATCH_SIZE, words.length)} / ${words.length} mots insérés.`);
        }

        console.log("Importation relationnelle terminée avec succès ! 🎉");
    } catch (error) {
        console.error("Erreur lors de l'importation :", error);
    } finally {
        await pool.end();
    }
}

importJmdict();