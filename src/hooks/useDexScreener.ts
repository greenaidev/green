import { useState } from 'react';

/* eslint-disable @typescript-eslint/no-unused-vars */
interface DexScreenerResponse {
  content: string;
  error?: string;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export default function useDexScreener() {
  const [loading, setLoading] = useState(false);

  const handleDexScreenerResponse = async (response: Response): Promise<string> => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.content;
  };

  const fetchTokenInfo = async (input: string): Promise<string> => {
    setLoading(true);
    try {
      // Clean the input - remove $ if present and trim
      const cleanInput = input.replace('$', '').trim();
      
      // Check if input looks like a contract address (rough check for length and hex)
      const isAddress = /^[A-Za-z0-9]{32,}$/.test(cleanInput);
      
      // Construct the API URL based on input type
      const queryType = isAddress ? 'token' : 'symbol';
      console.log('Fetching token info:', { queryType, cleanInput });
      
      const response = await fetch(`/api/market/dex?type=${queryType}&address=${cleanInput}`);
      return await handleDexScreenerResponse(response);
    } catch (error) {
      console.error('Error fetching token info:', error);
      return `❌ ${error instanceof Error ? error.message : 'Failed to fetch token information. Please try again.'}`;
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTokens = async (): Promise<string> => {
    setLoading(true);
    try {
      console.log('Fetching trending tokens...');
      const response = await fetch('/api/market/dex?type=trending');
      return await handleDexScreenerResponse(response);
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return `❌ ${error instanceof Error ? error.message : 'Failed to fetch trending tokens. Please try again.'}`;
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestPairs = async (): Promise<string> => {
    setLoading(true);
    try {
      console.log('Fetching latest pairs...');
      const response = await fetch('/api/market/dex?type=latest');
      return await handleDexScreenerResponse(response);
    } catch (error) {
      console.error('Error fetching latest pairs:', error);
      return `❌ ${error instanceof Error ? error.message : 'Failed to fetch latest pairs. Please try again.'}`;
    } finally {
      setLoading(false);
    }
  };

  const fetchBoostedTokens = async (): Promise<string> => {
    setLoading(true);
    try {
      console.log('Fetching boosted tokens...');
      const response = await fetch('/api/market/dex?type=boosted');
      return await handleDexScreenerResponse(response);
    } catch (error) {
      console.error('Error fetching boosted tokens:', error);
      return `❌ ${error instanceof Error ? error.message : 'Failed to fetch boosted tokens. Please try again.'}`;
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