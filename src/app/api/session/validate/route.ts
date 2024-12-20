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

    try {
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

      return NextResponse.json({ message: "Session valid", user: session });
    } catch {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 