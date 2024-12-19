import React, { useEffect, useRef } from 'react';
import MessageBlock from './MessageBlock';

interface TerminalBodyProps {
  messages: { role: string; content: string; tokens?: number; type?: string }[];
}

const TerminalBody: React.FC<TerminalBodyProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="body">
      <div className="scroll" ref={scrollRef}>
        {messages.map((message, index) => (
          <MessageBlock
            key={index}
            user={message.role === 'user'}
            content={message.content}
            tokens={message.tokens}
            type={message.type}
          />
        ))}
      </div>
    </div>
  );
};

export default TerminalBody; 