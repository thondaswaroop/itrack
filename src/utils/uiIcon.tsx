// src/utils/uiIcon.tsx
import React from "react";
import { Icons as Registry } from "./icons";

export type UIIconName = string | keyof typeof Registry;

export const inlineSvgs: Record<string, JSX.Element> = {
  x: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  printer: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 9V3h12v6M6 15H4a1 1 0 01-1-1V9h18v5a1 1 0 01-1 1h-2M9 18h6v3H9v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 3v12M8 11l4 4 4-4M4 21h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type Props = {
  name: UIIconName;
  className?: string;
  title?: string;
  ariaHidden?: boolean;
};

const UIIcon: React.FC<Props> = ({ name, className = "h-4 w-4", title, ariaHidden = true }) => {
  const key = String(name);
  const RegComp = (Registry as any)[key];
  if (RegComp) {
    const Comp = RegComp as React.ComponentType<{ className?: string }>;
    return <Comp className={className} aria-hidden={ariaHidden} title={title} />;
  }
  const sv = inlineSvgs[key];
  if (sv) {
    return (
      <span className={className} aria-hidden={ariaHidden} title={title}>
        {React.cloneElement(sv, { width: "100%", height: "100%", focusable: false })}
      </span>
    );
  }
  return (
    <span className={className} aria-hidden={ariaHidden} title={title}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </span>
  );
};

export default UIIcon;
export { UIIcon as Icon };
