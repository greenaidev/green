import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import winston from 'winston';
import { checkTokenBalance, TokenError } from '@/app/utils/helpers';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export async function POST(request: Request) {
  try {
    const { walletAddress, signatureVerified } = await request.json();

    if (!signatureVerified) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Check token balance only if TOKEN_ADDRESS is set and not empty
    if (process.env.TOKEN_ADDRESS?.trim()) {
      try {
        const tokenAmount = Number(process.env.TOKEN_AMOUNT);
        
        console.log('Token check configuration:', {
          address: process.env.TOKEN_ADDRESS,
          amount: tokenAmount,
          wallet: walletAddress
        });

        if (isNaN(tokenAmount)) {
          logger.error('Invalid TOKEN_AMOUNT configuration');
          return NextResponse.json(
            { message: "Server configuration error" },
            { status: 500 }
          );
        }

        const hasRequiredTokens = await checkTokenBalance(
          walletAddress,
          process.env.TOKEN_ADDRESS,
          tokenAmount
        );

        console.log('Token check result:', {
          hasRequiredTokens,
          wallet: walletAddress
        });

        if (!hasRequiredTokens) {
          return NextResponse.json(
            { message: "Insufficient token balance or no tokens found" },
            { status: 403 }
          );
        }
      } catch (error) {
        logger.warn('Token check failed:', { error, wallet: walletAddress });
        return NextResponse.json(
          { message: "Unable to verify token balance. Please try again." },
          { status: 403 }
        );
      }
    }

    const cookieStore = await cookies();
    const sessionData = {
      walletAddress,
      verified: true,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
    };

    // Encrypt data
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(sessionData),
      process.env.SESSION_SECRET
    ).toString();

    // Set encrypted cookie
    cookieStore.set('session', encryptedData, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({ message: "Session set successfully" });
  } catch (error) {
    logger.error('Error setting session:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}