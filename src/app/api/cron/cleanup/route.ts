import { NextResponse } from 'next/server';
import { Telegram } from 'telegraf';
import { getAllUsers, setUserData } from '@/services/redisService';
import { AppError } from '@/types/errors';

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN!);
const chatId = process.env.TELEGRAM_GROUP_ID!;

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  console.log('Starting cleanup job');
  
  try {
    // Get all users from Redis
    const users = await getAllUsers();
    console.log(`Found ${Object.keys(users).length} users in Redis`);
    
    if (!users || Object.keys(users).length === 0) {
      console.log('No users to process');
      return NextResponse.json({ message: 'No users to process' });
    }
    
    try {
      // Get all chat members
      const memberUpdates = await Promise.all(
        Object.entries(users).map(async ([wallet, userData]) => {
          if (!userData.telegramId) {
            console.log(`No Telegram ID for wallet ${wallet}, skipping`);
            return;
          }

          try {
            const member = await telegram.getChatMember(chatId, parseInt(userData.telegramId, 10));
            console.log(`Member status for ${wallet}:`, member.status);
            
            // Update user data if membership status has changed
            const isCurrentlyMember = userData.groupMember;
            const shouldBeMember = member.status === 'member' || member.status === 'administrator' || member.status === 'creator';
            
            if (isCurrentlyMember !== shouldBeMember) {
              console.log(`Updating membership status for ${wallet} from ${isCurrentlyMember} to ${shouldBeMember}`);
              await setUserData(wallet, {
                ...userData,
                groupMember: shouldBeMember
              });
            }
          } catch (error) {
            const appError = error as AppError;
            console.error(`Error checking member ${wallet}:`, appError);
            // If user is not found in the group, update their status
            if (userData.groupMember) {
              console.log(`User ${wallet} not found in group, updating status`);
              await setUserData(wallet, {
                ...userData,
                groupMember: false
              });
            }
          }
        })
      );
      
      console.log('Cleanup completed');
      return NextResponse.json({ 
        message: 'Cleanup completed',
        processed: memberUpdates.length
      });
      
    } catch (error) {
      const appError = error as AppError;
      console.error('Error getting chat members:', appError);
      return NextResponse.json({ 
        error: 'Failed to get chat members',
        details: appError.message || 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    const appError = error as AppError;
    console.error('Error during cleanup:', appError);
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: appError.message || 'Unknown error'
    }, { status: 500 });
  }
} 