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

    const wijnLabel = [wineInfo.naam, wineInfo.jaar, wineInfo.druif, wineInfo.regio]
      .filter(Boolean).join(', ');

    // Stap 1: Verificatie — is de wijn herkenbaar?
    const verifyPrompt = `Is de wijn "${wijnLabel}" een specifieke, bestaande wijn die jij met zekerheid kunt identificeren?

Antwoord UITSLUITEND met dit JSON (geen markdown, geen extra tekst):
{"known": true, "confidence": "high", "identified_as": "volledige naam van de wijn"}
of
{"known": false, "reason": "korte reden waarom niet"}`;

    const verifyResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: verifyPrompt }] }]
    });

    const verifyText = verifyResponse.text;
    const verifyJson = verifyText.match(/\{[\s\S]*\}/);
    if (!verifyJson) throw new Error('Verificatie mislukt');

    const verify = JSON.parse(verifyJson[0]);

    if (!verify.known || verify.confidence === 'low') {
      return res.status(200).json({
        error: 'wine_not_found',
        message: verify.reason || 'De wijn kon niet worden herkend. Vul de wijninfo vollediger in (naam, druif, regio, jaar) om een goede beoordeling te krijgen.'
      });
    }

    // Stap 2: Expert analyse op basis van de herkende wijn
    const expertPrompt = `Je bent een WSET Level 2 sommelier. Analyseer de wijn "${verify.identified_as}" in 4-5 zinnen.

Wat maakt deze wijn bijzonder? Schrijf professioneel maar begrijpelijk.`;

    const expertResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: expertPrompt }] }]
    });

    const expertNotes = expertResponse.text;

    // Stap 3: Vergelijking + score + feedback
    const comparisonPrompt = `Je expert analyse van "${verify.identified_as}":
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
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: comparisonPrompt }] }]
    });

    const feedback = feedbackResponse.text;
    const scoreMatch = feedback.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    return res.status(200).json({ feedback, score });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
