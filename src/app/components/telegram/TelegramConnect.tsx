"use client";

import { useEffect, useState, useCallback } from 'react';

interface TelegramConnectProps {
  walletAddress: string | null;
  onTelegramChange: (connected: boolean) => void;
  showModal: (message: string, type: "success" | "error" | "info") => void;
}

interface TelegramStatus {
  connected: boolean;
  username?: string;
  groupMember?: boolean;
}

const TelegramConnect = ({ walletAddress, onTelegramChange, showModal }: TelegramConnectProps) => {
  const [status, setStatus] = useState<TelegramStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const checkTelegramStatus = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch('/api/telegram/status');
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Invalid response type:', contentType);
        setStatus({ connected: false });
        onTelegramChange(false);
        return;
      }

      const data = await response.json();
      console.log('Telegram status:', data);
      
      if (!response.ok) {
        console.error('Status error:', data);
        setStatus({ connected: false });
        onTelegramChange(false);
        return;
      }
      
      setStatus(data);
      onTelegramChange(data.connected);

      // If connected but not a group member, get an invite link
      if (data.connected && !data.groupMember) {
        try {
          const inviteResponse = await fetch('/api/telegram/invite');
          const inviteData = await inviteResponse.json();
          if (inviteResponse.ok && inviteData.inviteLink) {
            setInviteLink(inviteData.inviteLink);
          }
        } catch (error) {
          console.error('Error fetching invite link:', error);
        }
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
      setStatus({ connected: false });
      onTelegramChange(false);
    }
  }, [walletAddress, onTelegramChange]);

  useEffect(() => {
    checkTelegramStatus();
  }, [checkTelegramStatus]);

  const handleConnect = async () => {
    if (!walletAddress) {
      showModal("Please connect your wallet first", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Generate state and store it
      const state = Math.random().toString(36).substring(7);
      console.log('Generated state:', state);
      
      // Create auth state on server
      const response = await fetch('/api/telegram/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          state,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Auth init error:', error);
        throw new Error('Failed to initialize auth');
      }

      // Store state locally for verification
      localStorage.setItem('telegram_oauth_state', state);
      
      // Open bot in Telegram app or web
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT;
      const appUrl = `tg://resolve?domain=${botUsername}&start=${state}`;
      const webUrl = `https://t.me/${botUsername}?start=${state}`;
      
      console.log('Opening Telegram URLs:', {
        app: appUrl,
        web: webUrl,
        state,
        botUsername
      });
      
      // Try app first, then web as fallback
      const appWindow = window.open(appUrl, '_blank');
      if (!appWindow || appWindow.closed || typeof appWindow.closed === 'undefined') {
        // App URL failed, try web immediately
        window.open(webUrl, '_blank');
      } else {
        // App URL might have worked, try web after delay as backup
        setTimeout(() => {
          window.open(webUrl, '_blank');
        }, 1000);
      }

      showModal("Please send /start to the bot to continue", "info");
    } catch (error) {
      console.error('Error connecting to Telegram:', error);
      showModal("Error connecting to Telegram", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!status.connected) {
    return (
      <button 
        onClick={handleConnect}
        className="telegram-connect-button"
        disabled={isLoading}
      >
        {isLoading ? 'Opening Telegram...' : 'Connect Telegram'}
      </button>
    );
  }

  return (
    <a 
      href={status.groupMember ? `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}` : inviteLink || `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}`}
      className="telegram-group-button"
      target="_blank"
      rel="noopener noreferrer"
    >
      {status.groupMember ? 'Open Telegram Group' : 'Join Telegram Group'}
    </a>
  );
};

export default TelegramConnect; 