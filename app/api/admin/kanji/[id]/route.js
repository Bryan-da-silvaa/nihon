import { query } from "@/lib/db";

export async function PUT(request, { params }) {
	const { id } = await params;
	const { meanings_fr } = await request.json();

	try {
		// On sauvegarde en format JSON string
		const meaningsJson = JSON.stringify(meanings_fr);
		
		await query(
			"UPDATE kanji_data SET meanings_fr = ? WHERE id = ?",
			[meaningsJson, id]
		);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error updating kanji:", error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
