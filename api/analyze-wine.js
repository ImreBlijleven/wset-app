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
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (analyzeType === 'label') {

      // Stap 1: Lees alle tekst en zichtbare informatie van het etiket
      const extractResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mediaType,
                data: imageBase64
              }
            },
            {
              text: `Lees alle tekst van dit wijnetiket zo nauwkeurig mogelijk.
Geef ALLEEN een JSON object (geen markdown, geen backticks):
{
  "raw_name": "naam op het etiket",
  "producer": "wijnhuis/producent",
  "vintage": "oogstjaar of null",
  "appellation": "appellation/denominatie op het etiket of null",
  "region": "regio op het etiket of null",
  "country": "land op het etiket of null",
  "grape": "druif als vermeld op het etiket of null",
  "other": "andere relevante tekst"
}`
            }
          ]
        }]
      });

      const extractMatch = extractResponse.text.match(/\{[\s\S]*\}/);
      if (!extractMatch) throw new Error('Kon etikettekst niet lezen');
      const extracted = JSON.parse(extractMatch[0]);

      // Stap 2: Identificeer de wijn op basis van de etikettekst en Gemini's wijnkennis
      const enrichPrompt = `Op basis van dit wijnetiket:
${JSON.stringify(extracted, null, 2)}

Identificeer deze specifieke wijn met behulp van je wijnkennis. Gebruik de etikettekst als uitgangspunt en vul ontbrekende informatie aan vanuit je kennis over deze producent/appellation/wijnstijl.

Geef ALLEEN een JSON object (geen markdown, geen backticks):
{
  "naam": "volledige wijnnaam zoals bekend in de wijnwereld",
  "druif": "druivenras of -rassen (bijv. Cabernet Sauvignon of Grenache/Syrah/Mourvèdre)",
  "jaar": "oogstjaar als string of null",
  "regio": "regio en appellation (bijv. Pauillac, Bordeaux)",
  "type": "rood/wit/rosé/schuim/dessert",
  "producent": "naam van het wijnhuis",
  "land": "land van herkomst",
  "beschrijving": "1-2 zinnen over wat deze wijn bijzonder maakt",
  "confidence": "high/medium/low"
}`;

      const enrichResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: enrichPrompt }] }]
      });

      const enrichMatch = enrichResponse.text.match(/\{[\s\S]*\}/);
      if (!enrichMatch) throw new Error('Kon wijn niet identificeren');
      const enriched = JSON.parse(enrichMatch[0]);

      return res.status(200).json(enriched);
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
