import type { NextApiRequest, NextApiResponse } from 'next';

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

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  baseToken: {
    name: string;
    symbol: string;
    address: string;
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
  pairCreatedAt: number;
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

async function fetchTokenPairData(tokenAddress: string): Promise<DexScreenerPair | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!response.ok) return null;

    const data: DexScreenerResponse = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    // Return the pair with highest liquidity
    return data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
  } catch (error) {
    console.error('Error fetching pair data:', error);
    return null;
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

function formatLinks(links: TokenProfile['links']): string {
  if (!links || links.length === 0) return 'N/A';
  
  return links.map(link => {
    const icon = getLinkIcon(link);
    const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    return `<a href="${url}" style="text-decoration: none; color: white" target="_blank">${icon}</a>`;
  }).join(' ');
}

function formatLatestTokens(profiles: TokenProfile[], pairData: Map<string, DexScreenerPair>): string {
  if (!profiles || profiles.length === 0) {
    return "No new tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity |
|---|--------|-------|------------|-----------|------------|------------|-----------|`;

  const rows = profiles
    .filter(profile => profile.chainId === 'solana')
    .slice(0, 50)
    .map((profile, index) => {
      const pair = pairData.get(profile.tokenAddress);
      if (!pair) return null;

      const links = formatLinks(profile.links);
      const price = pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(8)}` : 'N/A';
      
      return `| ${index + 1} | ${pair.baseToken.symbol} | ${links} | ${formatNumber(pair.marketCap)} | ${price} | ${formatPriceChange(pair.priceChange?.h24)} | ${formatNumber(pair.volume?.h24)} | ${formatNumber(pair.liquidity?.usd)} |`;
    })
    .filter(Boolean)
    .join('\n');

  return `# Latest Solana Tokens

${tableHeader}
${rows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch latest token profiles
    const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      console.error('DexScreener API response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch latest tokens: ${response.status} ${response.statusText}`);
    }

    const profiles: TokenProfile[] = await response.json();
    
    if (!Array.isArray(profiles)) {
      console.error('Unexpected data structure:', profiles);
      throw new Error('Invalid data structure received from DexScreener');
    }

    // Filter for Solana tokens
    const solanaProfiles = profiles
      .filter(profile => profile.chainId === 'solana')
      .slice(0, 50);

    // Fetch pair data
    const pairDataMap = new Map<string, DexScreenerPair>();
    await Promise.all(
      solanaProfiles.map(async (profile) => {
        const pairData = await fetchTokenPairData(profile.tokenAddress);
        if (pairData) {
          pairDataMap.set(profile.tokenAddress, pairData);
        }
      })
    );

    const formattedData = formatLatestTokens(profiles, pairDataMap);
    
    res.status(200).json({ content: formattedData });
  } catch (error) {
    console.error('Error fetching latest tokens:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch latest tokens',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 