import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;
    const systemPrompt = process.env.DALLE_SYSTEM_PROMPT || '';

    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt:', prompt);
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Failed to generate meme' },
        { status: 500 }
      );
    }

    console.log('Meme generated successfully:', imageUrl);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error generating meme:', error);
    return NextResponse.json(
      { error: 'Failed to generate meme' },
      { status: 500 }
    );
  }
} 