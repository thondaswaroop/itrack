import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "../ui/avatar/Avatar";
import { useSidebar } from "../../context/SidebarContext";
import { Icon } from "../../utils/icons";
import { getNavForRole, type NavItem } from "../../navigation/config/navigation";
import { commonconstants } from "../../constants/common";
import { imageAssets } from "../../utils/resources";

type OpenState = { index: number } | null;

const SideMenu: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // read role once per mount; if you have auth store, use it instead
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("UserDetails") || "null");
    } catch {
      return null;
    }
  })();
  const roleId: 1 | 2 | null = user?.roleId ?? null;

  const navItems = useMemo<NavItem[]>(() => getNavForRole(roleId), [roleId]);

  const [openSubmenu, setOpenSubmenu] = useState<OpenState>(null);
  const [subHeights, setSubHeights] = useState<Record<string, number>>({});
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      return location.pathname === path;
    },
    [location.pathname]
  );

  // open submenu when a sub-route is active
  useEffect(() => {
    let opened: OpenState = null;
    navItems.forEach((nav, index) => {
      if (nav.subItems?.some((s) => isActive(s.path))) opened = { index };
    });
    setOpenSubmenu(opened);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navItems]);

  // measure submenu heights for smooth transitions
  useEffect(() => {
    if (openSubmenu) {
      const key = `sub-${openSubmenu.index}`;
      const el = refs.current[key];
      if (el) {
        setSubHeights((p) => ({ ...p, [key]: el.scrollHeight || 0 }));
      }
    }
  }, [openSubmenu]);

  const toggleSubmenu = (index: number) =>
    setOpenSubmenu((prev) => (prev?.index === index ? null : { index }));

  const handleLogout = () => {
    localStorage.removeItem("UserDetails");
    navigate("/signIn", { replace: true });
  };

  const wide = isExpanded || isHovered || isMobileOpen;
  const widthClass = wide ? "w-[290px]" : "w-[90px]";

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r px-5 transition-all duration-300 ease-in-out
      bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]
      ${widthClass} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:mt-0 mt-16`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo / Brand */}
      <div className={`py-8 flex ${wide ? "justify-start" : "lg:justify-center"}`}>
        <Link to="/">
          {wide ? (
            <span className="block text-theme-md font-bold text-[var(--color-textMuted)]">
              <div className="flex">
                <div>
                  <img src={imageAssets.logo} className="h-8 mr-5" />
                </div>
                <div className="mt-1">{commonconstants.APP_NAME}</div>
              </div>
            </span>
          ) : (
            <img src={imageAssets.logo} />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <ul className="flex flex-col gap-4">
            {navItems.map((nav, index) => {
              const isLogout = nav.name === "Logout";
              const hasSubs = !!nav.subItems?.length;
              const open = openSubmenu?.index === index;

              const itemContent = (
                <>
                  <span className="menu-item-icon-size">
                    <Icon name={nav.icon} />
                  </span>
                  {wide && <span className="menu-item-text">{nav.name}</span>}
                  {wide && hasSubs && (
                    <span className="ml-auto">
                      <Icon
                        name="caretDown"
                        className={`h-5 w-5 transition-transform duration-200 ${
                          open ? "rotate-180 text-[var(--color-primary)]" : ""
                        }`}
                      />
                    </span>
                  )}
                </>
              );

              return (
                <li key={nav.name}>
                  {isLogout ? (
                    <button
                      onClick={handleLogout}
                      className="menu-item group menu-item-inactive w-full text-left"
                    >
                      {itemContent}
                    </button>
                  ) : hasSubs ? (
                    <button
                      onClick={() => toggleSubmenu(index)}
                      className={`menu-item group ${
                        open ? "menu-item-active" : "menu-item-inactive"
                      } w-full text-left`}
                    >
                      {itemContent}
                    </button>
                  ) : (
                    nav.path && (
                      <Link
                        to={nav.path}
                        className={`menu-item group ${
                          isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                        }`}
                      >
                        {itemContent}
                      </Link>
                    )
                  )}

                  {/* Submenu */}
                  {hasSubs && wide && (
                    <div
                      ref={(el) => {
                        refs.current[`sub-${index}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height: open ? `${subHeights[`sub-${index}`] || 0}px` : "0px",
                      }}
                    >
                      <ul className="ml-9 mt-2 space-y-1">
                        {nav.subItems!.map((s) => (
                          <li key={s.name}>
                            <Link
                              to={s.path}
                              className={`menu-dropdown-item ${
                                isActive(s.path)
                                  ? "menu-dropdown-item-active"
                                  : "menu-dropdown-item-inactive"
                              }`}
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default SideMenu;
