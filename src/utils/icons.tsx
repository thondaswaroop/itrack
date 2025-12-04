// src/utils/icons.tsx
import React from "react";
import type { ComponentType, SVGProps } from "react";
import { MdSpaceDashboard, MdOutlineEmojiTransportation } from "react-icons/md";
import { BiLogoMastercard, BiImport, BiSolidFileBlank } from "react-icons/bi";
import { TbRouteSquare, TbBrandBooking, TbReportSearch } from "react-icons/tb";
import { PiUsersThreeFill } from "react-icons/pi";
import { CiSettings } from "react-icons/ci";
import { IoMdLogOut } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { FaCar } from "react-icons/fa";
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import { RiScan2Line } from "react-icons/ri";

export const Icons = {
  dashboard: MdSpaceDashboard,
  master: BiLogoMastercard,
  vehicle: MdOutlineEmojiTransportation,
  routes: TbRouteSquare,
  customers: PiUsersThreeFill,
  bookings: TbBrandBooking,
  reports: TbReportSearch,
  drivers: FaCar,
  settings: CiSettings,
  logout: IoMdLogOut,
  caretDown: IoIosArrowDown,
  edit: FiEdit2,
  trash: FiTrash2,
  import: BiImport,
  plus: FiPlus,
  report: BiSolidFileBlank,
  search: FiSearch,
  scan: RiScan2Line,
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
