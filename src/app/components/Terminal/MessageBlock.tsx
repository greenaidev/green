import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';
import TradingViewChart from '../TradingViewChart';


interface MessageBlockProps {
  user: boolean;
  content: string;
  tokens?: number;
  type?: string;
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

const MessageBlock: React.FC<MessageBlockProps> = ({ user, content, tokens, type }) => {
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

  const isImageUrl = (content: string): boolean => {
    if (!content) return false;
    return content.includes('http') && 
      (content.includes('.png') || 
       content.includes('.jpg') || 
       content.includes('.jpeg') || 
       content.includes('.gif') ||
       content.includes('images.openai.com'));
  };

  return (
    <div className={`msg ${user ? 'u' : ''}`}>
      <div className="msg-top">
        <div className={`msg-icon ${user ? 'user' : 'system'}`}></div>
        <div className="msg-content markdown-container">
          {type === 'chart' ? (
            <TradingViewChart symbol={content.split(' ')[1]} />
          ) : isImageUrl(content) ? (
            <div className="message-image-container" style={{ position: 'relative', width: '600px', height: '600px', margin: '20px auto' }}>
              <Image
                src={content}
                alt="Generated"
                fill
                style={{ objectFit: 'contain' }}
                className="message-image"
                unoptimized // Since we're dealing with dynamic DALL-E URLs
              />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const key = `${language}-${String(children).slice(0, 10)}`; // Unique key for each code block
                  return !inline && match ? (
                    <div className="code-block-container">
                      <div className="code-block-header">
                        <span className="code-block-language">{language.toUpperCase()}</span>
                        <button
                          onClick={() => handleCopy(String(children).replace(/\n$/, ''), key)}
                          className="copy-button shared-style"
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
          )}
        </div>
      </div>
      <div className="msg-footer">
        {!user && tokens !== undefined && (
          <span className="msg-tokens">{tokens}+</span>
        )}
        <span className="msg-btn shared-style" onClick={() => handleCopy(content, 'footer')}>
          {copyStatus['footer'] ? 'Copied!' : 'Copy'}
        </span>
      </div>
    </div>
  );
};

export default MessageBlock; 