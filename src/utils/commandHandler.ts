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
          content: `Available commands:
/clear - Clear the chat history
/help - Show this help message
/imagine <prompt> - Generate an image using DALL-E
/meme <prompt> - Generate a meme using DALL-E with system prompt`,
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