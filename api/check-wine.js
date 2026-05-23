import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wineInfo, userNotes } = req.body;

  if (!wineInfo || !userNotes) {
    return res.status(400).json({ error: 'Missing wineInfo or userNotes' });
  }

  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prompt 1: Expert analyse
    const expertPrompt = `Je bent een WSET Level 2 sommelier. Analyseer deze wijn in 4-5 lijnen:
${wineInfo.naam} ${wineInfo.jaar} - ${wineInfo.druif} - ${wineInfo.regio}

Wat maakt deze wijn bijzonder? Schrijf professioneel maar begrijpelijk.`;

    const expertResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: expertPrompt }] }]
    });

    const expertNotes = expertResponse.text;

    // Prompt 2: Vergelijking + score + feedback
    const comparisonPrompt = `Je expert analyse:
${expertNotes}

Student notitie:
${userNotes}

Geef EXACT in dit format (met **):

**EXPERT ANALYSE**
[2-3 zinnen wat deze wijn bijzonder maakt]

**SCORE: X/10**
[1 zin waarom]

**FEEDBACK**
✓ Goed: [1 ding dat goed opviel]
△ Beter: [1 ding om te verbeteren]
→ Tip: [1 leertip]`;

    const feedbackResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: comparisonPrompt }] }]
    });

    const feedback = feedbackResponse.text;
    const scoreMatch = feedback.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    return res.status(200).json({
      feedback,
      score
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}