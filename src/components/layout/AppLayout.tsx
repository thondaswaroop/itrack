import React from "react";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import SideMenu from "./SideMenu";
import AppFooter from "./AppFooter";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const leftWidth = isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  return (
    <div className="xl:flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div>
        <SideMenu />
        <Backdrop />
      </div>
      <div className={`flex-1 transition-all duration-300 ease-in-out ${leftWidth} ${isMobileOpen ? "ml-0" : ""}`}>
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;
