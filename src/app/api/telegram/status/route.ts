import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import { getUserData } from '@/services/redisService';
import { AppError } from '@/types/errors';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({
        connected: false,
        reason: 'no_session'
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Decrypt session
      const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET || '');
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      const session = JSON.parse(decryptedData);
      const { walletAddress } = session;
      
      try {
        // Get user data
        const userData = await getUserData(walletAddress);
        
        if (!userData) {
          return NextResponse.json({
            connected: false,
            reason: 'no_user_data'
          }, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return NextResponse.json({
          connected: Boolean(userData.telegramId),
          groupMember: Boolean(userData.groupMember),
          username: userData.telegramUsername
        }, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        const appError = error as AppError;
        return NextResponse.json({
          connected: false,
          reason: 'database_error',
          error: process.env.NODE_ENV === 'development' ? appError.message : undefined
        }, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
    } catch (error) {
      const appError = error as AppError;
      return NextResponse.json({
        connected: false,
        reason: 'invalid_session',
        error: process.env.NODE_ENV === 'development' ? appError.message : undefined
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    const appError = error as AppError;
    return NextResponse.json({
      connected: false,
      reason: 'unknown_error',
      error: process.env.NODE_ENV === 'development' ? appError.message : undefined
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 