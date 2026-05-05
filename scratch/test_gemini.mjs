import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		const result = await model.generateContent("Hello");
		const response = await result.response;
		console.log("✅ Connexion réussie:", response.text());
	} catch (err) {
		console.error("❌ Erreur:", err.message);
		console.log("On essaie avec 'gemini-pro'...");
		try {
			const model = genAI.getGenerativeModel({ model: "gemini-pro" });
			const result = await model.generateContent("Hello");
			const response = await result.response;
			console.log("✅ Connexion réussie avec 'gemini-pro':", response.text());
		} catch (err2) {
			console.error("❌ Erreur encore:", err2.message);
		}
	}
}

test();
