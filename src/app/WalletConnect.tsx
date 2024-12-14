// WalletConnect.tsx

"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import ConnectButton from "./components/ConnectButton";
import AddressDisplay from "./components/AddressDisplay";
import LogOutButton from "./components/LogOutButton";
import { verifySignature } from "./utils/helpers";

type Solana = {
  isPhantom: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array; publicKey: Uint8Array }>;
};

const WalletConnect = ({ onSessionChange }: { onSessionChange: (valid: boolean) => void }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const MESSAGE_TO_SIGN = "Please sign this message to verify your identity.";

  const checkIfWalletIsConnected = async () => {
    const solana = (window as unknown as { solana?: Solana }).solana;
    if (solana?.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        const publicKey = response.publicKey.toString();

        const sessionValidation = await fetch("/api/validate-session");
        if (sessionValidation.ok) {
          setWalletAddress(publicKey);
          onSessionChange(true);
        } else {
          setWalletAddress(null);
          onSessionChange(false);
        }
      } catch {
        setWalletAddress(null);
        onSessionChange(false);
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
          await fetch("/api/set-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: publicKey,
              signatureVerified: isValid,
            }),
          });

          setWalletAddress(publicKey);
          onSessionChange(true);
        } else {
          onSessionChange(false);
        }
      } catch {
        onSessionChange(false);
      }
    }
  };

  const disconnectWallet = async () => {
    await fetch("/api/logout", { method: "POST" });
    setWalletAddress(null);
    onSessionChange(false);
  };

  useEffect(() => {
    checkIfWalletIsConnected(); // Intentionally leaving out dependencies
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
