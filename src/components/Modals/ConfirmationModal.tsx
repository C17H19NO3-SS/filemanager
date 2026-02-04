import React, { useEffect, useRef } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-(--bg-primary) border border-(--border-color) rounded-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--text-primary)" }}
      >
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-sm opacity-80 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 bg-(--bg-secondary)/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 hover:bg-(--bg-tertiary) text-sm rounded-xs transition-colors border border-transparent hover:border-(--border-color)"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-(--accent-color) hover:bg-(--accent-hover) text-white text-sm rounded-xs shadow-sm transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
