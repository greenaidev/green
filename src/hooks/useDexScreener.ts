import { useState } from 'react';

export default function useDexScreener() {
  const [loading, setLoading] = useState(false);

  const fetchTokenInfo = async (address: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dexscreener?address=${address}`);
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return 'Failed to fetch token information. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return 'Failed to fetch trending tokens. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestPairs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/latest');
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching latest pairs:', error);
      return 'Failed to fetch latest pairs. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  const fetchBoostedTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/boosted');
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching boosted tokens:', error);
      return 'Failed to fetch boosted tokens. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchTokenInfo,
    fetchTrendingTokens,
    fetchLatestPairs,
    fetchBoostedTokens,
    loading
  };
} 