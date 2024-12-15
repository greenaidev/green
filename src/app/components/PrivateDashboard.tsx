"use client";

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface PrivateDashboardProps {
  walletAddress: string | null;
}

const PrivateDashboard = ({ walletAddress }: PrivateDashboardProps) => {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';
  const tokenTicker = process.env.NEXT_PUBLIC_TOKEN_TICKER || '';

  useEffect(() => {
    if (!walletAddress) return;

    const fetchBalances = async () => {
      try {
        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com");
        const wallet = new PublicKey(walletAddress);

        // Fetch SOL balance
        const solBalanceLamports = await connection.getBalance(wallet);
        setSolBalance(solBalanceLamports / 1e9); // Convert lamports to SOL

        // Fetch token balance
        const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
          programId: TOKEN_PROGRAM_ID,
        });

        for (const ta of tokenAccounts.value) {
          const accountData = await getAccount(connection, ta.pubkey);
          if (accountData.mint.equals(new PublicKey(tokenAddress))) {
            const mintInfo = await getMint(connection, accountData.mint);
            const balance = Number(accountData.amount) / Math.pow(10, mintInfo.decimals);
            setTokenBalance(balance);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [walletAddress, tokenAddress]);

  if (!walletAddress) {
    return <div>Loading...</div>;
  }

  return (
    <div className="private-dashboard">
      <h2>UID: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</h2>
      <h3>Wallet Balance</h3>
      <p>$SOL: {solBalance !== null ? solBalance.toFixed(4) : 'Loading...'}</p>
      <p>${tokenTicker}: {tokenBalance !== null ? tokenBalance.toFixed(4) : 'Loading...'}</p>
    </div>
  );
};

export default PrivateDashboard; 