import React, { useState, useRef, useEffect } from 'react';

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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (loading) {
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
            cursorCount = cursorCount % 3 + 1; // Cycle through 1, 2, 3
            cycleCount = 0; // Reset cycle count after 3 full cycles
          }
        }
      }, 250); // Change frame every 250ms for faster spinning

      return () => clearInterval(interval);
    } else {
      setPlaceholder('');
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    await sendToOpenAI(input);
    setLoading(false);
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
            disabled={loading}
            placeholder={placeholder}
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default TerminalFooter; 