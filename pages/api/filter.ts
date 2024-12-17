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
  pairCreatedAt?: number;
  url?: string;
  socialLinks?: string[];
}

interface DexScreenerResponse {
  pairs: TokenPair[];
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

async function formatFilteredTokens(tokens: TokenBoost[], minMcap: number, maxMcap: number, limit: number): Promise<string> {
  if (!tokens || tokens.length === 0) {
    return "No tokens found.";
  }

  const tableHeader = `
| # | Token | Links | Market Cap | Price USD | 24h Change | 24h Volume | Liquidity | Creation Time |
|---|--------|-------|------------|-----------|------------|------------|-----------|---------------|`;

  console.log(`Processing ${tokens.length} total tokens...`);

  // Fetch all token data first for Solana tokens
  const solanaPairs = await Promise.all(
    tokens
      .filter(token => token.chainId === 'solana')
      .map(async (token) => {
        const pairData = await fetchTokenData(token.tokenAddress);
        if (!pairData) return null;

        return {
          token,
          pair: pairData,
          createdAt: pairData.pairCreatedAt || 0
        };
      })
  );

  console.log(`Found ${solanaPairs.length} Solana pairs before filtering...`);

  // Filter by market cap and sort by creation time (newest first)
  const filteredPairs = solanaPairs
    .filter(data => {
      if (!data || !data.pair.marketCap) return false;
      return data.pair.marketCap >= minMcap && data.pair.marketCap <= maxMcap;
    })
    .sort((a, b) => (b!.createdAt || 0) - (a!.createdAt || 0))
    .slice(0, limit);

  console.log(`Found ${filteredPairs.length} pairs in market cap range...`);

  if (filteredPairs.length === 0) {
    return `No tokens found in market cap range $${formatNumber(minMcap)} - $${formatNumber(maxMcap)}.`;
  }

  const rows = filteredPairs.map((data, index) => {
    if (!data) return '';
    const { token, pair } = data;
    
    const links = formatLinks(token.links);
    const price = pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(8)}` : 'N/A';
    const creationTime = data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A';
    
    return `| ${index + 1} | ${pair.baseToken.symbol} | ${links} | ${formatNumber(pair.marketCap)} | ${price} | ${formatPriceChange(pair.priceChange?.h24)} | ${formatNumber(pair.volume?.h24)} | ${formatNumber(pair.liquidity?.usd)} | ${creationTime} |`;
  }).join('\n');

  return `# Filtered Solana Tokens (MCap: ${formatNumber(minMcap)} - ${formatNumber(maxMcap)})

${tableHeader}
${rows}

<span style="color: white">🌐 Website | 𝕏 Twitter | 💬 Telegram | 📸 Instagram | ▶️ TikTok | 💭 Discord</span>
Data provided by DexScreener • ${new Date().toLocaleString()}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { min, max, limit = '100' } = req.query;

  if (!min || !max || typeof min !== 'string' || typeof max !== 'string') {
    return res.status(400).json({ error: 'Market cap range (min and max) is required' });
  }

  try {
    const minMcap = parseFloat(min) * 1000;
    const maxMcap = parseFloat(max) * 1000;
    const tokenLimit = parseInt(limit as string);

    if (isNaN(minMcap) || isNaN(maxMcap) || minMcap < 0 || maxMcap < minMcap) {
      return res.status(400).json({ error: 'Invalid market cap range' });
    }

    // Fetch from latest tokens endpoint with a larger limit
    const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      console.error('DexScreener API response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`);
    }

    const data: DexScreenerResponse = await response.json();
    const pairs = data.pairs || [];
    
    // Filter for Solana pairs first
    const solanaPairs = pairs.filter((pair: TokenPair) => pair.chainId === 'solana');
    
    // Convert pairs to TokenBoost format with default links
    const tokens: TokenBoost[] = solanaPairs.map((pair: TokenPair) => ({
      chainId: 'solana',
      tokenAddress: pair.baseToken.address,
      url: pair.url || '',
      amount: 0,
      totalAmount: 0,
      links: [
        // Add default website link if available
        ...(pair.url ? [{ type: 'website', label: 'Website', url: pair.url }] : []),
        // Add social links if available
        ...(pair.socialLinks?.map(link => ({
          type: 'social',
          label: 'Social',
          url: link
        })) || [])
      ]
    }));

    const formattedData = await formatFilteredTokens(tokens, minMcap, maxMcap, tokenLimit);
    
    res.status(200).json({ content: formattedData });
  } catch (error) {
    console.error('Error filtering tokens:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to filter tokens',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 