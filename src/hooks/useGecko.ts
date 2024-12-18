import { useState } from 'react';

interface GeckoHookReturn {
  fetchTopCoins: () => Promise<string>;
  fetchTrendingCoins: () => Promise<string>;
  loading: boolean;
}

interface CoinData {
  market_cap_rank: number;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
}

interface TrendingCoin {
  item: {
    name: string;
    symbol: string;
    price_btc: number;
    market_cap_rank: number | null;
  };
}

const useGecko = (): GeckoHookReturn => {
  const [loading, setLoading] = useState(false);

  const formatMarketData = (data: CoinData[]): string => {
    const tableHeader = '| Rank | Name | Symbol | Price (USD) | 24h % | 7d % | Market Cap | Volume 24h |\n' +
                       '|------|------|--------|-------------|--------|-------|------------|------------|\n';
    
    const rows = data.map((coin) => {
      const price = coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
      const marketCap = (coin.market_cap / 1000000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'M';
      const volume = (coin.total_volume / 1000000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'M';
      
      return `| ${coin.market_cap_rank} | ${coin.name} | ${coin.symbol.toUpperCase()} | $${price} | ${coin.price_change_percentage_24h.toFixed(2)}% | ${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}% | $${marketCap} | $${volume} |`;
    }).join('\n');

    return `# Top 50 Cryptocurrencies by Market Cap\n\n${tableHeader}${rows}\n\n*Data from CoinGecko*`;
  };

  const formatTrendingData = (data: TrendingCoin[]): string => {
    const tableHeader = '| Rank | Name | Symbol | Price (BTC) | Market Cap Rank |\n' +
                       '|------|------|--------|-------------|----------------|\n';
    
    const rows = data.map((item, index) => {
      const coin = item.item;
      return `| ${index + 1} | ${coin.name} | ${coin.symbol.toUpperCase()} | ${coin.price_btc.toFixed(10)} | ${coin.market_cap_rank || 'N/A'} |`;
    }).join('\n');

    return `# Trending Cryptocurrencies on CoinGecko\n\n${tableHeader}${rows}\n\n*Data from CoinGecko*`;
  };

  const fetchTopCoins = async (): Promise<string> => {
    setLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d');
      const data = await response.json() as CoinData[];
      return formatMarketData(data);
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return 'Failed to fetch top coins data. Please try again later.';
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingCoins = async (): Promise<string> => {
    setLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await response.json();
      return formatTrendingData(data.coins as TrendingCoin[]);
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return 'Failed to fetch trending coins data. Please try again later.';
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchTopCoins,
    fetchTrendingCoins,
    loading
  };
};

export default useGecko; 