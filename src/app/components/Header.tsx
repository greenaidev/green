// src/app/components/Header.tsx
"use client";

import { useState } from "react";
import WalletConnect from "./wallet/WalletConnect";
import Modal from "./Modal";
import PublicContent from "./PublicContent";
import PrivateDashboard from "./PrivateDashboard";

const Header = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");

  const handleSessionChange = (valid: boolean) => {
    setIsSessionValid(valid);
  };

  const showModal = (message: string, type: "success" | "error" | "info") => {
    setModalMessage(message);
    setModalType(type);
  };

  return (
    <>
      <header className="app-header">
        <h1>Web3 App</h1>
        <WalletConnect 
          onSessionChange={handleSessionChange} 
          showModal={showModal}
        />
      </header>
      <main>
        {isSessionValid ? <PrivateDashboard /> : <PublicContent />}
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