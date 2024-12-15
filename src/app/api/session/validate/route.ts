import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    console.log('Session Cookie:', sessionCookie);

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: "No session found" }, { status: 401 });
    }

    // Decrypt the session cookie
    const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    // Parse the decrypted data
    const session = JSON.parse(decryptedData);

    if (!session || Date.now() > session.expiresAt) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({ message: "Session valid", user: session });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 