import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import CryptoJS from 'crypto-js';
import { getUserData } from '@/services/redisService';
import { Telegram } from 'telegraf';

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN!);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Decrypt session
    const bytes = CryptoJS.AES.decrypt(sessionCookie.value, process.env.SESSION_SECRET || '');
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    const session = JSON.parse(decryptedData);

    if (!session?.walletAddress) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Verify user data
    const userData = await getUserData(session.walletAddress);
    if (!userData?.telegramId) {
      return NextResponse.json({ error: 'Telegram not connected' }, { status: 403 });
    }

    // Create temporary invite link
    try {
      const invite = await telegram.createChatInviteLink(process.env.TELEGRAM_GROUP_ID!, {
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + 300 // 5 minutes
      });

      return NextResponse.json({ inviteLink: invite.invite_link });
    } catch (error) {
      console.error('Error creating invite link:', error);
      return NextResponse.json({ error: 'Failed to create invite link' }, { status: 500 });
    }
  } catch (error) {
    console.error('Invite generation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 