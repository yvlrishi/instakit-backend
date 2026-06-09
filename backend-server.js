const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'your-groq-api-key-here';

app.post('/api/grok', async (req, res) => {
  const { prompt, image } = req.body;
  if (!prompt) return res.status(400).json({ error: 'no prompt' });

  const content = image
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
        { type: 'text', text: prompt }
      ]
    : prompt;

  const model = image ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        max_tokens: 1200
      })
    });

    const data = await response.json();
    console.log('Groq status:', response.status);
    console.log('Groq response:', JSON.stringify(data).slice(0, 300));

    if (!response.ok) return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    if (data.error) return res.status(500).json({ error: data.error.message });

    res.json({ result: data.choices[0].message.content });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('instakit backend running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('server on port', PORT));
