// utils/helpers.ts

import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

type RPCParam = string | number | boolean | Record<string, unknown>;

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
  if (!walletAddress || !tokenAddress || typeof requiredAmount !== 'number') {
    return false;
  }

  if (requiredAmount < 0) {
    return false;
  }

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(tokenAddress);

      await makeRPCRequest('getLatestBlockhash', [], true);

      const tokenAccounts = await makeRPCRequest('getTokenAccountsByOwner', [
        wallet.toBase58(),
        { programId: TOKEN_PROGRAM_ID.toBase58() },
        { encoding: 'jsonParsed', commitment: 'confirmed' }
      ], true);

      for (const ta of tokenAccounts.result.value) {
        try {
          const accountInfo = await makeRPCRequest('getTokenAccountBalance', [ta.pubkey], true);
          
          if (ta.account.data.parsed.info.mint === mint.toBase58()) {
            const decimals = accountInfo.result.value.decimals;
            const rawBalance = Number(accountInfo.result.value.amount);
            const rawRequiredAmount = requiredAmount * Math.pow(10, decimals);
            return rawBalance >= rawRequiredAmount;
          }
        } catch {
          continue;
        }
      }

      return false;
    } catch {
      if (attempt === retryCount - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
  }

  return false;
}

export const getReadmeContent = async (): Promise<string> => {
  try {
    const response = await fetch('/api/docs');
    const data = await response.json();
    return data.content;
  } catch {
    return '# Documentation\n\nError loading documentation. Please try again later.';
  }
};

export async function makeRPCRequest(method: string, params: RPCParam[], isServer = false) {
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
}
