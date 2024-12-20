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

    let popupClosed = false;
    let messageReceived = false;

    const handleMessage = async (event: MessageEvent) => {
      console.log('Received message:', event.origin, event.data);
      
      // Parse Telegram OAuth response
      if (
        event.origin === 'https://oauth.telegram.org' && 
        event.data && 
        typeof event.data === 'object' && 
        event.data.event === 'auth_result'
      ) {
        messageReceived = true;
        const { result } = event.data;
        
        try {
          const response = await fetch('/api/telegram/oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...result,
              walletAddress: connectedWallet
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setIsTelegramConnected(true);
            setTelegramUser(result);
            showModal("Telegram connected successfully!", "success");
          } else {
            const errorData = await response.json();
            showModal(errorData.error || "Failed to connect Telegram", "error");
          }
        } catch (error) {
          console.error('Telegram auth error:', error);
          showModal("Connection error. Please try again.", "error");
        } finally {
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
          if (!popupClosed && popup) {
            popup.close();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        popupClosed = true;
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        if (!messageReceived) {
          console.log('Popup closed without message');
          showModal("Telegram connection was cancelled", "info");
          setIsConnecting(false);
        }
      }
    }, 1000);

    // Cleanup on component unmount
    return () => {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      if (!messageReceived) {
        setIsConnecting(false);
      }
    };
  }, [connectedWallet, showModal, isConnecting]);

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