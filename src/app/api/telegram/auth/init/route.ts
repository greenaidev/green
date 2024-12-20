import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import { setAuthState } from '@/services/redisService';
import { AppError } from '@/types/errors';

export async function POST(request: Request) {
  try {
    const { walletAddress, state } = await request.json();
    
    if (!walletAddress || !state) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Verify session matches wallet address
    try {
      const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET || '');
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      const session = JSON.parse(decryptedData);

      if (session.walletAddress !== walletAddress) {
        return NextResponse.json({ error: 'Session mismatch' }, { status: 401 });
      }

      // Store auth state with timestamp
      await setAuthState(state, {
        walletAddress,
        timestamp: Date.now()
      });

      console.log('Auth state set:', { state, walletAddress });

      return NextResponse.json({ success: true });
    } catch (error) {
      const appError = error as AppError;
      console.error('Session verification error:', appError);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } catch (error) {
    const appError = error as AppError;
    console.error('Auth init error:', appError);
    return NextResponse.json({ 
      error: 'Auth initialization failed',
      details: process.env.NODE_ENV === 'development' ? appError.message : undefined
    }, { status: 500 });
  }
} 