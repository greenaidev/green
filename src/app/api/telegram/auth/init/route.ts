import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import { setAuthState } from '@/services/redisService';

export async function POST(request: Request) {
  try {
    const { walletAddress, state } = await request.json();
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Verify session matches wallet address
    const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET || '');
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    const session = JSON.parse(decryptedData);

    if (session.walletAddress !== walletAddress) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Store auth state
    await setAuthState(walletAddress, state);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth init error:', error);
    return NextResponse.json({ error: 'Auth initialization failed' }, { status: 500 });
  }
} 