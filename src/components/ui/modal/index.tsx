import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;

  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;

  size?: ModalSize;
  showCloseIcon?: boolean;
  dismissible?: boolean; // close on ESC / backdrop click
  className?: string; // extra classes for the panel
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-none w-screen h-screen",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  showCloseIcon = true,
  dismissible = true,
  className = "",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  const panelBase =
    "relative w-full rounded-xl bg-white p-4 shadow-xl dark:bg-gray-900 md:p-6";
  const panelClasses = clsx(
    panelBase,
    sizeClasses[size],
    size === "full" && "h-full rounded-none p-4 md:p-6",
    className
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[199999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (!dismissible) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={panelClasses}>
        {(title || showCloseIcon) && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {showCloseIcon && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.22 7.28a.75.75 0 0 1 1.06-1.06L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28Z" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className={size === "full" ? "h-[calc(100%-4rem)] overflow-auto" : ""}>{children}</div>

        {footer && (
          <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
