// components/Modal.tsx

import { useEffect, useState } from "react";

type ModalProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

const Modal = ({ message, type = "info", duration, onClose }: ModalProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`modal modal-${type}`}>
      <p>{message}</p>
      <button onClick={() => setVisible(false)}>Close</button>
    </div>
  );
};

export default Modal;
