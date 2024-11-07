import React, { useEffect, useRef, useState } from "react";
import { X as XIcon } from "lucide-react";
interface ModalDialogProps {
  isOpen: boolean;
  title?: string;
  children?: React.ReactNode;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({ isOpen, title, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        setIsClosing(true);
      }, 200);
    }
  }, [isClosing, setIsClosing]);

  const handleClickOutside = (e: MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      setIsClosing(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black bg-opacity-50 transition-opacity
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div
        ref={dialogRef}
        className={`
          relative w-full max-w-lg p-6 bg-white rounded-lg shadow-lg
          transform transition-transform
          ${isOpen ? "scale-100" : "scale-95"}
        `}
      >
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={() => setIsClosing(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}