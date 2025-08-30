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
        model: 'gpt-4-1106-vision',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || 'Analyze the nutritional label and provide total protein, calories, carbs, and fats.' },
              { type: 'image_url', image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: 800,
      }),
    });

    const data = await openAiRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const responseText = data.choices?.[0]?.message?.content || 'No description';
    const finalResponse = price
      ? `${responseText}\n\nUser-entered price: $${price}`
      : responseText;

    res.status(200).json({ result: finalResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}