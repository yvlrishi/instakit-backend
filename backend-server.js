const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';

app.post('/api/grok', async (req, res) => {
  const { prompt, image } = req.body;
  if (!prompt) return res.status(400).json({ error: 'no prompt' });

  const parts = image
    ? [
        { inline_data: { mime_type: 'image/jpeg', data: image } },
        { text: prompt }
      ]
    : [{ text: prompt }];

  const model = image ? 'gemini-1.5-flash' : 'gemini-1.5-flash';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 1200 }
      })
    });

    const data = await response.json();
    console.log('Gemini status:', response.status);
    console.log('Gemini response:', JSON.stringify(data).slice(0, 300));

    if (!response.ok) return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'no response from gemini', raw: data });

    res.json({ result: text });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('instakit backend running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('server on port', PORT));
