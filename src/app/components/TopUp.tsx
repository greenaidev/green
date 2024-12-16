"use client";

import Image from 'next/image';

interface TopUpProps {
  tokenAddress: string;
}

const TopUp = ({ tokenAddress }: TopUpProps) => {
  const tokenAmount = process.env.NEXT_PUBLIC_TOKEN_AMOUNT || '0';
  const tokenTicker = process.env.NEXT_PUBLIC_TOKEN_TICKER || 'TOKEN';
  const tokenAddressCAIP = `solana:${tokenAddress}`;

  const dexes = [
    {
      name: 'PumpFun',
      url: `https://pump.fun/coin/${tokenAddress}`,
      img: '/pumpfun.png',
    },
    {
      name: 'Phantom',
      url: `solana:swap?recipient=${encodeURIComponent(tokenAddressCAIP)}&amount=${tokenAmount}`,
      img: '/phantom.png',
    },
    {
      name: 'GeckoTerminal',
      url: `https://www.geckoterminal.com/solana/pools/${tokenAddress}`,
      img: '/gecko.png',
    },
    {
      name: 'DEXTools',
      url: `https://www.dextools.io/app/solana/pair-explorer/${tokenAddress}`,
      img: '/dextools.png',
    },
    {
      name: 'Bullx.io',
      url: `https://bullx.io/terminal?chainId=1399811149&address=${tokenAddress}`,
      img: '/bullx.png',
    },
    {
      name: 'DexScreener',
      url: `https://dexscreener.com/solana/${tokenAddress}`,
      img: '/dexscreener.png',
    },
    {
      name: 'Raydium',
      url: `https://raydium.io/swap/?inputMint=sol&outputMint=${tokenAddress}`,
      img: '/raydium.png',
    },
    {
      name: 'Jupiter',
      url: `https://jup.ag/swap/SOL-${tokenAddress}`,
      img: '/jupiter.png',
    },
    {
      name: 'BirdEye',
      url: `https://birdeye.so/token/${tokenAddress}`,
      img: '/birdeye.png',
    },
  ];

  const openPopup = (url: string) => {
    window.open(url, '_blank', 'width=420,height=720');
  };

  return (
    <div className="top-up-container">
      <h2>Top Up</h2>
      <p>
        You need at least {Number(tokenAmount).toLocaleString()} ${tokenTicker} to use this app.
      </p>
      <p className="info-text">
        ${tokenTicker} is available for purchase on your favorite DEX:
      </p>

      <div className="dex-grid">
        {dexes.map((dex, index) => (
          <div key={index} onClick={() => openPopup(dex.url)} className="dex-box">
            <Image src={dex.img} alt={dex.name} className="dex-logo" width={50} height={50} />
          </div>
        ))}
      </div>
      <p className="refresh-info">
        Refresh the page or reconnect your wallet to check for balance updates.
      </p>
    </div>
  );
};

export default TopUp;
