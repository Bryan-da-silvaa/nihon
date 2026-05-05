import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-3.0-flash",
    "gemini-3-flash-preview"
  ];

  console.log("--- Audit détaillé des modèles ---");
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("Hi");
      console.log(`✅ ${m} : OK`);
    } catch (e) {
      // On affiche l'erreur pour comprendre pourquoi ça échoue
      console.log(`❌ ${m} : ÉCHEC -> ${e.message}`);
    }
  }
}

listModels();
