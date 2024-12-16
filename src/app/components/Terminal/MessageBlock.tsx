import { useState } from 'react';

interface MessageBlockProps {
  user: boolean;
  content: string;
  tokens?: number;
}

const MessageBlock = ({ user, content, tokens }: MessageBlockProps) => {
  const [copyText, setCopyText] = useState('Copy');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 3000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className={`msg ${user ? 'u' : ''}`}>
      <div className="msg-content">{content}</div>
      <div className="msg-footer">
        {!user && tokens !== undefined && (
          <span className="msg-tokens">{tokens}+</span>
        )}
        <span className="msg-btn" onClick={handleCopy}>
          {copyText}
        </span>
      </div>
    </div>
  );
};

export default MessageBlock; 