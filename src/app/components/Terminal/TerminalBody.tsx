import { useEffect, useState } from 'react';
import MessageBlock from './MessageBlock';

const TerminalBody = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    setMessages(storedHistory);
  }, []);

  return (
    <div className="body">
      <div className="scroll">
        {messages.map((message, index) => (
          <MessageBlock key={index} user={message.role === 'user'} content={message.content} />
        ))}
      </div>
    </div>
  );
};

export default TerminalBody; 