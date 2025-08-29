// POST /api/analyze  (Vercel serverless function)
export default async function handler(req, res) {
  const ORIGIN = 'https://ferndiggity.github.io'; // your Pages origin

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_url, prompt } = req.body || {};
    if (!image_url) return res.status(400).json({ error: 'image_url required' });

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or 'gpt-4o'
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: prompt || 'Analyze this image briefly.' },
            { type: 'input_image', image_url } // can be data: URL or https URL
          ]
        }]
      })
    });

    const data = await r.json();
    const text =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.response?.output_text ??
      JSON.stringify(data);

    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    return res.status(200).json({ result: text });
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    return res.status(500).json({ error: String(err) });
  }
}
