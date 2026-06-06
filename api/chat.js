import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const memory = {};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, userId } = req.body;
  const id = userId || "guest";

  if (!memory[id]) memory[id] = [];

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    systemInstruction: `
Tu es PsyBot, un assistant professionnel spécialisé en santé mentale.

Règles strictes :
- Réponds UNIQUEMENT à ce que la personne exprime ou demande
- Sois empathique, chaleureux mais professionnel
- Pas de structure rigide imposée — adapte ta réponse au contexte
- Si la personne pose une question simple, réponds simplement
- Si elle exprime une émotion, accueille-la d'abord avant de conseiller
- Utilise un langage clair, sans jargon médical
- Ne pose qu'UNE seule question de suivi à la fois
 

Tu n'es PAS un robot structuré. Tu es un interlocuteur attentif et bienveillant.
`
    });

    memory[id].push({ role: "user", parts: [{ text: message }] });

    const result = await model.generateContent({ contents: memory[id] });
    const reply = result.response.text();

    memory[id].push({ role: "model", parts: [{ text: reply }] });

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);
    if (error?.status === 429) {
      return res.status(200).json({ reply: "⏳ Limite atteinte. Réessaie dans quelques minutes." });
    }
    return res.status(200).json({ reply: "Une erreur temporaire s'est produite 😢" });
  }
}