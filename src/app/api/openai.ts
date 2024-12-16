import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.error('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = req.body;

  try {
    const { Configuration, OpenAIApi } = await import('openai');
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const systemPrompt = fs.readFileSync(path.resolve('./system-prompt.txt'), 'utf-8');
    console.log('System prompt loaded successfully');

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: prompt },
      ],
    });

    const message = response.data.choices[0].message?.content || 'No response';
    console.log('OpenAI response received:', message);

    res.status(200).json({ message });
  } catch (error) {
    console.error('Error during OpenAI request:', error);
    res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
  }
} 