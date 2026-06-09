const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

const GROK_API_KEY = process.env.GROK_API_KEY || 'your-grok-api-key-here';

app.post('/api/grok', async (req, res) => {
  const { prompt, image } = req.body;
  if (!prompt) return res.status(400).json({ error: 'no prompt' });

  const model = image ? 'grok-2-vision-1212' : 'grok-2-1212';

  const content = image
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
        { type: 'text', text: prompt }
      ]
    : prompt;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        max_tokens: 1200
      })
    });

    const data = await response.json();
    console.log('Grok response status:', response.status);
    console.log('Grok response:', JSON.stringify(data).slice(0, 300));

    if (!response.ok) return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    if (data.error) return res.status(500).json({ error: data.error.message });
    if (!data.choices?.[0]) return res.status(500).json({ error: 'no choices in response', raw: data });

    res.json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('instakit backend running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('server on port', PORT));
