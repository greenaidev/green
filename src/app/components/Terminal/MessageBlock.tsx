interface MessageBlockProps {
  user: boolean;
  content: string;
}

const MessageBlock = ({ user, content }: MessageBlockProps) => {
  return (
    <div className={`msg ${user ? 'u' : ''}`}>
      <div className="msg-body">
        <p className="msg-content">{content}</p>
      </div>
      <div className="msg-footer">
        <a href="#" className="msg-btn">{user ? 'Resend' : 'Copy'}</a>
      </div>
    </div>
  );
};

export default MessageBlock; 