// src/app/components/Header.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
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

  const showModal = useCallback((message: string, type: "success" | "error" | "info") => {
    setModalMessage(message);
    setModalType(type);
  }, []);

  // Handle the actual OAuth data processing
  const handleTelegramOAuth = useCallback(async (authData: TelegramAuthResult) => {
    try {
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

      if (response.ok) {
        const data = await response.json();
        setIsTelegramConnected(true);
        setTelegramUser(authData.result);
        showModal("Telegram connected successfully!", "success");
        return true;
      } else {
        const errorData = await response.json();
        showModal(errorData.error || "Failed to connect Telegram", "error");
        return false;
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      showModal("Connection error. Please try again.", "error");
      return false;
    }
  }, [connectedWallet, showModal]);

  // Handle the UI flow
  const handleTelegramLogin = useCallback(() => {
    if (isConnecting) return;
    setIsConnecting(true);

    const botId = process.env.NEXT_PUBLIC_BOT_ID;
    const origin = process.env.NEXT_PUBLIC_WEBAPP_URL;
    const width = 550;
    const height = 470;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    showModal("Opening Telegram login...", "info");

    const popup = window.open(
      `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write`,
      "TelegramAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      showModal("Please allow popups to connect with Telegram", "error");
      setIsConnecting(false);
      return;
    }

    let authProcessed = false;

    // Handle incoming messages
    const handleMessage = async (event: MessageEvent) => {
      console.log('Received message:', event.origin, event.data);
      
      if (
        event.origin === 'https://oauth.telegram.org' && 
        event.data?.event === 'auth_result'
      ) {
        authProcessed = true;
        const success = await handleTelegramOAuth(event.data as TelegramAuthResult);
        
        // Clean up only after processing
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) {
          popup.close();
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Safety cleanup after 2 minutes
    const safetyTimeout = setTimeout(() => {
      if (!authProcessed) {
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) {
          popup.close();
        }
        showModal("Connection timed out. Please try again.", "error");
        setIsConnecting(false);
      }
    }, 120000);

    // Cleanup on component unmount
    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener('message', handleMessage);
      if (!authProcessed) {
        setIsConnecting(false);
      }
    };
  }, [isConnecting, showModal, handleTelegramOAuth]);

  const handleTelegramGroup = useCallback(() => {
    const groupName = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_NAME;
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
                  Telegram
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