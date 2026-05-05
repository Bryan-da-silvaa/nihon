import { query } from "@/lib/db";

export async function GET() {
	try {
		const kanjis = await query('SELECT id, literal, meanings_en, meanings_fr FROM kanji_data');
		
		let suspiciousCount = 0;
		let errorCount = 0;
		let details = [];

		kanjis.forEach(k => {
			let isErr = false;
			let isSuspicious = false;
			let reasons = [];

			// Check Empty
			if (!k.meanings_fr || k.meanings_fr === '[]') {
				isErr = true;
				reasons.push("Traduction manquante");
			}

			// Check Validity and Content
			try {
				const fr = JSON.parse(k.meanings_fr || '[]');
				const en = JSON.parse(k.meanings_en || '[]');
				
				if (k.meanings_fr === k.meanings_en && fr.length > 0) {
					const isLikelyEnglish = fr.some(word => word.length > 5 && !['obstacle', 'condition', 'situation', 'tradition', 'millet', 'banquet'].includes(word.toLowerCase()));
					if (isLikelyEnglish) {
						isSuspicious = true;
						reasons.push("Probablement en anglais");
					}
				}
			} catch (e) {
				isErr = true;
				reasons.push("Format JSON invalide");
			}

			if (isErr) errorCount++;
			if (isSuspicious) suspiciousCount++;
			
			if (isErr || isSuspicious) {
				details.push({ id: k.id, literal: k.literal, reasons });
			}
		});

		return new Response(JSON.stringify({
			total: kanjis.length,
			errorCount,
			suspiciousCount,
			details,
			success: true
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Audit error:", error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
