// components/Modal.tsx

import { useEffect, useState } from "react";
import { DEFAULT_MODAL_DURATION } from "../utils/config";

type ModalProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

const Modal = ({ message, type = "info", duration = DEFAULT_MODAL_DURATION, onClose }: ModalProps) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setFading(true); // Trigger fade-out animation
        setTimeout(() => {
          setVisible(false);
          if (onClose) onClose();
        }, 250); // Matches the CSS fade-out duration
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`modal-overlay ${fading ? "fade-out" : "fade-in"}`}
      onClick={() => {
        setFading(true); // Trigger fade-out on overlay click
        setTimeout(() => {
          setVisible(false);
          if (onClose) onClose();
        }, 250); // Matches the fade-out duration
      }}
    >
      <div className={`modal modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button
          onClick={() => {
            setFading(true); // Trigger fade-out on button click
            setTimeout(() => {
              setVisible(false);
              if (onClose) onClose();
            }, 250); // Matches the fade-out duration
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
