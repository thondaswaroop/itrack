import type { IconName } from "../../utils/icons";

/** Roles: 1=Admin, 2=Vendor, 3=Associate */
export type RoleId = 1 | 2 | 3;

type Visibility = {
  /** Only these roles can see it (whitelist). If omitted, all roles can see unless hiddenFor matches. */
  visibleFor?: RoleId[];
  /** These roles cannot see it (blacklist). */
  hiddenFor?: RoleId[];
};

export type SubItem = {
  name: string;
  path: string;
  icon?: IconName;   // ✅ icon for subitems too
} & Visibility;

export type NavItem = {
  name: string;
  icon: IconName;
  path?: string;
  subItems?: SubItem[];
} & Visibility;

/** Helper: should current role see this entry? */
const isVisibleForRole = (v: Visibility | undefined, role: RoleId | null): boolean => {
  if (!role) return true; // if unknown, show (you can flip to false if you prefer)
  if (!v) return true;
  if (v.visibleFor && v.visibleFor.length > 0 && !v.visibleFor.includes(role)) return false;
  if (v.hiddenFor && v.hiddenFor.includes(role)) return false;
  return true;
};

export const NAV_ITEMS: NavItem[] = [
  { icon: "dashboard", name: "Dashboard", path: "/home" },
  
  {
    icon: "shipment",
    name: "Shipments",
    subItems: [
      { name: "New Receipt", path: "/newshipment", icon: "receipt" },
      { name: "Arrival", path: "/arrival", icon: "truck" },
      { name: "Scan Package", path: "/scan", icon: "scan" },
    ],
  },

  {
    icon: "warehouse",
    name: "Load",
    path: "/load",
  },

  {
    icon: "master",
    name: "Masters",
    subItems: [
      { name: "Countries", path: "/countries", icon: "country", hiddenFor: [2, 3] },
      { name: "Locations", path: "/locations", icon: "location", hiddenFor: [2, 3] },
      { name: "Hubs", path: "/hubs", icon: "hub", hiddenFor: [2, 3] },
      { name: "Vendors", path: "/vendors", icon: "customers", visibleFor: [1] },
      { name: "Associates", path: "/associates", icon: "drivers", hiddenFor: [3] },
      { name: "Containers", path: "/containers", icon: "container", hiddenFor: [3] },
      { name: "Shelves", path: "/shelves", icon: "shelf", hiddenFor: [3] },
    ],
  },

  { icon: "customers", name: "Customers", path: "/customers" },
  { icon: "reports", name: "Reports", path: "/reports" },
  { icon: "settings", name: "Settings", path: "/settings" },
  { icon: "profile", name: "Account Info", path: "/account-diagnostics" },
  { icon: "logout", name: "Logout", path: "/logout" },
];

/** Recursively filter nav by role. */
export const getNavForRole = (roleId: RoleId | null): NavItem[] => {
  const items: NavItem[] = [];

  for (const item of NAV_ITEMS) {
    if (!isVisibleForRole(item, roleId)) continue;

    // Copy to avoid mutation
    const next: NavItem = { ...item };

    if (item.subItems && item.subItems.length > 0) {
      const filteredSubs = item.subItems.filter((s) => isVisibleForRole(s, roleId));
      if (filteredSubs.length > 0) {
        next.subItems = filteredSubs;
        items.push(next);
      } else {
        // If no subitems left and item has direct path, keep it; otherwise drop it.
        if (item.path) items.push(next);
      }
    } else {
      items.push(next);
    }
  }

  return items;
};
