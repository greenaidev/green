import { useState } from 'react';

interface GeckoHookReturn {
  fetchTopCoins: () => Promise<string>;
  fetchTrendingCoins: () => Promise<string>;
  loading: boolean;
}

const useGecko = (): GeckoHookReturn => {
  const [loading, setLoading] = useState(false);

  const fetchTopCoins = async (): Promise<string> => {
    setLoading(true);
    try {
      const response = await fetch('/api/market/gecko?type=market');
      const data = await response.json();
      return data.content;
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
      const response = await fetch('/api/market/gecko?type=trending');
      const data = await response.json();
      return data.content;
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