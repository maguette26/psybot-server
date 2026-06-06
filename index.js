import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import process from "process";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// =====================
// MÉMOIRE SIMPLE (USER)
// =====================
const memory = {}; // userId -> history

app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  const id = userId || "guest";

  if (!memory[id]) memory[id] = [];

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
Tu es PsyBot, un assistant psychologique.

⚠️ MODE THÉRAPEUTE STRUCTURÉ :
- Toujours répondre en 3 parties :

1. 🧠 Analyse émotionnelle
2. 💬 Réponse empathique
3. 🌱 Conseils pratiques (étapes claires)

Style :
- doux, humain
- phrases courtes
- jamais jugeant

Tu dois aider la personne à comprendre ses émotions et proposer des actions concrètes.
      `,
    });

    // ajouter mémoire
    memory[id].push({
      role: "user",
      parts: [{ text: message }],
    });

    const result = await model.generateContent({
      contents: memory[id],
    });

    const reply = result.response.text();

    memory[id].push({
      role: "model",
      parts: [{ text: reply }],
    });

    res.json({ reply });
  } catch (error) {
    console.log(error);

    if (error?.status === 429) {
      return res.json({
        reply: "⏳ Limite atteinte. Réessaie dans quelques minutes.",
      });
    }

    res.json({
      reply: "Une Erreur temporaire s'est produite😢",
    });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log("PsyBot backend running 🚀")
);