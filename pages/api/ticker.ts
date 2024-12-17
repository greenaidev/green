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

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '$0.00';
  
  try {
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
  } catch (error) {
    console.error('Error formatting number:', error);
    return '$0.00';
  }
}

function formatPriceChange(change: string | undefined | null): string {
  if (!change) return '0%';
  
  try {
    const num = parseFloat(change);
    return num >= 0 ? `+${num}%` : `${num}%`;
  } catch (error) {
    console.error('Error formatting price change:', error);
    return '0%';
  }
}

function formatTokenData(pair: DexScreenerPair): string {
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

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Token symbol is required' });
  }

  try {
    // First, search for the token by symbol
    const searchResponse = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`);
    
    if (!searchResponse.ok) {
      console.error('DexScreener search API response not OK:', searchResponse.status, searchResponse.statusText);
      throw new Error(`Failed to search token: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData: DexScreenerResponse = await searchResponse.json();
    
    // Filter for Solana pairs and find the best match
    const solanaPairs = searchData.pairs
      .filter(pair => 
        pair.chainId === 'solana' && 
        pair.baseToken.symbol.toLowerCase() === symbol.toLowerCase()
      )
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    if (solanaPairs.length === 0) {
      return res.status(404).json({ 
        error: `No Solana token found with symbol: ${symbol}`,
        content: `No Solana token found with symbol: ${symbol}. Please check the symbol and try again.`
      });
    }

    // Use the most liquid pair
    const bestPair = solanaPairs[0];
    const formattedData = formatTokenData(bestPair);
    
    res.status(200).json({ content: formattedData });
  } catch (error) {
    console.error('Error fetching token data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch token data',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 