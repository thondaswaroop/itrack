import React, { useEffect, useRef, useState } from "react";
import { useSidebar } from "../../context/SidebarContext";
import UserDropdown from "../header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen] = useState(false); // placeholder if you add app menu later
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="z-99999 sticky top-0 w-full bg-[var(--color-surface)] lg:border-b border-[var(--color-border)]">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b px-3 py-3 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 border-[var(--color-border)]">
          <button
            className="z-99999 h-10 w-10 items-center justify-center rounded-lg text-[var(--color-textMuted)] lg:flex lg:h-11 lg:w-11 lg:border border-[var(--color-border)]"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
          >
            {isMobileOpen ? (
              // close icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.22 7.28a.75.75 0 0 1 1.06-1.06L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              // hamburger
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  d="M.58 1A.75.75 0 0 1 1.33.25h13.33a.75.75 0 1 1 0 1.5H1.33A.75.75 0 0 1 .58 1Zm0 10a.75.75 0 0 1 .75-.75h13.33a.75.75 0 1 1 0 1.5H1.33A.75.75 0 0 1 .58 11ZM1.33 5.25a.75.75 0 0 1 0 1.5H8a.75.75 0 1 1 0-1.5H1.33Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>

        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"} lg:flex w-full items-center justify-between gap-4 px-5 py-4 lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">{/* add toggles/notifications later */}</div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
