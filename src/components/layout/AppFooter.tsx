import React from "react";
import { commonconstants } from "../../constants/common";


const AppFooter: React.FC = () => {

  return (
    <header className="z-99999 sticky top-0 w-full bg-[var(--color-surface)] lg:border-b border-[var(--color-border)]">
      <div className="p-5 grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="text-center">
          &copy; {commonconstants.APP_NAME} all rights reserved. Design & Developed by PmgsGroups
        </div>
      </div>
    </header>
  );
};

export default AppFooter;
