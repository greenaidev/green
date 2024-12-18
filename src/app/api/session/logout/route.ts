import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the cookie by setting it with an expired date
  cookieStore.set('session', '', {
    expires: new Date(0), // Set to epoch time to ensure immediate expiration
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
  });

  return NextResponse.json({ message: "Logged out successfully" });
} 