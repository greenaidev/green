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
  const { fetchTokenInfo, fetchTrendingTokens, fetchLatestPairs, fetchBoostedTokens, loading: tokenLoading } = useDexScreener();
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

  const handleTokenInfo = async (address: string) => {
    const content = await fetchTokenInfo(address);
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleTickerInfo = async (symbol: string) => {
    try {
      const response = await fetch(`/api/ticker?symbol=${symbol}`);
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: data.content },
      ]);
    } catch (error) {
      console.error('Error fetching ticker info:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Failed to fetch token information. Please try again.' },
      ]);
    }
  };

  const handleTrendingTokens = async () => {
    const content = await fetchTrendingTokens();
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleLatestPairs = async () => {
    const content = await fetchLatestPairs();
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleBoostedTokens = async () => {
    const content = await fetchBoostedTokens();
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleGeckoTop = async () => {
    const content = await fetchTopCoins();
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleGeckoTrending = async () => {
    const content = await fetchTrendingCoins();
    if (content) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith('/')) {
      const [cmd, ...args] = input.slice(1).split(' ');
      const prompt = args.join(' ');
      
      if (cmd.toLowerCase() === 'imagine' || cmd.toLowerCase() === 'meme') {
        if (prompt) {
          handleCommand({ 
            command: input.slice(1), 
            setMessages, 
            setLoading, 
            generateImage, 
            generateMeme 
          });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: `Please provide a prompt for the /${cmd} command.`,
            },
          ]);
        }
      } else if (cmd.toLowerCase() === 'time') {
        handleCommand({
          command: input.slice(1),
          setMessages,
          getLocalTime,
          getLocationTime
        });
      } else if (cmd.toLowerCase() === 'weather') {
        handleCommand({
          command: input.slice(1),
          setMessages,
          getLocalWeather,
          getLocationWeather
        });
      } else if (cmd.toLowerCase() === 'gecko') {
        handleCommand({
          command: input.slice(1),
          setMessages,
          fetchGeckoTop: handleGeckoTop,
          fetchGeckoTrending: handleGeckoTrending
        });
      } else if (cmd.toLowerCase() === 'chart') {
        handleCommand({
          command: input.slice(1),
          setMessages,
          getChart
        });
      } else if (cmd.toLowerCase() === 'dex') {
        if (!prompt) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Please specify a dex command: latest, boosted, or trending',
            },
          ]);
          return;
        }

        const [subCmd] = prompt.split(' ');
        
        // Add user's command to chat history
        setMessages((prev) => [...prev, { role: 'user', content: input }]);
        
        switch (subCmd.toLowerCase()) {
          case 'latest':
            await handleLatestPairs();
            break;
          case 'boosted':
            await handleBoostedTokens();
            break;
          case 'trending':
            await handleTrendingTokens();
            break;
          default:
            setMessages((prev) => [
              ...prev,
              {
                role: 'system',
                content: 'Unknown dex command. Available commands: latest, boosted, trending',
              },
            ]);
        }
      } else if (cmd.toLowerCase() === 'ca') {
        if (prompt) {
          setMessages((prev) => [...prev, { role: 'user', content: input }]);
          await handleTokenInfo(prompt);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Please provide a token contract address.',
            },
          ]);
        }
      } else if (cmd.toLowerCase() === 'ticker') {
        if (prompt) {
          setMessages((prev) => [...prev, { role: 'user', content: input }]);
          await handleTickerInfo(prompt);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Please provide a token symbol (e.g., /ticker bonk).',
            },
          ]);
        }
      } else {
        handleCommand({ command: input.slice(1), setMessages });
      }
      setInput('');
      // Refocus after command execution
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setLoading(true);
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setInput('');
      await sendToOpenAI(input);
      setLoading(false);
      // Refocus after OpenAI response
      if (inputRef.current) {
        inputRef.current.focus();
      }
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