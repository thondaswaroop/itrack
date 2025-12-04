// src/components/Modal.tsx
import React, { useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../utils/icons";
import Button from "./form/Button";

type Size = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: Size;
  dismissible?: boolean; // allow closing via overlay click or ESC
  showCloseIcon?: boolean; // show X in header
  className?: string;
}

/**
 * Modal (accessible)
 * - Renders into document.body using portal
 * - Handles focus trap (simple), ESC-to-close, overlay click
 * - Tailwind-friendly classes (update to match your design tokens)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
  showCloseIcon = true,
  className = "",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size];

  // close on ESC
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && dismissible) {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, dismissible, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    // store last focused element so we can restore when modal closes
    lastActiveRef.current = document.activeElement as HTMLElement | null;

    // focus the dialog
    setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    document.addEventListener("keydown", handleKey);
    // prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
      // restore focus
      try {
        lastActiveRef.current?.focus();
      } catch {}
    };
  }, [isOpen, handleKey]);

  // simple focus trap: keep focus within modal
  const handleFocus = (e: React.FocusEvent) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // If focus moved out of dialog, bring back to first
    if (!dialog.contains(e.target as Node)) {
      first.focus();
    }

    // handle tabbing cycle
    const handleTab = (ev: KeyboardEvent) => {
      if (ev.key !== "Tab") return;
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        (last as HTMLElement).focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        (first as HTMLElement).focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    // remove listener when leaving
    setTimeout(() => document.removeEventListener("keydown", handleTab), 0);
  };

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    isOpen ? (
      <div
        ref={overlayRef}
        aria-hidden={!isOpen}
        className="fixed inset-0 z-[1000] flex items-start md:items-center justify-center"
        onMouseDown={(e) => {
          // overlay click to dismiss (only if click target is overlay)
          if (!dismissible) return;
          if (e.target === overlayRef.current) {
            onClose();
          }
        }}
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : undefined}
          tabIndex={-1}
          ref={dialogRef}
          onFocus={handleFocus}
          className={`relative z-10 m-4 w-full ${sizeClass} ${className}`}
        >
          <div className="transform overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-xl ring-1 ring-black/5 transition-all">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <div className="text-sm font-semibold text-[var(--color-text)]">{title}</div>

              <div className="flex items-center gap-2">
                {showCloseIcon && (
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-[var(--color-surfaceMuted)]"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <Icon name="x" className="h-4 w-4 text-[var(--color-text)]" />
                  </button>
                )}
              </div>
            </div>

            {/* body */}
            <div className="max-h-[70vh] overflow-auto p-4 text-sm text-[var(--color-text)]">
              {children}
            </div>

            {/* footer */}
            {footer && (
              <div className="border-t border-[var(--color-border)] px-4 py-3 bg-[var(--color-surface)]">
                <div className="flex justify-end gap-2">{footer}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
}
