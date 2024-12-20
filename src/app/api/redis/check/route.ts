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
      // Test Redis connection
      const pingResult = await redis.ping();
      const connectionStatus = pingResult === 'PONG' ? 'success' : 'failed';

      // Get data if connection is successful
      if (connectionStatus === 'success') {
        const data = await redis.hgetall(key);
        return NextResponse.json({
          success: true,
          connection: connectionStatus,
          data: data || null
        });
      } else {
        return NextResponse.json({
          success: false,
          connection: 'failed',
          error: 'Redis connection failed'
        }, { status: 500 });
      }
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error';
      if (errorMessage.includes('max daily request limit exceeded')) {
        return NextResponse.json({ 
          success: false,
          connection: 'unknown',
          warning: 'Rate limit exceeded'
        });
      }
      throw redisError;
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check Redis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 