import { NextResponse } from 'next/server';

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

/* eslint-disable @typescript-eslint/no-unused-vars */
interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}
/* eslint-enable @typescript-eslint/no-unused-vars */

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: {
    type: string;
    label: string;
    url: string;
  }[];
}

interface TokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  description?: string;
  links?: TokenProfile['links'];
}

// Utility functions
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

function getLinkIcon(link: { url: string, type?: string }): string {
  const url = link.url.toLowerCase();
  
  if (url.includes('twitter.com') || url.includes('x.com')) return '𝕏';
  if (url.includes('t.me') || url.includes('telegram')) return '💬';
  if (url.includes('tiktok.com')) return '▶️';
  if (url.includes('instagram.com')) return '📸';
  if (url.includes('discord.gg') || url.includes('discord.com')) return '💭';
  if (url.match(/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i)) return '🌐';
  
  return '🔗';
}

function formatLinks(links: TokenProfile['links']): string {
  if (!links || links.length === 0) return 'N/A';
  
  return links.map(link => {
    const icon = getLinkIcon(link);
    const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    return `<a href="${url}" style="text-decoration: none; color: white" target="_blank">${icon}</a>`;
  }).join(' ');
}

async function fetchTokenData(tokenAddress: string): Promise<DexScreenerPair | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    
    return data.pairs.sort((a: DexScreenerPair, b: DexScreenerPair) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

function formatTokenData(data: DexScreenerPair): string {
  if (!data) {
    return "No data found for this token.";
  }

  const { baseToken, priceUsd, volume, priceChange, liquidity, txns, marketCap, fdv } = data;

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

async function formatLatestTokens(profiles: TokenProfile[]): Promise<string> {
  if (!profiles || profiles.length === 0) {
    return "No new tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity |
|---|--------|-------|------------|-----------|------------|------------|-----------|`;

  const solanaProfiles = profiles
    .filter(profile => profile.chainId === 'solana')
    .slice(0, 50);

  const rows = await Promise.all(
    solanaProfiles.map(async (profile, index) => {
      const pairData = await fetchTokenData(profile.tokenAddress);
      if (!pairData) return null;

      const links = formatLinks(profile.links);
      const price = pairData.priceUsd ? `$${parseFloat(pairData.priceUsd).toFixed(8)}` : 'N/A';
      
      return `| ${index + 1} | ${pairData.baseToken.symbol} | ${links} | ${formatNumber(pairData.marketCap)} | ${price} | ${formatPriceChange(pairData.priceChange?.h24)} | ${formatNumber(pairData.volume?.h24)} | ${formatNumber(pairData.liquidity?.usd)} |`;
    })
  );

  const validRows = rows.filter(Boolean).join('\n');

  return `# Latest Solana Tokens

${tableHeader}
${validRows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

async function formatTrendingTokens(tokens: TokenBoost[]): Promise<string> {
  if (!tokens || tokens.length === 0) {
    return "No trending tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity | Boost Amount |
|---|--------|-------|------------|-----------|------------|------------|-----------|--------------|`;

  const solanaTokens = tokens
    .filter(token => token.chainId === 'solana')
    .slice(0, 50);

  const rows = await Promise.all(
    solanaTokens.map(async (token, index) => {
      const pairData = await fetchTokenData(token.tokenAddress);
      if (!pairData) return null;

      const links = formatLinks(token.links);
      const price = pairData.priceUsd ? `$${parseFloat(pairData.priceUsd).toFixed(8)}` : 'N/A';
      
      return `| ${index + 1} | ${pairData.baseToken.symbol} | ${links} | ${formatNumber(pairData.marketCap)} | ${price} | ${formatPriceChange(pairData.priceChange?.h24)} | ${formatNumber(pairData.volume?.h24)} | ${formatNumber(pairData.liquidity?.usd)} | ${formatNumber(token.amount)} |`;
    })
  );

  const validRows = rows.filter(Boolean).join('\n');

  return `# Top Trending Solana Tokens

${tableHeader}
${validRows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok | 💭 Discord</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

async function formatBoostedTokens(tokens: TokenBoost[]): Promise<string> {
  if (!tokens || tokens.length === 0) {
    return "No boosted tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity | Total Boosts |
|---|--------|-------|------------|-----------|------------|------------|-----------|--------------|`;

  const solanaTokens = tokens
    .filter(token => token.chainId === 'solana')
    .slice(0, 50)
    .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));

  const rows = await Promise.all(
    solanaTokens.map(async (token, index) => {
      const pairData = await fetchTokenData(token.tokenAddress);
      if (!pairData) return null;

      const links = formatLinks(token.links);
      const price = pairData.priceUsd ? `$${parseFloat(pairData.priceUsd).toFixed(8)}` : 'N/A';
      
      return `| ${index + 1} | ${pairData.baseToken.symbol} | ${links} | ${formatNumber(pairData.marketCap)} | ${price} | ${formatPriceChange(pairData.priceChange?.h24)} | ${formatNumber(pairData.volume?.h24)} | ${formatNumber(pairData.liquidity?.usd)} | ${formatNumber(token.totalAmount)} |`;
    })
  );

  const validRows = rows.filter(Boolean).join('\n');

  return `# Most Boosted Solana Tokens

${tableHeader}
${validRows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok | 💭 Discord</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

// Main route handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const type = searchParams.get('type');

  if (!type && !address) {
    return NextResponse.json({ 
      error: 'Either type or address parameter is required',
      content: '❌ Invalid request. Please provide either a type or address parameter.'
    }, { status: 400 });
  }

  try {
    let response;
    let data;
    let formattedData;

    switch (type) {
      case 'symbol':
      case 'ticker':
      case 'ca':
        if (!address) {
          return NextResponse.json({ 
            error: 'Token identifier is required',
            content: '❌ Token identifier (symbol or address) is required for lookup.'
          }, { status: 400 });
        }

        // Use search endpoint for both symbol and address lookups
        response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
        if (!data.pairs || data.pairs.length === 0) {
          return NextResponse.json({ 
            error: `No token found: ${address}`,
            content: `❌ No token found: ${address}. Please check the input and try again.`
          }, { status: 404 });
        }

        // Filter for Solana pairs and sort by liquidity
        const filteredPairs = data.pairs
          .filter((pair: DexScreenerPair) => pair.chainId === 'solana')
          .sort((a: DexScreenerPair, b: DexScreenerPair) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          );

        if (filteredPairs.length === 0) {
          return NextResponse.json({ 
            error: `No Solana token found: ${address}`,
            content: `❌ No Solana token found: ${address}. Please check the input and try again.`
          }, { status: 404 });
        }

        formattedData = formatTokenData(filteredPairs[0]);
        break;

      case 'trending':
        response = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch trending data: ${response.status} ${response.statusText}`);
        }
        data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data structure received from DexScreener');
        }
        formattedData = await formatTrendingTokens(data);
        break;

      case 'latest':
        response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch latest pairs: ${response.status} ${response.statusText}`);
        }
        data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data structure received from DexScreener');
        }
        formattedData = await formatLatestTokens(data);
        break;

      case 'boosted':
        response = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch boosted tokens: ${response.status} ${response.statusText}`);
        }
        data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data structure received from DexScreener');
        }
        data.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        formattedData = await formatBoostedTokens(data);
        break;

      default:
        // Handle direct token address lookup
        if (!address) {
          return NextResponse.json({ 
            error: 'Token address is required',
            content: '❌ Token address is required for lookup.'
          }, { status: 400 });
        }
        response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText}`);
        }
        data = await response.json();
        if (!data.pairs || data.pairs.length === 0) {
          return NextResponse.json({ 
            error: `No token found with address: ${address}`,
            content: `❌ No token found with address: ${address}. Please check the address and try again.`
          }, { status: 404 });
        }
        formattedData = formatTokenData(data.pairs[0]);
    }

    return NextResponse.json({ content: formattedData });
  } catch (error) {
    console.error('Error in DexScreener API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch token data',
      content: '❌ Failed to fetch token data. Please try again.'
    }, { status: 500 });
  }
} 