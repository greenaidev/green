import React, { useState, useRef, useEffect } from 'react';
import { handleCommand } from '../../../app/utils/commandHandler';
import useDalle from '../../../hooks/useDalle';
import useDexScreener from '../../../hooks/useDexScreener';
import useGecko from '../../../hooks/useGecko';
import useTime from '../../../hooks/useTime';
import useWeather from '../../../hooks/useWeather';
import useChart from '../../../hooks/useChart';

interface Message {
  role: string;
  content: string;
  tokens?: number;
}

interface TerminalFooterProps {
  sendToOpenAI: (prompt: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TerminalFooter = ({ sendToOpenAI, setMessages }: TerminalFooterProps) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { generateImage, generateMeme, imageUrl, loading: imageLoading } = useDalle();
  const { 
    fetchTokenInfo, 
    fetchTrendingTokens, 
    fetchLatestPairs, 
    fetchBoostedTokens, 
    loading: tokenLoading 
  } = useDexScreener();
  const { fetchTopCoins, fetchTrendingCoins, loading: geckoLoading } = useGecko();
  const { getLocalTime, getLocationTime, loading: timeLoading } = useTime();
  const { getLocalWeather, getLocationWeather, loading: weatherLoading } = useWeather();
  const { getChart, loading: chartLoading } = useChart();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Refocus input after loading state changes
  useEffect(() => {
    if (!loading && !imageLoading && !tokenLoading && !geckoLoading && !timeLoading && !weatherLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, imageLoading, tokenLoading, geckoLoading, timeLoading, weatherLoading]);

  const isLoading = loading || imageLoading || tokenLoading || geckoLoading || timeLoading || weatherLoading || chartLoading;

  useEffect(() => {
    if (isLoading) {
      const cursorFrames = ['/', '-', '\\', '|'];
      let frameIndex = 0;
      let cursorCount = 1;
      let cycleCount = 0;
      const interval = setInterval(() => {
        const currentFrame = cursorFrames[frameIndex];
        const pattern = currentFrame.repeat(cursorCount);
        setPlaceholder(pattern);

        frameIndex = (frameIndex + 1) % cursorFrames.length;
        if (frameIndex === 0) {
          cycleCount++;
          if (cycleCount === 3) {
            cursorCount = cursorCount % 3 + 1;
            cycleCount = 0;
          }
        }
      }, 250);

      return () => clearInterval(interval);
    } else {
      setPlaceholder('');
      // Refocus when loading ends
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (imageUrl) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: imageUrl },
      ]);
      // Refocus after image is added
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [imageUrl, setMessages]);

  const handleTokenInfo = async (address: string): Promise<string> => {
    const content = await fetchTokenInfo(address);
    return content ?? 'No token information available.';
  };

  const handleTrendingTokens = async (): Promise<string> => {
    const content = await fetchTrendingTokens();
    return content ?? 'No trending tokens available.';
  };

  const handleLatestPairs = async (): Promise<string> => {
    const content = await fetchLatestPairs();
    return content ?? 'No latest pairs available.';
  };

  const handleBoostedTokens = async (): Promise<string> => {
    const content = await fetchBoostedTokens();
    return content ?? 'No boosted tokens available.';
  };

  const handleGeckoTop = async (): Promise<string> => {
    const content = await fetchTopCoins();
    return content ?? 'No top coins data available.';
  };

  const handleGeckoTrending = async (): Promise<string> => {
    const content = await fetchTrendingCoins();
    return content ?? 'No trending coins data available.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith('/')) {
      // Always show the command that was typed
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      
      handleCommand({
        command: input.slice(1),
        setMessages,
        setLoading,
        generateImage,
        generateMeme,
        fetchGeckoTop: handleGeckoTop,
        fetchGeckoTrending: handleGeckoTrending,
        getLocalTime,
        getLocationTime,
        getLocalWeather,
        getLocationWeather,
        getChart,
        handleLatestPairs,
        handleBoostedTokens,
        handleTrendingTokens,
        handleTokenInfo
      });
      setInput('');
    } else {
      setLoading(true);
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setInput('');
      await sendToOpenAI(input);
      setLoading(false);
    }
    
    // Refocus after command execution
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e.nativeEvent as unknown as React.FormEvent);
    }
  };

  return (
    <div className="footer">
      <form className="terminal" onSubmit={handleSubmit}>
        <div className="input-container" style={{ position: 'relative' }}>
          <span className="input-prefix">{'>_'}</span>
          <textarea
            ref={inputRef}
            required
            maxLength={5000}
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
            onBlur={() => {
              // Prevent losing focus unless disabled
              if (!isLoading) {
                inputRef.current?.focus();
              }
            }}
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default TerminalFooter; 