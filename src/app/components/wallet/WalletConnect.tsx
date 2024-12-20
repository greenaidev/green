// WalletConnect.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  onSessionChange: (valid: boolean, address: string | null, tokenBalance: number | null) => void, 
  showModal: (message: string, type: "success" | "error" | "info") => void 
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const MESSAGE_TO_SIGN = "Please sign this message to verify your identity.";
  const tokenTicker = process.env.NEXT_PUBLIC_TOKEN_TICKER || '';

  const fetchTokenBalance = useCallback(async (walletAddress: string) => {
    try {
      setTokenBalance(null);
      
      const response = await fetch(`/api/token/balance?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        const balance = data.balance || 0;
        setTokenBalance(balance);
        onSessionChange(true, walletAddress, balance);

        if (!data.hasEnough) {
          showModal(`Insufficient token balance. Required: ${data.required.toLocaleString()}`, "error");
        }
      } else {
        setTokenBalance(0);
        onSessionChange(false, walletAddress, 0);
      }
    } catch {
      setTokenBalance(0);
      onSessionChange(false, walletAddress, 0);
    }
  }, [onSessionChange, showModal]);

  const checkIfWalletIsConnected = useCallback(async () => {
    const solana = (window as unknown as { solana?: Solana }).solana;
    if (solana?.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        const publicKey = response.publicKey.toString();

        const sessionValidation = await fetch("/api/session/validate");
        if (sessionValidation.ok) {
          setWalletAddress(publicKey);
          await fetchTokenBalance(publicKey);
          showModal("Session is valid", "success");
        } else {
          setWalletAddress(null);
          setTokenBalance(0);
          onSessionChange(false, null, 0);
          showModal("Connect your wallet to login", "info");
        }
      } catch {
        setWalletAddress(null);
        setTokenBalance(0);
        onSessionChange(false, null, 0);
        showModal("Connect your wallet to login", "info");
      }
    }
  }, [onSessionChange, showModal, fetchTokenBalance]);

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
            onSessionChange(false, publicKey, null);
            showModal(data.message, "error");
            return;
          }

          setWalletAddress(publicKey);
          await fetchTokenBalance(publicKey);
          showModal("Wallet connected successfully", "success");
        } else {
          setWalletAddress(null);
          onSessionChange(false, null, null);
          showModal("Signature verification failed", "error");
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('User rejected the request')) {
            showModal("Connection request was rejected", "info");
          } else {
            setWalletAddress(null);
            onSessionChange(false, null, null);
            showModal("An unexpected error occurred", "error");
          }
        } else {
          setWalletAddress(null);
          onSessionChange(false, null, null);
          showModal("An unexpected error occurred", "error");
        }
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      const response = await fetch("/api/session/logout", {
        method: "POST",
      });

      if (response.ok) {
        setWalletAddress(null);
        setTokenBalance(0);
        onSessionChange(false, null, 0);
        showModal("Wallet disconnected", "success");
      }
    } catch {
      showModal("Error disconnecting wallet", "error");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [checkIfWalletIsConnected]);

  return (
    <div>
      {walletAddress ? (
        <div className="wallet-connected">
          <div className="wallet-info">
            <AddressDisplay address={walletAddress} />
            <p className="token-balance">
              ${tokenTicker}: {tokenBalance !== null ? tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'Loading...'}
            </p>
          </div>
          <LogOutButton onClick={disconnectWallet} />
        </div>
      ) : (
        <ConnectButton onClick={connectWallet} />
      )}
    </div>
  );
};

export default WalletConnect;