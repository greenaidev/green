// src/app/components/Header.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import WalletConnect from "./wallet/WalletConnect";
import Modal from "./Modal";
import PrivateDashboard from "./PrivateDashboard";
import TopUp from "./TopUp";

const Header = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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
      
      // Check if the message is from Telegram OAuth
      if (event.data && typeof event.data === 'string' && event.data.startsWith('telegram-auth:')) {
        messageReceived = true;
        const authData = JSON.parse(event.data.replace('telegram-auth:', ''));
        
        try {
          const response = await fetch('/api/telegram/oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(authData),
          });

          if (response.ok) {
            const data = await response.json();
            setIsTelegramConnected(true);
            showModal(data.message || "Telegram connected successfully!", "success");
          } else {
            const errorData = await response.json();
            showModal(errorData.error || "Failed to connect Telegram", "error");
          }
        } catch (error) {
          console.error('Telegram auth error:', error);
          showModal("Connection error. Please try again.", "error");
        }

        window.removeEventListener('message', handleMessage);
        if (!popupClosed && popup) {
          popup.close();
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
  }, [isTelegramConnected, showModal, isConnecting]);

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
                  type="button"
                  disabled
                >
                  Telegram Connected
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