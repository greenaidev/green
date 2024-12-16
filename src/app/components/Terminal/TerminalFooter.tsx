import React, { useState } from 'react';

interface Message {
  role: string;
  content: string;
  tokens?: number;
}

interface TerminalFooterProps {
  // Remove messages if not needed
  // messages: Message[];
  sendToOpenAI: (prompt: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TerminalFooter = ({ sendToOpenAI, setMessages }: TerminalFooterProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    await sendToOpenAI(input);
    setInput('');
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
        <div className="input-container">
          <span className="input-prefix">{'>_'}</span>
          <textarea
            required
            maxLength={5000}
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default TerminalFooter; 