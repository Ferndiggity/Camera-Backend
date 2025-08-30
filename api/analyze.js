export default async function handler(req, res) {
  try {
    const { image_url, prompt, price } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Missing image_url' });
    }

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  prompt ||
                  'Analyze this nutrition label. Extract calories, protein, carbs, fat, and compute protein per dollar and per 100 calories.',
              },
              {
                type: 'image_url',
                image_url: { url: image_url },
              },
            ],
          },
        ],
        max_tokens: 800,
      }),
    });

    const data = await openAiRes.json();

    if (!openAiRes.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: data.error?.message || 'OpenAI API request failed' });
    }

    const responseText = data.choices?.[0]?.message?.content || 'No result from GPT.';
    const finalOutput = price
      ? `${responseText}\n\n💵 User-entered price: $${price}`
      : responseText;

    res.status(200).json({ result: finalOutput });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
}