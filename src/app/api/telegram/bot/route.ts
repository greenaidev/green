import { NextResponse } from 'next/server';
import { Telegram } from 'telegraf';
import { getAuthState, setUserData, clearAuthState } from '@/services/redisService';
import { checkTokenBalance } from '@/app/utils/helpers';
import { AppError } from '@/types/errors';

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN!);

export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic'; // No caching

export async function POST(request: Request) {
  console.log('🤖 Bot endpoint hit:', new Date().toISOString());
  console.log('🔑 Bot token:', process.env.TELEGRAM_BOT_TOKEN);
  
  try {
    // Log request details
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📨 Request headers:', headers);
    console.log('🌐 Request URL:', request.url);
    console.log('📝 Request method:', request.method);
    
    const rawBody = await request.text();
    console.log('📄 Raw request body:', rawBody);
    
    if (!rawBody) {
      console.error('❌ Empty request body');
      return new Response('Empty request body', { status: 400 });
    }
    
    let update;
    try {
      update = JSON.parse(rawBody);
      console.log('✅ Successfully parsed update:', JSON.stringify(update, null, 2));
    } catch (error) {
      const parseError = error as AppError;
      console.error('❌ Failed to parse request body:', parseError);
      return new Response('Invalid JSON', { status: 400 });
    }
    
    // Verify we have a valid message
    if (!update?.message?.chat?.id) {
      console.error('❌ Invalid update format:', update);
      return new Response('Invalid update format', { status: 400 });
    }
    
    const chatId = update.message.chat.id;
    console.log('👤 Processing message for chat ID:', chatId);
    
    // Handle /start command with state parameter
    if (update.message?.text?.startsWith('/start')) {
      console.log('🎬 Handling /start command');
      const commandParts = update.message.text.split(' ');
      const state = commandParts[1]; // Get state from /start command
      console.log('🔑 State from command:', state);
      
      if (!state) {
        console.log('⚠️ No state provided in /start command');
        await telegram.sendMessage(
          chatId,
          'Please start the authentication from the website.'
        ).catch(error => {
          const sendError = error as AppError;
          console.error('❌ Failed to send message:', sendError);
        });
        return new Response('OK', { status: 200 });
      }

      // Get auth state
      console.log('🔍 Getting auth state for:', state);
      const authState = await getAuthState(state);
      console.log('📊 Auth state retrieved:', authState);
      
      if (!authState) {
        console.log('❌ No auth state found for state:', state);
        await telegram.sendMessage(
          chatId,
          'Invalid or expired authentication attempt. Please try again from the website.'
        ).catch(error => {
          const sendError = error as AppError;
          console.error('❌ Failed to send message:', sendError);
        });
        return new Response('OK', { status: 200 });
      }

      // Verify token balance
      try {
        console.log('💰 Checking token balance for wallet:', authState.walletAddress);
        const hasTokens = await checkTokenBalance(
          authState.walletAddress,
          process.env.TOKEN_ADDRESS!,
          Number(process.env.TOKEN_AMOUNT)
        );

        console.log('💎 Token check result:', { 
          hasTokens, 
          wallet: authState.walletAddress,
          requiredAmount: process.env.TOKEN_AMOUNT,
          tokenAddress: process.env.TOKEN_ADDRESS
        });

        if (!hasTokens) {
          console.log('❌ Insufficient tokens for wallet:', authState.walletAddress);
          await telegram.sendMessage(
            chatId,
            `Insufficient token balance. Required: ${process.env.TOKEN_AMOUNT} ${process.env.TOKEN_TICKER}`
          ).catch(error => {
            const sendError = error as AppError;
            console.error('❌ Failed to send message:', sendError);
          });
          await clearAuthState(state);
          return new Response('OK', { status: 200 });
        }

        // Create temporary invite link
        console.log('🔗 Creating invite link for group:', process.env.TELEGRAM_GROUP_ID);
        const invite = await telegram.createChatInviteLink(process.env.TELEGRAM_GROUP_ID!, {
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 300 // 5 minutes
        }).catch(error => {
          const inviteError = error as AppError;
          console.error('❌ Failed to create invite link:', inviteError);
          throw inviteError;
        });
        console.log('✨ Invite link created:', invite.invite_link);

        // Update user data with Telegram info
        console.log('📝 Updating user data for wallet:', authState.walletAddress);
        await setUserData(authState.walletAddress, {
          telegramId: update.message.from.id.toString(),
          telegramUsername: update.message.from.username,
          groupMember: false
        }).catch(error => {
          const updateError = error as AppError;
          console.error('❌ Failed to update user data:', updateError);
          throw updateError;
        });

        // Clear the auth state
        console.log('🧹 Clearing auth state for:', state);
        await clearAuthState(state).catch(error => {
          const clearError = error as AppError;
          console.error('❌ Failed to clear auth state:', clearError);
          throw clearError;
        });

        // Send success message with group link
        console.log('📨 Sending success message with invite link');
        await telegram.sendMessage(
          chatId,
          'Verification successful! Click below to join the group:',
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: 'Join Group',
                  url: invite.invite_link
                }
              ]]
            }
          }
        ).catch(error => {
          const sendError = error as AppError;
          console.error('❌ Failed to send success message:', sendError);
          throw sendError;
        });

        console.log('✅ Successfully completed /start flow');
        return new Response('OK', { status: 200 });
      } catch (error) {
        const verifyError = error as AppError;
        console.error('❌ Verification error:', verifyError);
        await telegram.sendMessage(
          chatId,
          'Error during verification. Please try again.'
        ).catch(error => {
          const sendError = error as AppError;
          console.error('❌ Failed to send error message:', sendError);
        });
        await clearAuthState(state).catch(error => {
          const clearError = error as AppError;
          console.error('❌ Failed to clear auth state:', clearError);
        });
        return new Response('Verification error', { status: 500 });
      }
    } else {
      console.log('ℹ️ Not a /start command:', update.message?.text);
      return new Response('OK', { status: 200 });
    }
  } catch (error) {
    const botError = error as AppError;
    console.error('❌ Bot error:', botError);
    return new Response(botError.message || 'Unknown error', { status: 500 });
  }
}

// Webhook setup endpoint
export async function GET(request: Request) {
  console.log('🔍 GET request received:', new Date().toISOString());
  console.log('📨 Headers:', Object.fromEntries(request.headers.entries()));
  console.log('🌐 URL:', request.url);
  
  try {
    const url = new URL(request.url);
    const setupWebhook = url.searchParams.get('setup') === 'true';
    
    if (setupWebhook) {
      const webhookUrl = `${process.env.WEBAPP_URL}/api/telegram/bot`;
      console.log('🔧 Setting webhook URL:', webhookUrl);
      
      // Delete any existing webhook first
      await telegram.deleteWebhook({ drop_pending_updates: true });
      
      // Set new webhook
      const result = await telegram.setWebhook(webhookUrl, {
        allowed_updates: ['message'],
        drop_pending_updates: true
      });
      console.log('✅ Webhook set result:', result);
      
      // Verify webhook was set
      const webhookInfo = await telegram.getWebhookInfo();
      console.log('ℹ️ Webhook info:', webhookInfo);
      
      return NextResponse.json({ 
        message: 'Webhook set',
        webhookInfo,
        result
      });
    }
    
    return NextResponse.json({ message: 'Bot endpoint' });
  } catch (error) {
    const webhookError = error as AppError;
    console.error('❌ Webhook setup error:', webhookError);
    return NextResponse.json({ 
      error: 'Webhook setup failed',
      details: webhookError.message || 'Unknown error'
    }, { status: 500 });
  }
} 