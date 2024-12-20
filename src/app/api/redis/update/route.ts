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
      telegramAuthDate,
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
      userData.telegramAuthDate = telegramAuthDate || '';
      userData.lastUpdate = lastUpdate || Date.now().toString();
    }

    try {
      // Update Redis
      await redis.hmset(key, userData);
      console.log('Redis update successful for user:', walletAddress);

      // Fetch the updated data for verification
      const updatedData = await redis.hgetall(key);
      console.log('Updated Redis data:', updatedData);

      return NextResponse.json({ 
        success: true, 
        message: 'Data updated successfully',
        data: updatedData 
      });
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error';
      if (errorMessage.includes('max daily request limit exceeded')) {
        console.log('Redis rate limit exceeded for user:', walletAddress);
        return NextResponse.json({ 
          success: true, 
          message: 'Operation completed but data not stored',
          warning: 'Rate limit exceeded',
          data: userData
        });
      }
      throw redisError;
    }
  } catch (error) {
    console.error('Redis update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 