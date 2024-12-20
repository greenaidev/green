import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { makeRPCRequest } from '../../../utils/helpers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const requiredAmount = Number(process.env.TOKEN_AMOUNT);

    if (!walletAddress || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (isNaN(requiredAmount)) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const wallet = new PublicKey(walletAddress);

    const tokenAccounts = await makeRPCRequest('getTokenAccountsByOwner', [
      wallet.toBase58(),
      { programId: TOKEN_PROGRAM_ID.toBase58() },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    ], true);

    for (const account of tokenAccounts.result.value) {
      const parsedData = account.account.data.parsed;
      if (parsedData.info.mint === tokenAddress) {
        const balanceData = await makeRPCRequest('getTokenAccountBalance', [
          account.pubkey
        ], true);

        if (balanceData.result?.value) {
          const actualBalance = Number(balanceData.result.value.amount) / 
            Math.pow(10, balanceData.result.value.decimals);

          return NextResponse.json({ 
            balance: actualBalance,
            hasEnough: actualBalance >= requiredAmount,
            required: requiredAmount
          });
        }
      }
    }

    return NextResponse.json({ 
      balance: 0,
      hasEnough: false,
      required: requiredAmount
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
} 