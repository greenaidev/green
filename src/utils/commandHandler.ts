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
}

export const handleCommand = async ({
  command,
  setMessages,
  setLoading,
  generateImage,
  generateMeme,
}: CommandHandlerProps) => {
  const [cmd, ...args] = command.split(' ');
  const prompt = args.join(' ');

  switch (cmd.toLowerCase()) {
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
    case 'help':
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `# Available Commands

## Image Generation
- \`/imagine <prompt>\` - Generate an image using DALL-E
- \`/meme <prompt>\` - Generate a meme using DALL-E with system prompt

## Token Information
- \`/ca <address>\` - Get token information from DexScreener
- \`/ticker <symbol>\` - Get token information by symbol (e.g., /ticker bonk)

## Market Data
- \`/trending\` - Show top 50 trending tokens
- \`/latest\` - Show 50 most recently created Solana pairs
- \`/boosted\` - Show top 50 most boosted tokens
- \`/filter <min> <max> [limit]\` - Filter latest tokens by market cap range (in K, e.g., /filter 12 30 100)

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

## Technologies
- Next.js for the framework
- OpenAI for AI capabilities
- DexScreener for market data
- Markdown for content rendering

## Commands
Type \`/help\` to see all available commands.

Data provided by DexScreener • Built with ❤️ using Next.js`,
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