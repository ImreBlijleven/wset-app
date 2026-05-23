import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Alleen POST requests toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType, analyzeType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Missing imageBase64 or mediaType' });
  }

  try {
    // API key leest van server (VEILIG!)
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (analyzeType === 'label') {
      // Etiket scanning
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
              text: 'Analyseer dit wijnetiket. Geef ALLEEN een JSON object (geen markdown, geen backticks) met deze velden: naam, druif, jaar, regio, type. Zet null voor onleesbare velden.'
            }
          ]
        }]
      });

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Kon JSON niet uit respons halen');
      
      return res.status(200).json(JSON.parse(jsonMatch[0]));
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}