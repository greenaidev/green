// utils/helpers.ts

import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Define RPCParam type once at the top of the file
type RPCParam = string | number | boolean | Record<string, unknown>;

// const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";

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

  async function makeRPCRequest(method: string, params: RPCParam[], isServer = false) {
    try {
      const url = isServer ? process.env.RPC_ENDPOINT! : '/api/rpc';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'RPC request failed');
      }
      return isServer ? data : data.result;
    } catch (error) {
      console.error('RPC request failed:', error);
      throw error;
    }
  }

  let lastError: Error | null = null;

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

      // Test connection
      try {
        await makeRPCRequest('getLatestBlockhash', [], true);
      } catch (err) {
        console.error('Connection test failed:', err);
        lastError = err as Error;
        continue;
      }

      // Get token accounts
      const tokenAccounts = await makeRPCRequest('getTokenAccountsByOwner', [
        wallet.toBase58(),
        { programId: TOKEN_PROGRAM_ID.toBase58() },
        { encoding: 'jsonParsed', commitment: 'confirmed' }
      ], true);

      console.log('Found token accounts:', tokenAccounts.result.value.length);

      // Check each token account
      for (const ta of tokenAccounts.result.value) {
        try {
          const accountInfo = await makeRPCRequest('getTokenAccountBalance', [ta.pubkey], true);
          
          if (ta.account.data.parsed.info.mint === mint.toBase58()) {
            const decimals = accountInfo.result.value.decimals;
            const rawBalance = Number(accountInfo.result.value.amount);
            const actualBalance = rawBalance / Math.pow(10, decimals);
            
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
          lastError = err as Error;
          continue;
        }
      }

      console.log('No matching token account found');
      return false;
    } catch (error) {
      console.error(`Error checking token balance (attempt ${attempt + 1}):`, error);
      lastError = error as Error;
      if (attempt === retryCount - 1) {
        console.error('All attempts failed. Last error:', lastError);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
  }

  console.error('All attempts failed. Last error:', lastError);
  return false;
}

export const getReadmeContent = async (): Promise<string> => {
  try {
    const response = await fetch('/api/docs');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching README:', error);
    return '# Documentation\n\nError loading documentation. Please try again later.';
  }
};

export async function makeRPCRequest(method: string, params: RPCParam[], isServer = false) {
  try {
    const url = isServer ? process.env.RPC_ENDPOINT! : '/api/rpc';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC request failed');
    }
    return isServer ? data : data.result;
  } catch (error) {
    console.error('RPC request failed:', error);
    throw error;
  }
}
