import React from 'react';

const SwapLink = () => {
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
  const tokenAmount = process.env.NEXT_PUBLIC_TOKEN_AMOUNT;

  // CAIP-19 address for SOL on Solana
  const solAddress = 'solana:So11111111111111111111111111111111111111112';

  // Construct the deeplink URL
  const deeplinkUrl = `https://phantom.app/ul/v1/swap?buy=${encodeURIComponent(tokenAddress)}&sell=${encodeURIComponent(solAddress)}&amount=${tokenAmount}`;

  return (
    <button
      onClick={() => window.open(deeplinkUrl, '_blank')}
      className="phantom-button"
    >
      Swap SOL for Your Token
    </button>
  );
};

export default SwapLink; 