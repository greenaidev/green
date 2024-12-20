import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

const TOKEN_TICKER = process.env.TOKEN_TICKER || 'GERTA';

export async function POST(request: Request) {
  try {
    const { 
      walletAddress, 
      tokenBalance,
      telegramId,
      telegramUsername,
      telegramFirstName,
      telegramPhotoUrl,
      lastUpdate
    } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const key = `user:${walletAddress}`;
    const userData: Record<string, string> = {
      user: walletAddress,
    };

    // Add token balance if provided
    if (tokenBalance !== undefined) {
      userData[TOKEN_TICKER] = tokenBalance.toString();
    }

    // Add Telegram data if provided
    if (telegramId) {
      userData.telegramId = telegramId;
      userData.telegramUsername = telegramUsername || '';
      userData.telegramFirstName = telegramFirstName || '';
      userData.telegramPhotoUrl = telegramPhotoUrl || '';
      userData.lastUpdate = lastUpdate || Date.now().toString();
    }

    try {
      const result = await redis.hset(key, userData);
      console.log('POST /api/redis/update 200');
      return NextResponse.json({ success: true, result, data: userData });
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error';
      if (errorMessage.includes('max daily request limit exceeded')) {
        return NextResponse.json({ 
          success: true, 
          result: null, 
          data: userData,
          warning: 'Data not stored due to rate limit'
        });
      }
      throw redisError;
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update Redis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 