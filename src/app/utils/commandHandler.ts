import { getReadmeContent } from './helpers';
import { Message } from '@/types/message';

interface CommandHandlerProps {
  command: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  generateImage?: (prompt: string) => Promise<void>;
  generateMeme?: (prompt: string) => Promise<void>;
  fetchGeckoTop?: () => Promise<string>;
  fetchGeckoTrending?: () => Promise<string>;
  getLocalTime?: () => Promise<string>;
  getLocationTime?: (location: string) => Promise<string>;
  getLocalWeather?: () => Promise<string>;
  getLocationWeather?: (location: string) => Promise<string>;
  getChart?: (symbol: string) => Promise<string>;
  handleLatestPairs?: () => Promise<string>;
  handleBoostedTokens?: () => Promise<string>;
  handleTrendingTokens?: () => Promise<string>;
  handleTokenInfo?: (address: string) => Promise<string>;
}

// At the top of the file, add a command alias mapping
const COMMAND_ALIASES: { [key: string]: string } = {
  'ca': 'token',
  'ticker': 'token',
  'symbol': 'token',
};

export const handleCommand = async ({
  command,
  setMessages,
  setLoading,
  generateImage,
  generateMeme,
  fetchGeckoTop,
  fetchGeckoTrending,
  getLocalTime,
  getLocationTime,
  getLocalWeather,
  getLocationWeather,
  getChart,
  handleLatestPairs,
  handleBoostedTokens,
  handleTrendingTokens,
  handleTokenInfo,
}: CommandHandlerProps) => {
  const [cmd, ...args] = command.split(' ');
  const prompt = args.join(' ');

  // Resolve the command alias to its main command
  const resolvedCmd = COMMAND_ALIASES[cmd.toLowerCase()] || cmd.toLowerCase();

  switch (resolvedCmd) {
    case 'weather':
      if (!prompt && getLocalWeather) {
        const weatherInfo = await getLocalWeather();
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: weatherInfo },
        ]);
      } else if (prompt && getLocationWeather) {
        const weatherInfo = await getLocationWeather(prompt);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: weatherInfo },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Usage: /weather [location] - Get current weather (local or for a specific location)',
          },
        ]);
      }
      break;
    case 'time':
      if (!prompt && getLocalTime) {
        const timeInfo = await getLocalTime();
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: timeInfo },
        ]);
      } else if (prompt && getLocationTime) {
        const timeInfo = await getLocationTime(prompt);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: timeInfo },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Usage: /time [location] - Get current time (local or for a specific location)',
          },
        ]);
      }
      break;
    case 'imagine':
      if (generateImage && setLoading) {
        setLoading(true);
        await generateImage(prompt);
        setLoading(false);
      }
      break;
    case 'meme':
      if (generateMeme && setLoading) {
        setLoading(true);
        await generateMeme(prompt);
        setLoading(false);
      }
      break;
    case 'clear':
      setMessages([]);
      break;
    case 'gecko':
      try {
        if (prompt === 'trending' && fetchGeckoTrending) {
          const content = await fetchGeckoTrending();
          setMessages((prev) => [
            ...prev,
            { 
              role: 'system',
              content,
              context: true  // Mark market data for AI context
            },
          ]);
        } else if (fetchGeckoTop) {
          const content = await fetchGeckoTop();
          setMessages((prev) => [
            ...prev,
            { 
              role: 'system',
              content,
              context: true  // Mark market data for AI context
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching CoinGecko data:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `Failed to fetch CoinGecko data: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        ]);
      }
      break;
    case 'chart':
      if (!prompt) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '❌ Please specify a trading pair (e.g., /chart btcusd)',
          },
        ]);
        return;
      }

      if (getChart) {
        await getChart(prompt.toLowerCase());
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: 'system', 
          content: `/chart ${prompt.toLowerCase()}`,
          type: 'chart'
        },
      ]);
      break;
    case 'token':
      if (!prompt) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '❌ Please provide a token address or symbol',
          },
        ]);
        return;
      }

      try {
        if (handleTokenInfo) {
          const content = await handleTokenInfo(prompt);
          setMessages((prev) => [
            ...prev,
            { 
              role: 'system',
              content,
              context: true  // Mark token info for AI context
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching token info:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `Failed to fetch token info: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        ]);
      }
      break;
    case 'help':
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `# Available Commands

## Weather & Time
- \`/weather\` - Get current local weather (requires location access)
- \`/weather <location>\` - Get weather for a location (e.g., /weather tokyo)
- \`/time\` - Get current time in all supported cities
- \`/time <location>\` - Get current time for a location (e.g., /time tokyo)

## Image Generation
- \`/imagine <prompt>\` - Generate an image using DALL-E
- \`/meme <prompt>\` - Generate a meme using DALL-E with system prompt

## Token Information
- \`/ca <address>\` - Get token information from DexScreener
- \`/ticker <symbol>\` - Get token information by symbol (e.g., /ticker bonk)

## Market Data
- \`/dex latest\` - Show 50 most recently created Solana pairs
- \`/dex trending\` - Show top 50 trending tokens
- \`/dex boosted\` - Show top 50 most boosted tokens
- \`/gecko\` - Show top 50 coins by market cap
- \`/gecko trending\` - Show trending coins on CoinGecko
- \`/chart <pair>\` - Show TradingView chart (e.g., /chart btcusd)

## User Data
- \`/info\` - Display user wallet and connection information

## System Commands
- \`/reboot\` - Reboot the terminal (clear chat history)
- \`/help\` - Show this help message
- \`/docs\` - Show full documentation

Welcome to the terminal! Use commands to interact with the system.`,
        },
      ]);
      break;
    case 'info':
      try {
        // Get wallet address from session
        const sessionResponse = await fetch('/api/session/validate');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.user?.walletAddress) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: '❌ Please connect your wallet first',
            },
          ]);
          return;
        }

        // Get user data from Redis
        const redisResponse = await fetch(`/api/redis/get?key=user:${sessionData.user.walletAddress}`);
        const redisData = await redisResponse.json();

        if (!redisData.success || !redisData.data) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: '❌ No user data found',
            },
          ]);
          return;
        }

        const userData = redisData.data;
        const tokenTicker = process.env.NEXT_PUBLIC_TOKEN_TICKER || 'GERTA';

        // Format user data
        const content = `# User Information

## Wallet
- Address: \`${userData.walletAddress}\`
- ${tokenTicker} Balance: ${userData[tokenTicker] || '0'}

${userData.telegramId ? `## Telegram
- ID: ${userData.telegramId}
- Username: @${userData.telegramUsername || 'N/A'}
- Name: ${userData.telegramFirstName || 'N/A'}
- Connected: ${new Date(parseInt(userData.lastUpdate)).toLocaleString()}` : '## Telegram\nNot connected'}

## Session
- Status: Active
- Last Updated: ${new Date(parseInt(userData.lastUpdate)).toLocaleString()}`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content,
          },
        ]);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '❌ Failed to fetch user information',
          },
        ]);
      }
      break;
    case 'dex':
      if (!prompt) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '❌ Please specify a dex command: latest, boosted, or trending',
          },
        ]);
        return;
      }

      const [subCmd] = prompt.split(' ');
      
      try {
        let content: string;
        switch (subCmd.toLowerCase()) {
          case 'latest':
            if (handleLatestPairs) {
              content = await handleLatestPairs();
              setMessages((prev) => [
                ...prev,
                { 
                  role: 'system',
                  content,
                  context: true
                },
              ]);
            }
            break;
          case 'boosted':
            if (handleBoostedTokens) {
              content = await handleBoostedTokens();
              setMessages((prev) => [
                ...prev,
                { 
                  role: 'system',
                  content,
                  context: true
                },
              ]);
            }
            break;
          case 'trending':
            if (handleTrendingTokens) {
              content = await handleTrendingTokens();
              setMessages((prev) => [
                ...prev,
                { 
                  role: 'system',
                  content,
                  context: true
                },
              ]);
            }
            break;
          default:
            setMessages((prev) => [
              ...prev,
              {
                role: 'system',
                content: '❌ Available dex commands: latest, boosted, trending',
              },
            ]);
        }
      } catch (err) {
        console.error('Error handling dex command:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `Failed to execute dex command: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        ]);
      }
      break;
    case 'docs':
      try {
        const readme = await getReadmeContent();
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: readme
          }
        ]);
      } catch (err) {
        console.error('Error loading documentation:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '❌ Error loading documentation. Please try again.'
          }
        ]);
      }
      break;
    case 'reboot':
      setMessages([
        {
          role: 'system',
          content: 'System rebooted. Terminal session cleared.',
        }
      ]);
      break;
    default:
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Unknown command: ${cmd}. Type /help for available commands.`,
        },
      ]);
  }
}; 