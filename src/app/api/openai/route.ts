import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, history } = body;

    const systemPrompt = process.env.SYSTEM_PROMPT || 'Default system prompt';
    const historyArray = Array.isArray(history) ? history : [];

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyArray,
        { role: 'user', content: prompt },
      ],
    });

    const message = response.choices[0].message?.content || 'No response';
    const totalTokens = response.usage?.total_tokens || 0;

    console.log('Extracted totalTokens:', totalTokens);

    return NextResponse.json({ message, totalTokens });
  } catch (error) {
    console.error('Error during OpenAI submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response from OpenAI' },
      { status: 500 }
    );
  }
} 