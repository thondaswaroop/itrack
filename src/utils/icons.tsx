// src/icons/index.ts
import { MdSpaceDashboard, MdOutlineEmojiTransportation } from "react-icons/md";
import { BiLogoMastercard } from "react-icons/bi";
import { TbRouteSquare, TbBrandBooking, TbReportSearch } from "react-icons/tb";
import { PiUsersThreeFill } from "react-icons/pi";
import { CiSettings } from "react-icons/ci";
import { IoMdLogOut } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { FaCar } from "react-icons/fa";
import type { ComponentType } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { BiImport,BiSolidFileBlank } from "react-icons/bi";


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
  import:BiImport,
  plus: FiPlus,
  report:BiSolidFileBlank,
} as const;

export type IconName = keyof typeof Icons;
export type IconComponent = ComponentType<{ className?: string }>;

export const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const Comp = Icons[name];
  return <Comp className={className} />;
};

// Optional: typed re-exports if you want direct imports
export {
  MdSpaceDashboard,
  BiLogoMastercard,
  MdOutlineEmojiTransportation,
  TbRouteSquare,
  PiUsersThreeFill,
  TbBrandBooking,
  TbReportSearch,
  FaCar,
  CiSettings,
  IoMdLogOut,
  IoIosArrowDown,
};
