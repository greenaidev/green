// components/ConnectButton.tsx

const ConnectButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button className="connect-button" onClick={onClick}>
        Connect Wallet
      </button>
    );
  };
  
  export default ConnectButton;
  