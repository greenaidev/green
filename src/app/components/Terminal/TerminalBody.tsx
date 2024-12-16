import MessageBlock from './MessageBlock';

interface TerminalBodyProps {
  messages?: { role: string; content: string }[];
}

const TerminalBody = ({ messages = [] }: TerminalBodyProps) => {
  console.log('Rendering messages:', messages);
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