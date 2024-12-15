// WalletConnect.tsx

"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import ConnectButton from "./ConnectButton";
import AddressDisplay from "./AddressDisplay";
import LogOutButton from "./LogOutButton";
import { verifySignature } from "../../utils/helpers";

type Solana = {
  isPhantom: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array; publicKey: Uint8Array }>;
};

const WalletConnect = ({ onSessionChange, showModal }: { 
  onSessionChange: (valid: boolean, address: string | null) => void, 
  showModal: (message: string, type: "success" | "error" | "info") => void 
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const MESSAGE_TO_SIGN = "Please sign this message to verify your identity.";

  const checkIfWalletIsConnected = async () => {
    const solana = (window as unknown as { solana?: Solana }).solana;
    if (solana?.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        const publicKey = response.publicKey.toString();

        const sessionValidation = await fetch("/api/session/validate");
        if (sessionValidation.ok) {
          setWalletAddress(publicKey);
          onSessionChange(true, publicKey);
          showModal("Session is valid", "success");
        } else {
          setWalletAddress(null);
          onSessionChange(false, null);
          showModal("Connect your wallet to login", "info");
        }
      } catch {
        setWalletAddress(null);
        onSessionChange(false, null);
        showModal("Connect your wallet to login", "info");
      }
    }
  };

  const connectWallet = async () => {
    const solana = (window as unknown as { solana?: Solana }).solana;
    if (solana) {
      try {
        const response = await solana.connect();
        const publicKey = response.publicKey.toString();

        const encodedMessage = new TextEncoder().encode(MESSAGE_TO_SIGN);
        const signedMessage = await solana.signMessage(encodedMessage, "utf8");

        const isValid = verifySignature(
          encodedMessage,
          signedMessage.signature,
          new PublicKey(signedMessage.publicKey).toBytes()
        );

        if (isValid) {
          const sessionResponse = await fetch("/api/session/set-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: publicKey,
              signatureVerified: isValid,
            }),
          });

          const data = await sessionResponse.json();

          if (!sessionResponse.ok) {
            setWalletAddress(publicKey);
            onSessionChange(false, publicKey);
            showModal(data.message, "error");
            return;
          }

          setWalletAddress(publicKey);
          onSessionChange(true, publicKey);
          showModal("Wallet connected successfully", "success");
        } else {
          setWalletAddress(null);
          onSessionChange(false, null);
          showModal("Signature verification failed", "error");
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('User rejected the request')) {
            showModal("Connection request was rejected", "info");
          } else {
            setWalletAddress(null);
            onSessionChange(false, null);
            showModal("An unexpected error occurred", "error");
            console.error(error);
          }
        } else {
          setWalletAddress(null);
          onSessionChange(false, null);
          showModal("An unexpected error occurred", "error");
          console.error(error);
        }
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      await fetch("/api/session/logout", { method: "POST" });
      setWalletAddress(null);
      onSessionChange(false, null);
      showModal("Wallet disconnected", "info");
    } catch {
      onSessionChange(false, null);
      showModal("Error disconnecting wallet", "error");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {walletAddress ? (
        <div className="wallet-connected">
          <AddressDisplay address={walletAddress} />
          <LogOutButton onClick={disconnectWallet} />
        </div>
      ) : (
        <ConnectButton onClick={connectWallet} />
      )}
    </div>
  );
};

export default WalletConnect;