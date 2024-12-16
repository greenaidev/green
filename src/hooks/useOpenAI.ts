import { useState } from 'react';

interface Message {
  role: string;
  content: string;
  tokens?: number;
}

const useOpenAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendToOpenAI = async (prompt: string) => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: messages }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from OpenAI API:', errorText);
        return;
      }

      const data = await response.json();
      const tokenCount = data.totalTokens;

      const newHistory = [
        ...messages,
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.message, tokens: tokenCount },
      ];

      setMessages(newHistory);
    } catch (error) {
      console.error('Error during OpenAI submission:', error);
    }
  };

  return { messages, sendToOpenAI, setMessages };
};

export default useOpenAI; 