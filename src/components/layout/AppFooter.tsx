import React from "react";
import { commonconstants } from "../../constants/common";


const AppFooter: React.FC = () => {

  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border)] bg-[var(--color-surface)] print:hidden">{" "}
      <div className="px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-[var(--color-textMuted)] sm:flex-row sm:justify-between">
          <p className="order-2 sm:order-1">
            &copy; {new Date().getFullYear()} {commonconstants.APP_NAME}. All rights reserved.
          </p>
          <p className="order-1 sm:order-2">
            Design & Developed by <span className="font-medium text-[var(--color-text)]">PmgsGroups</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
