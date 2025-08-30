export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const rawBody = Buffer.concat(buffers).toString();
    let parsedBody;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { image_url, prompt, price } = parsedBody;

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
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'Extract and summarize nutritional values: calories, protein, carbs, fats.',
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

    const responseText = data.choices?.[0]?.message?.content || 'No description found.';
    const finalResult = price
      ? `${responseText}\n\nUser-entered price: $${price}`
      : responseText;

    res.status(200).json({ result: finalResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}