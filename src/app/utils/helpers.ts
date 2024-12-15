// utils/helpers.ts

import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const verifySignature = (
  message: Uint8Array,
  signature: Uint8Array,
  publicKeyBytes: Uint8Array
): boolean => {
  return nacl.sign.detached.verify(message, signature, publicKeyBytes);
};

export async function checkTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  requiredAmount: number,
  retryCount = 3
): Promise<boolean> {
  console.log('Starting token balance check:', {
    walletAddress,
    tokenAddress,
    requiredAmount
  });

  // Input validation
  if (!walletAddress || !tokenAddress || typeof requiredAmount !== 'number') {
    console.log('Invalid input parameters');
    return false;
  }

  if (requiredAmount < 0) {
    console.log('Required amount is negative');
    return false;
  }

  async function tryConnection(attempt: number): Promise<Connection> {
    const endpoints = [
      process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com",
      "https://api.devnet.solana.com",
      "https://devnet.helius-rpc.com/?api-key=30b34838-b112-4e61-a486-72db281539e7"
    ];

    const endpoint = endpoints[attempt % endpoints.length];
    console.log(`Attempting connection with endpoint (attempt ${attempt + 1}):`, endpoint);
    
    return new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000,
    });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      // Validate addresses
      let wallet: PublicKey;
      let mint: PublicKey;
      
      try {
        wallet = new PublicKey(walletAddress);
        mint = new PublicKey(tokenAddress);
      } catch (err) {
        console.log('Invalid public key:', err);
        return false;
      }

      // Create connection with retry logic
      const connection = await tryConnection(attempt);

      // Test connection first
      try {
        await connection.getLatestBlockhash();
      } catch (err) {
        console.error('Connection test failed:', err);
        lastError = err;
        continue;
      }

      // Find token accounts
      const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
      });

      console.log('Found token accounts:', tokenAccounts.value.length);

      // Find the specific token account and check balance
      for (const ta of tokenAccounts.value) {
        try {
          const accountData = await getAccount(connection, ta.pubkey);
          
          if (accountData.mint.equals(mint)) {
            const mintInfo = await getMint(connection, mint);
            
            // Convert balance to decimal considering token decimals
            const decimals = mintInfo.decimals;
            const rawBalance = Number(accountData.amount);
            const actualBalance = rawBalance / Math.pow(10, decimals);
            
            // Convert required amount to raw token amount
            const rawRequiredAmount = requiredAmount * Math.pow(10, decimals);
            
            console.log('Token balance details:', {
              decimals,
              rawBalance,
              actualBalance,
              requiredAmount,
              rawRequiredAmount,
              hasEnough: rawBalance >= rawRequiredAmount
            });

            return rawBalance >= rawRequiredAmount;
          }
        } catch (err) {
          console.error("Error checking token account:", err);
          lastError = err;
          continue;
        }
      }

      console.log('No matching token account found');
      return false;
    } catch (error) {
      console.error(`Error checking token balance (attempt ${attempt + 1}):`, error);
      lastError = error;
      if (attempt === retryCount - 1) {
        console.error('All attempts failed. Last error:', lastError);
        return false;
      }
      // Increase wait time between retries
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
  }

  console.error('All attempts failed. Last error:', lastError);
  return false;
}
