import { useEffect, useRef } from 'react';
import MessageBlock from './MessageBlock';

interface TerminalBodyProps {
  messages?: { role: string; content: string }[];
}

const TerminalBody = ({ messages = [] }: TerminalBodyProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  console.log('Rendering messages:', messages);
  return (
    <div className="body">
      <div className="scroll" ref={scrollRef}>
        {messages.map((message, index) => (
          <MessageBlock key={index} user={message.role === 'user'} content={message.content} />
        ))}
      </div>
    </div>
  );
};

export default TerminalBody; 