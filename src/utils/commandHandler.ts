interface CommandHandlerProps {
  command: string;
  setMessages: React.Dispatch<React.SetStateAction<{ role: string; content: string; tokens?: number }[]>>;
  setLoading?: (loading: boolean) => void;
  generateImage?: (prompt: string) => Promise<void>;
}

export const handleCommand = async ({ command, setMessages, setLoading, generateImage }: CommandHandlerProps) => {
  const [cmd, ...args] = command.split(' ');

  switch (cmd.toLowerCase()) {
    case 'imagine':
      const prompt = args.join(' ');
      if (prompt && generateImage && setLoading) {
        setLoading(true);
        await generateImage(prompt);
        setLoading(false);
      } else if (!prompt) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Please provide a prompt for the /imagine command.',
          },
        ]);
      }
      break;
    case 'help':
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `
# Available Commands

- **/help**: Show this help message
- **/reboot**: Clear the chat
- **/info**: Display information about the app
- **/imagine [prompt]**: Generate an image based on the prompt

Welcome to the terminal! Use commands to interact.
          `,
        },
      ]);
      break;
    case 'info':
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `
# Application Information

This app is a decentralized web application built with Next.js. It integrates with OpenAI for chat functionality and supports Solana blockchain interactions for wallet management.
          `,
        },
      ]);
      break;
    case 'reboot':
      setMessages([]);
      break;
    default:
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Unknown command: ${cmd}`,
        },
      ]);
  }
}; 