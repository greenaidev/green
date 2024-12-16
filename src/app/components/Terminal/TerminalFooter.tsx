import { useState } from 'react';

interface TerminalFooterProps {
  messages: { role: string; content: string }[];
  setMessages: React.Dispatch<React.SetStateAction<{ role: string; content: string }[]>>;
}

const TerminalFooter = ({ messages = [], setMessages }: TerminalFooterProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.startsWith('/')) {
      handleCommand(input);
    } else {
      await sendToOpenAI(input);
    }

    setInput('');
  };

  const handleCommand = (command: string) => {
    // Handle commands
  };

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
      const newHistory = [
        ...messages,
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.message },
      ];

      // Update both localStorage and the state
      localStorage.setItem('chatHistory', JSON.stringify(newHistory));
      setMessages(newHistory); // This will trigger re-render in TerminalBody
    } catch (error) {
      console.error('Error during OpenAI submission:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="footer">
      <form className="terminal" onSubmit={handleSubmit}>
        <textarea
          required
          placeholder=">_"
          maxLength={5000}
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        ></textarea>
      </form>
    </div>
  );
};

export default TerminalFooter; 