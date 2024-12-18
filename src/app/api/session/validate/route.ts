import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "No session found" }, { status: 401 });
    }

    // Decrypt the session cookie
    const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    const session = JSON.parse(decryptedData);

    if (!session || Date.now() > session.expiresAt) {
      // Clear the expired cookie
      cookieStore.set('session', '', {
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    // Only validate session with signature if TOKEN_ADDRESS is not set
    if (!process.env.TOKEN_ADDRESS?.trim()) {
      return NextResponse.json({ message: "Session valid", user: session });
    }

    return NextResponse.json({ message: "Session valid", user: session });
  } catch (error) {
    console.error('Error validating session:', error);
    // Clear the cookie on error as well
    const cookieStore = await cookies();
    cookieStore.set('session', '', {
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 