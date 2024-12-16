import React from 'react';
import TerminalBody from './TerminalBody';
import TerminalFooter from './TerminalFooter';
import useOpenAI from '../../../hooks/useOpenAI';

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
      <TerminalFooter messages={messages} sendToOpenAI={sendToOpenAI} setMessages={setMessages} />
    </div>
  );
};

export default Terminal; 