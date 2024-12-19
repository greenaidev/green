import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt:', prompt);
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      );
    }

    console.log('Generating image with prompt:', prompt);
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
      quality: 'hd',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      console.error('Failed to generate image, no URL returned');
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    console.log('Image generated successfully:', imageUrl);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 