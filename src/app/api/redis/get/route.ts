import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
    }

    try {
      const data = await redis.hgetall(key);
      
      if (!data || Object.keys(data).length === 0) {
        return NextResponse.json({ success: false, data: null });
      }

      return NextResponse.json({ success: true, data });

    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error';
      if (errorMessage.includes('max daily request limit exceeded')) {
        return NextResponse.json({ 
          success: false, 
          data: null,
          warning: 'Rate limit exceeded'
        });
      }
      throw redisError;
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch from Redis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 