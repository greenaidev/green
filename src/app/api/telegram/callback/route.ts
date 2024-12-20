import { NextResponse } from 'next/server';
import { setUserData, getUserData, getAuthState } from '@/services/redisService';
import { Telegram } from 'telegraf';
import { AppError } from '@/types/errors';

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN!);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    
    if (!state) {
      return NextResponse.json({ error: 'No state provided' }, { status: 400 });
    }
    
    // Get auth state
    const authState = await getAuthState(state);
    if (!authState) {
      return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 });
    }
    
    // Get user data
    const userData = await getUserData(authState.walletAddress);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create temporary invite link
    const invite = await telegram.createChatInviteLink(process.env.TELEGRAM_GROUP_ID!, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    });
    
    // Update user data with Telegram info
    await setUserData(authState.walletAddress, {
      ...userData,
      groupMember: false
    });
    
    // Redirect to the invite link
    return NextResponse.redirect(invite.invite_link);
  } catch (error) {
    const appError = error as AppError;
    console.error('Telegram callback error:', appError);
    return NextResponse.json({ 
      error: 'Callback failed',
      details: appError.message || 'Unknown error'
    }, { status: 500 });
  }
} 