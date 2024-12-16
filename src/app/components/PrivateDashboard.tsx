"use client";

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import TerminalBody from './Terminal/TerminalBody';
import TerminalFooter from './Terminal/TerminalFooter';

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
    <div className="viewport">
                <TerminalBody />
                <TerminalFooter />
    <div className="user-balance">
      <p>$SOL: {solBalance !== null ? solBalance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'Loading...'}</p>
      <p>${tokenTicker}: {tokenBalance !== null ? tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'Loading...'}</p>
    </div>
    </div>
  );
};

export default PrivateDashboard; 