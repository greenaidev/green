import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import { checkTokenBalance } from '@/app/utils/helpers';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

const TOKEN_TICKER = process.env.TOKEN_TICKER || 'GERTA';

export async function POST(request: Request) {
  try {
    const { walletAddress, signatureVerified } = await request.json();

    if (!signatureVerified) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (process.env.TOKEN_ADDRESS?.trim()) {
      try {
        const requiredAmount = Number(process.env.TOKEN_AMOUNT);
        if (isNaN(requiredAmount)) {
          return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
        }

        const hasRequiredTokens = await checkTokenBalance(
          walletAddress,
          process.env.TOKEN_ADDRESS,
          requiredAmount
        );

        if (!hasRequiredTokens) {
          return NextResponse.json({ message: "Insufficient token balance" }, { status: 403 });
        }

        console.log(`User: ${walletAddress}\n${TOKEN_TICKER}: ${requiredAmount}`);

        try {
          const key = `user:${walletAddress}`;
          await redis.hmset(key, {
            user: walletAddress,
            [TOKEN_TICKER]: requiredAmount.toString()
          });
          console.log('POST /api/redis/update 200');
        } catch {
          // Continue even if Redis fails
        }
      } catch {
        return NextResponse.json({ message: "Token verification failed" }, { status: 403 });
      }
    }

    const cookieStore = await cookies();
    const sessionData = {
      walletAddress,
      verified: true,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    cookieStore.set('session', CryptoJS.AES.encrypt(
      JSON.stringify(sessionData),
      process.env.SESSION_SECRET
    ).toString(), {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({ message: "Session set successfully" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}