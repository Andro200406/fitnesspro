import express from "express";
import OpenAI from "openai";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// ✅ OpenRouter client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "AI Fitness Coach",
  },
});

const detectLanguage = (text) => {
  if (!text) return "en";

  const lower = text.toLowerCase().trim();

  // 1️⃣ Native scripts (highest priority)
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi

  // 2️⃣ Roman Hindi sentence patterns
  const hindiPatterns = [
    /\bmujhe\b/,
    /\bmera\b/,
    /\bmeri\b/,
    /\bhai\b/,
    /\bnahi\b/,
    /\bkyun\b/,
    /\bkaise\b/
  ];

  if (hindiPatterns.some(rx => rx.test(lower))) {
    return "hi";
  }

  // 3️⃣ Roman Tamil sentence patterns
  const tamilPatterns = [
    /\bennaku\b/,
    /\benna\b/,
    /\biruku\b/,
    /\bromba\b/,
    /\bvalikuthu\b/,
    /\bseiyanum\b/
  ];

  if (tamilPatterns.some(rx => rx.test(lower))) {
    return "ta";
  }

  // 4️⃣ Default = English
  return "en";
};




router.post("/coach", async (req, res) => {
  try {
    console.log("🔥 AI COACH HIT");

    const { message, userProfile, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!message || !userProfile) {
      return res.status(400).json({ error: "Missing message or userProfile" });
    }

    const language = detectLanguage(message);

    const languageInstruction = {
      en: "Reply only in clear, friendly English.",
      ta: "பதில் முழுவதும் தமிழில் மட்டும் எழுதுங்கள். எளிமையாகவும் நட்பாகவும் எழுதுங்கள்.",
      hi: "केवल हिंदी में उत्तर दें। सरल और दोस्ताना भाषा का उपयोग करें।"
    };


    const systemPrompt = `
You are an expert AI Fitness Coach inside a premium fitness app.

User Profile:
Age: ${userProfile.age}
Gender: ${userProfile.gender}
Height: ${userProfile.height_cm} cm
Weight: ${userProfile.weight_kg} kg
Goal: ${userProfile.goal}
Activity Level: ${userProfile.activity_level}
Diet Type: ${userProfile.diet_type}
Medical Conditions:
${(userProfile.medical_conditions?.length
        ? userProfile.medical_conditions.join(", ")
        : "None")}

CRITICAL OUTPUT RULES (MANDATORY):
You MUST follow these rules exactly.

LANGUAGE RULE (ABSOLUTE):
You MUST reply ONLY in this language: ${language.toUpperCase()}.

If language is EN:
Use ONLY English words.
Do NOT include Hindi or Tamil words.

If language is HI:
Use ONLY Hindi (Devanagari or natural Hinglish).
Do NOT include English sentences.

If language is TA:
Use ONLY Tamil (Tamil script or natural Thanglish).
Do NOT include English sentences.


❌ NEVER use:
- Markdown
- ###
- **
- *
- -
- bullet points
- numbered lists
- long paragraphs

✅ ALWAYS use this style ONLY:

Emoji + Short Title  
One short sentence per line  
Line breaks between ideas  
Friendly and motivating tone  

Example format you MUST follow:

💪 Today’s Focus  
Full body strength with joint safety  

🔥 Warm Up  
5 minutes of light walking  
Gentle arm circles  
Neck mobility movements  

🏋️ Strength  
Bodyweight squats if pain-free  
Wall push-ups  
Core engagement exercises  

🧘 Recovery  
Stretch gently  
Ice knee if needed  
Rest is progress  

⚠️ Safety Notes  
Stop if pain increases  
Avoid high impact  

DO NOT explain the rules.  
DO NOT apologize.  
DO NOT mention formatting.

Your job is to respond ONLY in this visual chat-friendly format.
`;


    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
await ChatMessage.create([
  { userId, role: "user", content: message },
  { userId, role: "assistant", content: reply }
]);


    res.json({ reply });


  } catch (err) {
    console.error("❌ AI COACH ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "AI Coach unavailable" });
  }
});

router.get("/coach/history/:userId", async (req, res) => {
  const { userId } = req.params;

  const history = await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json(history);
});


export default router;
