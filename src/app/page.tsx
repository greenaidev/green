// app/page.tsx

"use client";

import { useState } from "react";
import "./globals.css";
import WalletConnect from "./WalletConnect"; // Adjusted import path
import Modal from "./components/Modal"; // Adjusted import path

export default function Home() {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");

  const showModal = (message: string, type: "success" | "error" | "info") => {
    setModalMessage(message);
    setModalType(type);
  };

  return (
    <div>
      <header className="app-header">
        <h1>Phantom Wallet App</h1>
        <WalletConnect
          onSessionChange={(valid) => {
            setIsSessionValid(valid);
            showModal(
              valid ? "You are connected!" : "You are disconnected!",
              valid ? "success" : "info"
            );
          }}
        />
      </header>
      <main>
        {isSessionValid ? (
          <div className="private-content">
            <h1>Ok, you&apos;re in.</h1>
            <p>This is your private content, accessible only to connected users.</p>
          </div>
        ) : (
          <div className="public-content">
            <h1>Welcome to Phantom Wallet Integration</h1>
            <p>Click &quot;Connect Wallet&quot; to get started.</p>
          </div>
        )}
      </main>
      {modalMessage && (
        <Modal
          message={modalMessage}
          type={modalType}
          duration={5000}
          onClose={() => setModalMessage(null)}
        />
      )}
    </div>
  );
}
