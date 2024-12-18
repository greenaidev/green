interface Message {
  role: string;
  content: string;
  tokens?: number;
}

interface CommandHandlerProps {
  command: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  generateImage?: (prompt: string) => Promise<void>;
  generateMeme?: (prompt: string) => Promise<void>;
  fetchGeckoTop?: () => Promise<void>;
  fetchGeckoTrending?: () => Promise<void>;
  getLocalTime?: () => Promise<string>;
  getLocationTime?: (location: string) => Promise<string>;
  getLocalWeather?: () => Promise<string>;
  getLocationWeather?: (location: string) => Promise<string>;
}

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
}: CommandHandlerProps) => {
  const [cmd, ...args] = command.split(' ');
  const prompt = args.join(' ');
  const fullCommand = `/${command}`;

  // Add user's command to chat history first
  setMessages((prev) => [...prev, { role: 'user', content: fullCommand }]);

  switch (cmd.toLowerCase()) {
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
      if (!prompt) {
        if (fetchGeckoTop) {
          await fetchGeckoTop();
        }
      } else if (prompt.toLowerCase() === 'trending' && fetchGeckoTrending) {
        await fetchGeckoTrending();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Available gecko commands: /gecko (top 50 by market cap), /gecko trending',
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
- \`/weather\` - Get current local weather
- \`/weather <location>\` - Get weather for a location (e.g., /weather tokyo)
- \`/time\` - Get current local time
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

## System Commands
- \`/clear\` - Clear the chat history
- \`/help\` - Show this help message

Welcome to the terminal! Use commands to interact with the system.`,
        },
      ]);
      break;
    case 'info':
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `# Application Information

## Features
- **AI Chat**: Engage in conversations with GPT-4
- **Image Generation**: Create images with DALL-E 3
- **Token Data**: Track Solana tokens using DexScreener
- **Market Analysis**: View trending and latest tokens
- **Weather & Time**: Get worldwide weather and time information

## Technologies
- Next.js for the framework
- OpenAI for AI capabilities
- DexScreener for market data
- CoinGecko for crypto market data
- OpenWeather for weather data
- Markdown for content formatting
- Prism.js for syntax highlighting

## Commands
Type \`/help\` to see all available commands.

Data provided by DexScreener, CoinGecko & OpenWeather • Built with ❤️ using Next.js`,
        },
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