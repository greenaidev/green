// src/app/components/Header.tsx
"use client";

import { useState } from "react";
import WalletConnect from "./wallet/WalletConnect";
import Modal from "./Modal";
import PublicContent from "./PublicContent";
import PrivateDashboard from "./PrivateDashboard";
import TopUp from "./TopUp";

const Header = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");

  const handleSessionChange = (valid: boolean, address: string | null) => {
    setIsSessionValid(valid);
    setConnectedWallet(address);
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
        <WalletConnect 
          onSessionChange={handleSessionChange} 
          showModal={showModal}
        />
      </header>
      <main>
        {isSessionValid ? (
          <PrivateDashboard walletAddress={connectedWallet} />
        ) : shouldShowTopUp ? (
          <TopUp 
            tokenAddress={process.env.NEXT_PUBLIC_TOKEN_ADDRESS || ''} 
            requiredAmount={Number(process.env.NEXT_PUBLIC_TOKEN_AMOUNT) || 0}
          />
        ) : (
          <PublicContent />
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