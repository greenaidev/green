import React, { useState, useRef, useEffect } from 'react';
import { handleCommand } from '../../../utils/commandHandler';
import useDalle from '../../../hooks/useDalle';

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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isLoading = loading || imageLoading;

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
    }
  }, [isLoading]);

  useEffect(() => {
    if (imageUrl) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: imageUrl },
      ]);
    }
  }, [imageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith('/')) {
      const [cmd, ...args] = input.slice(1).split(' ');
      const prompt = args.join(' ');
      
      if (cmd.toLowerCase() === 'imagine' || cmd.toLowerCase() === 'meme') {
        if (prompt) {
          setMessages((prev) => [...prev, { role: 'user', content: input }]);
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
      } else {
        handleCommand({ command: input.slice(1), setMessages });
      }
      setInput('');
    } else {
      setLoading(true);
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
      setInput('');
      await sendToOpenAI(input);
      setLoading(false);
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
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default TerminalFooter; 