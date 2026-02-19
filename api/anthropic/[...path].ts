import type { VercelRequest, VercelResponse } from '@vercel/node';

const ANTHROPIC_BASE = 'https://api.anthropic.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  // Reconstruct the Anthropic path from the catch-all segments
  const segments = req.query.path;
  const subPath = Array.isArray(segments) ? segments.join('/') : segments ?? '';
  const url = `${ANTHROPIC_BASE}/${subPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status);

    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    return res.send(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy request failed';
    return res.status(502).json({ error: message });
  }
}
