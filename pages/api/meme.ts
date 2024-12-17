import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received meme request:', req.method, req.body);

  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const systemPrompt = process.env.DALLE_SYSTEM_PROMPT || '';

  if (!prompt || typeof prompt !== 'string') {
    console.error('Invalid prompt:', prompt);
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    const combinedPrompt = `${systemPrompt} ${prompt}`;
    console.log('Generating meme with prompt:', combinedPrompt);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: combinedPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
      quality: 'hd',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      console.error('Failed to generate meme, no URL returned');
      return res.status(500).json({ error: 'Failed to generate meme' });
    }

    console.log('Meme generated successfully:', imageUrl);
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error generating meme:', error);
    res.status(500).json({ error: 'Failed to generate meme' });
  }
} 