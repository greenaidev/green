// src/app/components/Header.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import WalletConnect from "./wallet/WalletConnect";
import Modal from "./Modal";
import PrivateDashboard from "./PrivateDashboard";
import TopUp from "./TopUp";

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthResult {
  event: string;
  result: TelegramUser;
  origin: string;
}

const Header = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  const handleSessionChange = useCallback((valid: boolean, address: string | null) => {
    setIsSessionValid(valid);
    setConnectedWallet(address);
  }, []);

  const showModal = useCallback((message: string, type: "success" | "error" | "info", duration = 3000) => {
    setModalMessage(message);
    setModalType(type);
    setTimeout(() => setModalMessage(null), duration);
  }, []);

  // Check if user has Telegram connected on mount
  useEffect(() => {
    const checkTelegramStatus = async () => {
      if (connectedWallet) {
        try {
          const response = await fetch(`/api/redis/get?key=user:${connectedWallet}`);
          const data = await response.json();
          
          if (data.success && data.data?.telegramId) {
            setIsTelegramConnected(true);
            setTelegramUser({
              id: parseInt(data.data.telegramId),
              first_name: data.data.telegramFirstName,
              username: data.data.telegramUsername,
              photo_url: data.data.telegramPhotoUrl,
              auth_date: parseInt(data.data.telegramAuthDate),
              hash: ''
            });
          }
        } catch (error) {
          console.error('Error checking Telegram status:', error);
        }
      }
    };

    checkTelegramStatus();
  }, [connectedWallet]);

  const handleTelegramOAuth = useCallback(async (authData: TelegramAuthResult) => {
    try {
      showModal("Verifying Telegram data...", "info", 2000);

      const response = await fetch('/api/telegram/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...authData.result,
          walletAddress: connectedWallet
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsTelegramConnected(true);
        setTelegramUser(authData.result);
        showModal("Telegram connected successfully!", "success", 3000);
        
        // Log the final Redis data
        const redisResponse = await fetch(`/api/redis/get?key=user:${connectedWallet}`);
        const redisData = await redisResponse.json();
        console.log('Final Redis Data:', redisData.data);
        
        return true;
      } else {
        console.error('Telegram OAuth failed:', data);
        showModal(data.error || "Failed to connect Telegram", "error", 3000);
        return false;
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      showModal("Connection error. Please try again.", "error", 3000);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connectedWallet, showModal]);

  const handleTelegramLogin = useCallback(() => {
    if (isConnecting) return;
    setIsConnecting(true);

    const botId = process.env.NEXT_PUBLIC_BOT_ID;
    const origin = process.env.NEXT_PUBLIC_WEBAPP_URL;
    const width = 550;
    const height = 470;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    showModal("Opening Telegram login...", "info", 2000);

    const popup = window.open(
      `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write&dark=1`,
      "TelegramAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      showModal("Please allow popups to connect with Telegram", "error", 3000);
      setIsConnecting(false);
      return;
    }

    let authProcessed = false;

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== 'https://oauth.telegram.org') return;
      
      if (!event.data?.event || event.data.event !== 'auth_result' || !event.data.result) {
        console.error('Invalid message format:', event.data);
        return;
      }

      try {
        authProcessed = true;
        await handleTelegramOAuth(event.data as TelegramAuthResult);
      } finally {
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) popup.close();
      }
    };

    window.addEventListener('message', handleMessage);

    // Safety cleanup after 2 minutes
    const safetyTimeout = setTimeout(() => {
      if (!authProcessed) {
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) popup.close();
        showModal("Connection timed out. Please try again.", "error", 3000);
        setIsConnecting(false);
      }
    }, 120000);

    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener('message', handleMessage);
      if (!authProcessed && popup && !popup.closed) popup.close();
      setIsConnecting(false);
    };
  }, [isConnecting, showModal, handleTelegramOAuth]);

  const handleTelegramGroup = useCallback(() => {
    const groupName = process.env.TELEGRAM_GROUP_NAME;
    window.open(`https://t.me/${groupName}`, '_blank');
  }, []);

  const shouldShowTopUp = connectedWallet && !isSessionValid;

  return (
    <>
      <header className="app-header">
        <div className="logo-square"><div className="logo-circle"></div></div>
        <div className="wallet-connected">
          <div className="wallet-info">
            <WalletConnect 
              onSessionChange={handleSessionChange} 
              showModal={showModal}
            />
          </div>
          {isSessionValid && (
            <div className="button-group">
              {!isTelegramConnected ? (
                <button 
                  className="telegram-button"
                  onClick={handleTelegramLogin}
                  type="button"
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Telegram'}
                </button>
              ) : (
                <button 
                  className="telegram-button connected"
                  onClick={handleTelegramGroup}
                  type="button"
                >
                  {telegramUser?.username || 'Telegram'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <main>
        {isSessionValid ? (
          <PrivateDashboard />
        ) : shouldShowTopUp ? (
          <TopUp 
            tokenAddress={process.env.NEXT_PUBLIC_TOKEN_ADDRESS || ''}
          />
        ) : (
          <div>Please connect your wallet.</div>
        )}
      </main>
      {modalMessage && (
        <Modal
          message={modalMessage}
          type={modalType}
          onClose={() => setModalMessage(null)}
        />
      )}
    </>
  );
};

export default Header;