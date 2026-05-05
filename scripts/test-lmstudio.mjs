const LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions";
const LOCAL_MODEL = "gemma4-26b-a4b";

async function testThinking() {
    console.log("⏳ Envoi d'une requête test à LM Studio...");
    
    try {
        const response = await fetch(LM_STUDIO_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LOCAL_MODEL,
                messages: [
                    { role: "user", content: "Explique pourquoi le ciel est bleu en 5 mots maximum. Pas de texte inutile." }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            console.log(data.choices[0].message.content);
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Erreur:", err.message);
    }
}

testThinking();
