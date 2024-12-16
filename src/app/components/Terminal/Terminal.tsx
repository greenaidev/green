import { useEffect, useState } from 'react';
import TerminalBody from './TerminalBody';
import TerminalFooter from './TerminalFooter';

const Terminal = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    console.log('Loaded messages from localStorage:', storedHistory);
    setMessages(storedHistory);
  }, []);

  console.log('Passing setMessages function:', typeof setMessages);
  console.log('Initialized setMessages function:', typeof setMessages);

  return (
    <div className="viewport">
      <TerminalBody key={messages.length} messages={messages} />
      <TerminalFooter messages={messages} setMessages={setMessages} />
    </div>
  );
};

export default Terminal; 