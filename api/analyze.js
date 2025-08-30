export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse req.body if it's still a string
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }

    // Destructure data from the parsed body
    const { image_url, prompt, price } = body;

    if (!image_url) {
      return res.status(400).json({ error: 'Missing image_url' });
    }

    // Call OpenAI with gpt-4o + vision
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
                text:
                  prompt ||
                  'Extract and summarize the protein, calories, carbs, and fats from this nutrition label.',
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

    const responseText = data.choices?.[0]?.message?.content || 'No response received.';

    const finalResponse = price
      ? `${responseText}\n\n🟡 User-entered price: $${price}`
      : responseText;

    res.status(200).json({ result: finalResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}