// components/LogOutButton.tsx

const LogOutButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button className="logout-button" onClick={onClick}>
        Log Out
      </button>
    );
  };
  
  export default LogOutButton;
  