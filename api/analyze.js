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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // set in Vercel project env
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  prompt ||
                  'Extract and summarize the nutritional label. Show protein, calories, carbs, fats. If a price is included, calculate protein per dollar and calories per dollar.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: image_url,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await openAiRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const responseText = data.choices?.[0]?.message?.content || 'No response from model.';
    const finalOutput = price
      ? `${responseText}\n\nUser-entered price: $${price}`
      : responseText;

    return res.status(200).json({ result: finalOutput });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}