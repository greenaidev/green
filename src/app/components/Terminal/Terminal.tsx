import React from 'react';
import TerminalBody from './TerminalBody';
import TerminalFooter from './TerminalFooter';
// import useOpenAI from '../../../hooks/useOpenAI'; // Remove or comment out this line if not needed

interface Message {
  role: string;
  content: string;
  tokens?: number;
}

interface TerminalProps {
  messages: Message[];
  sendToOpenAI: (prompt: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const Terminal: React.FC<TerminalProps> = ({ messages, sendToOpenAI, setMessages }) => {
  return (
    <div className="viewport">
      <TerminalBody messages={messages} />
      <TerminalFooter sendToOpenAI={sendToOpenAI} setMessages={setMessages} />
    </div>
  );
};

export default Terminal; 