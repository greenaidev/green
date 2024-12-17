import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBlockProps {
  user: boolean;
  content: string;
  tokens?: number;
}

const customStyle = {
  ...tomorrow,
  'pre[class*="language-"]': {
    ...tomorrow['pre[class*="language-"]'],
    background: '#000',
    borderRadius: '0',
    position: 'relative',
  },
  'code[class*="language-"]': {
    ...tomorrow['code[class*="language-"]'],
    background: '#000',
    borderRadius: '0',
  },
};

const MessageBlock: React.FC<MessageBlockProps> = ({ user, content, tokens }) => {
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((prevStatus) => ({ ...prevStatus, [key]: true }));
      setTimeout(() => setCopyStatus((prevStatus) => ({ ...prevStatus, [key]: false })), 3000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className={`msg ${user ? 'u' : ''}`}>
      <div className="msg-content markdown-container">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const key = `${language}-${String(children).slice(0, 10)}`; // Unique key for each code block
              return !inline && match ? (
                <div style={{ position: 'relative' }}>
                  <div className="code-block-header">
                    <span className="code-block-language">{language.toUpperCase()}</span>
                    <button
                      onClick={() => handleCopy(String(children).replace(/\n$/, ''), key)}
                      className="copy-button"
                    >
                      {copyStatus[key] ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={customStyle}
                    language={language}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="msg-footer">
        {!user && tokens !== undefined && (
          <span className="msg-tokens">{tokens}+</span>
        )}
        <span className="msg-btn" onClick={() => handleCopy(content, 'footer')}>
          {copyStatus['footer'] ? 'Copied!' : 'Copy'}
        </span>
      </div>
    </div>
  );
};

export default MessageBlock; 