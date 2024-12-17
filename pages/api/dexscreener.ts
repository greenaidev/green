import type { NextApiRequest, NextApiResponse } from 'next';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    h24: string;
    h6: string;
    h1: string;
  };
  liquidity: {
    usd: number;
  };
  marketCap: number;
  fdv: number;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  pairCreatedAt: string;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

function formatPriceChange(change: string): string {
  const num = parseFloat(change);
  return num >= 0 ? `+${num}%` : `${num}%`;
}

function formatTokenData(data: DexScreenerResponse): string {
  if (!data.pairs || data.pairs.length === 0) {
    return "No data found for this token.";
  }

  const pair = data.pairs[0]; // Using the first pair for main data
  const { baseToken, priceUsd, volume, priceChange, liquidity, txns, marketCap, fdv } = pair;

  return `# ${baseToken.name} (${baseToken.symbol})
Contract: \`${baseToken.address}\`

## Token Metrics
| Metric | Value |
|--------|--------|
| Price USD | $${parseFloat(priceUsd).toFixed(8)} |
| Market Cap | ${formatNumber(marketCap)} |
| Fully Diluted Value | ${formatNumber(fdv)} |
| Total Liquidity | ${formatNumber(liquidity.usd)} |
| 24h Transactions | ${txns.h24.buys + txns.h24.sells} Trades (${txns.h24.buys} buys, ${txns.h24.sells} sells) |

## Time-Based Metrics
| Timeframe | Price Change | Volume |
|-----------|--------------|--------|
| 1 Hour    | ${formatPriceChange(priceChange.h1)} | ${formatNumber(volume.h1)} |
| 6 Hours   | ${formatPriceChange(priceChange.h6)} | ${formatNumber(volume.h6)} |
| 24 Hours  | ${formatPriceChange(priceChange.h24)} | ${formatNumber(volume.h24)} |

Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Token address is required' });
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    
    if (!response.ok) {
      console.error('DexScreener API response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText}`);
    }

    const data: DexScreenerResponse = await response.json();
    const formattedData = formatTokenData(data);
    
    res.status(200).json({ content: formattedData });
  } catch (error) {
    console.error('Error fetching token data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch token data',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 