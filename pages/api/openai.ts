import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = req.body;

  try {
    const systemPrompt = process.env.SYSTEM_PROMPT || 'Default system prompt';

    const historyArray = Array.isArray(history) ? history : [];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyArray,
        { role: 'user', content: prompt },
      ],
    });

    const message = response.choices[0].message?.content || 'No response';
    const totalTokens = response.usage?.total_tokens || 0;

    console.log('Extracted totalTokens:', totalTokens);

    res.status(200).json({ message, totalTokens });
  } catch (error) {
    console.error('Error during OpenAI submission:', error);
    res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
  }
} 