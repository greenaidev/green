// src/app/components/Header.tsx
"use client";

import { useState } from "react";
import WalletConnect from "./wallet/WalletConnect";
import Modal from "./Modal";
import PrivateDashboard from "./PrivateDashboard";
import TopUp from "./TopUp";
import TelegramConnect from "./telegram/TelegramConnect";

const Header = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");

  const handleSessionChange = (valid: boolean, address: string | null) => {
    setIsSessionValid(valid);
    setConnectedWallet(address);
    if (!valid) {
      setTelegramConnected(false);
    }
    console.log("Session change:", { valid, address });
  };

  const showModal = (message: string, type: "success" | "error" | "info") => {
    setModalMessage(message);
    setModalType(type);
  };

  const shouldShowTopUp = connectedWallet && !isSessionValid;

  return (
    <>
      <header className="app-header">
        <div className="logo-square"><div className="logo-circle"></div></div>
        <div className="auth-controls">
          <WalletConnect 
            onSessionChange={handleSessionChange} 
            showModal={showModal}
          />
          {isSessionValid && !telegramConnected && (
            <TelegramConnect
              walletAddress={connectedWallet}
              onTelegramChange={setTelegramConnected}
              showModal={showModal}
            />
          )}
          {telegramConnected && (
            <a 
              href="https://t.me/+2cUclHsHyv8yM2U5"
              className="telegram-group-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Telegram Group
            </a>
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