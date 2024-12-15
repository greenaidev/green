import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import winston from 'winston';

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

    const cookieStore = await cookies();
    const sessionData = {
      walletAddress,
      verified: true,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
    };

    // Encrypt data
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(sessionData), process.env.SESSION_SECRET).toString();

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
    logger.error('Error validating session:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}