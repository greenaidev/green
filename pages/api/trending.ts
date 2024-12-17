import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  description?: string;
  links?: {
    type: string;
    label: string;
    url: string;
  }[];
}

interface TokenPair {
  chainId: string;
  dexId: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: string;
  };
  volume: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  marketCap: number;
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

function getLinkIcon(link: { url: string, type?: string }): string {
  // Normalize the URL for checking
  const url = link.url.toLowerCase();
  
  // Check URL patterns
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return '𝕏';
  }
  if (url.includes('t.me') || url.includes('telegram')) {
    return '💬';
  }
  if (url.includes('tiktok.com')) {
    return '▶️';
  }
  if (url.includes('instagram.com')) {
    return '📸';
  }
  if (url.includes('discord.gg') || url.includes('discord.com')) {
    return '💭';
  }
  if (url.match(/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i)) {
    return '🌐';
  }
  
  return '🔗';
}

function formatLinks(links: TokenBoost['links']): string {
  if (!links || links.length === 0) return 'N/A';
  
  return links.map(link => {
    const icon = getLinkIcon(link);
    const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    return `<a href="${url}" style="text-decoration: none; color: white" target="_blank">${icon}</a>`;
  }).join(' ');
}

async function fetchTokenData(tokenAddress: string): Promise<TokenPair | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    
    // Find the pair with the highest liquidity
    const sortedPairs = data.pairs
      .filter((pair: TokenPair) => pair.liquidity?.usd > 0)
      .sort((a: TokenPair, b: TokenPair) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    
    return sortedPairs[0] || null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

async function formatTrendingTokens(tokens: TokenBoost[]): Promise<string> {
  if (!tokens || tokens.length === 0) {
    return "No trending tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity | Boost Amount |
|---|--------|-------|------------|-----------|------------|------------|-----------|--------------|`;

  const solanaPairs = await Promise.all(
    tokens
      .filter(token => token.chainId === 'solana')
      .slice(0, 50)
      .map(async (token, index) => {
        const pairData = await fetchTokenData(token.tokenAddress);
        if (!pairData) return null;

        return {
          index: index + 1,
          token,
          pair: pairData,
        };
      })
  );

  const validPairs = solanaPairs.filter(pair => pair !== null);

  if (validPairs.length === 0) {
    return "No valid Solana trading pairs found.";
  }

  const rows = validPairs.map(data => {
    if (!data) return '';
    const { index, token, pair } = data;
    
    const links = formatLinks(token.links);
    const price = pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(8)}` : 'N/A';
    
    return `| ${index} | ${pair.baseToken.symbol} | ${links} | ${formatNumber(pair.marketCap)} | ${price} | ${formatPriceChange(pair.priceChange?.h24)} | ${formatNumber(pair.volume?.h24)} | ${formatNumber(pair.liquidity?.usd)} | ${formatNumber(token.amount)} |`;
  }).join('\n');

  return `# Top Trending Solana Tokens

${tableHeader}
${rows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok | 💭 Discord</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch trending tokens from token boosts endpoint
    const response = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    
    if (!response.ok) {
      console.error('DexScreener API response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch trending tokens: ${response.status} ${response.statusText}`);
    }

    const tokens: TokenBoost[] = await response.json();
    
    if (!Array.isArray(tokens)) {
      console.error('Unexpected data structure:', tokens);
      throw new Error('Invalid data structure received from DexScreener');
    }

    const formattedData = await formatTrendingTokens(tokens);
    
    res.status(200).json({ content: formattedData });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 