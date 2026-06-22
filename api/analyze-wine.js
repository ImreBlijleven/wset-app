import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType, analyzeType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Missing imageBase64 or mediaType' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const ai = new GoogleGenAI({ apiKey });

    if (analyzeType === 'label') {

      // Stap 1: Label scannen met 2.0 Flash — JSON output geforceerd
      const wijnAfbeelding = {
        inlineData: { data: imageBase64, mimeType: mediaType }
      };

      const labelResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          wijnAfbeelding,
          'Analyseer dit wijnlabel. Extraheer de volgende informatie en zet het om in een clean JSON-object met de velden: "naam" (wijnnaam), "druif", "jaar", "regio", "producent". Zet null voor ontbrekende velden.'
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let extracted = {};
      try {
        extracted = JSON.parse(labelResponse.text);
      } catch {
        const match = (labelResponse.text ?? '').match(/\{[\s\S]*\}/);
        if (match) extracted = JSON.parse(match[0]);
      }

      // Stap 2: Online zoeken via Google Search Grounding met 2.0 Flash
      const zoekPrompt = `Zoek uitgebreide informatie over deze wijn: ${JSON.stringify(extracted)}.
Geef een JSON object terug met de velden: naam (volledige wijnnaam), druif (druivenras of -rassen), jaar (oogstjaar of null), regio (regio/appellation), type (rood/wit/rosé/schuim/dessert), beschrijving (1-2 zinnen wat de wijn bijzonder maakt), confidence (high/medium/low).
Antwoord ALLEEN met het JSON object, geen andere tekst.`;

      const infoResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: zoekPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let enriched = {};
      try {
        enriched = JSON.parse(infoResponse.text ?? '{}');
      } catch {
        const match = (infoResponse.text ?? '').match(/\{[\s\S]*\}/);
        if (match) enriched = JSON.parse(match[0]);
      }

      return res.status(200).json({
        naam: enriched.naam || extracted.naam || null,
        druif: enriched.druif || extracted.druif || null,
        jaar: enriched.jaar || extracted.jaar || null,
        regio: enriched.regio || extracted.regio || null,
        type: enriched.type || null,
        beschrijving: enriched.beschrijving || null,
        confidence: enriched.confidence || 'medium'
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
