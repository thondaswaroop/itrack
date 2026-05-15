// src/utils/icons.tsx
import React from "react";
import type { ComponentType, SVGProps } from "react";
import { MdSpaceDashboard, MdLocalShipping, MdQrCodeScanner, MdWarehouse, MdInventory2 } from "react-icons/md";
import { BiPackage, BiImport } from "react-icons/bi";
import { TbTruckDelivery, TbReportAnalytics, TbBuildingWarehouse } from "react-icons/tb";
import { PiUsersThreeFill } from "react-icons/pi";
import { CiSettings } from "react-icons/ci";
import { IoMdLogOut } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { FaShippingFast, FaWarehouse, FaBoxOpen, FaMapMarkerAlt, FaGlobeAmericas, FaCity, FaStore, FaLock, FaCheckCircle, FaBell, FaDownload } from "react-icons/fa";
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiPackage } from "react-icons/fi";
import { RiScan2Line } from "react-icons/ri";
import { HiOutlineReceiptTax } from "react-icons/hi";
import { BsBox, BsBoxSeam } from "react-icons/bs";
import { AiOutlineWarning } from "react-icons/ai";

export const Icons = {
  dashboard: MdSpaceDashboard,
  master: MdInventory2,              // Changed from credit card to inventory
  vehicle: TbTruckDelivery,          // Changed to truck delivery
  routes: FaMapMarkerAlt,            // Changed to map marker
  customers: PiUsersThreeFill,       // Keep users
  bookings: BiPackage,               // Changed to package icon
  reports: TbReportAnalytics,        // Changed to analytics report
  drivers: FaShippingFast,           // Changed to shipping/delivery person
  settings: CiSettings,              // Keep settings
  logout: IoMdLogOut,                // Keep logout
  caretDown: IoIosArrowDown,         // Keep caret
  edit: FiEdit2,                     // Keep edit
  trash: FiTrash2,                   // Keep trash
  delete: FiTrash2,                  // Add delete alias
  import: BiImport,                  // Keep import
  plus: FiPlus,                      // Keep plus
  report: TbReportAnalytics,         // Changed to analytics
  search: FiSearch,                  // Keep search
  scan: MdQrCodeScanner,             // Changed to barcode scanner
  warehouse: FaWarehouse,            // Add warehouse icon
  container: BsBoxSeam,              // Add container icon
  shelf: TbBuildingWarehouse,        // Add shelf/storage icon
  package: FiPackage,                // Add package icon
  shipment: MdLocalShipping,         // Add shipment icon
  receipt: HiOutlineReceiptTax,      // Add receipt icon
  box: FaBoxOpen,                    // Add box icon
  country: FaGlobeAmericas,          // Add country/globe icon
  location: FaMapMarkerAlt,          // Add location icon
  city: FaCity,                      // Add city icon
  hub: FaStore,                      // Add hub/store icon
  lock: FaLock,                      // Add lock icon for security
  bell: FaBell,                      // Add bell icon for notifications
  success: FaCheckCircle,            // Add success/check icon
  warning: AiOutlineWarning,         // Add warning icon
  download: FaDownload,              // Add download icon
} as const;

export type IconName = keyof typeof Icons;
type IconComp = ComponentType<{ className?: string } & SVGProps<SVGSVGElement> | any>;

/**
 * Icon wrapper - returns react-icon if available, otherwise fallback svg
 */
export const Icon: React.FC<{ name: IconName | string; className?: string; title?: string }> = ({ name, className = "h-5 w-5", title }) => {
  const key = String(name);
  const Comp = (Icons as any)[key] as IconComp | undefined;
  if (Comp) return <Comp className={className} aria-hidden={!title} title={title} />;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" role="img" aria-hidden={!title} title={title}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default Icon;
