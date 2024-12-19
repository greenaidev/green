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
      console.error('Invalid TOKEN_AMOUNT configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Make RPC calls through our server
    const wallet = new PublicKey(walletAddress);

    // Get token accounts
    const tokenAccounts = await makeRPCRequest('getTokenAccountsByOwner', [
      wallet.toBase58(),
      { programId: TOKEN_PROGRAM_ID.toBase58() },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    ], true);

    console.log('Found token accounts:', tokenAccounts.result.value.length);

    // Find matching account and get balance
    for (const account of tokenAccounts.result.value) {
      const parsedData = account.account.data.parsed;
      if (parsedData.info.mint === tokenAddress) {
        console.log('Found matching token account:', account.pubkey);

        const balanceData = await makeRPCRequest('getTokenAccountBalance', [
          account.pubkey
        ], true);

        if (balanceData.result?.value) {
          const actualBalance = Number(balanceData.result.value.amount) / 
            Math.pow(10, balanceData.result.value.decimals);
          
          console.log('Token balance details:', {
            raw: balanceData.result.value.amount,
            decimals: balanceData.result.value.decimals,
            calculated: actualBalance,
            required: requiredAmount,
            hasEnough: actualBalance >= requiredAmount
          });

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

  } catch (error) {
    console.error('Error checking token balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
} 