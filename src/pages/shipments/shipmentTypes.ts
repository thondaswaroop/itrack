// src/pages/shipments/shipmentTypes.ts
export type Mode = "AIR" | "OCEAN" | "GROUND";
export type PaymentTerm = "PREPAID" | "COLLECT";
export type Condition = "GOOD" | "DAMAGED" | "HOLD";

export type Party = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
};

export type DimUnit = "CM" | "INCH";
export type UnitType = "CARTON(S)" | "PALLET(S)" | "BAG(S)" | "BOX(ES)";

export type PackageRow = {
  id: string;
  packageId?: string;
  qrCode?: string;
  length: number | "";
  width: number | "";
  height: number | "";
  dimUnit: DimUnit;
  pkg: number | "";
  pcs: number | "";
  unit: UnitType;
  actWeightKg: number | "";
  description: string;
  declaredValue?: number | "";
};

export type UploadedDoc = { id: string; name: string; size: number };

export type FormState = {
  wrNo: string;
  receivedAt: string;
  location: string;
  shipper: Party | null;
  consignee: Party | null;
  paymentTerm: PaymentTerm;
  packageCondition: Condition;
  holdReason?: string;
  customerBoxId?: string;
  documents?: UploadedDoc[];
  mode: Mode;
  originCountry: string;
  originHub: string;
  destCountry: string;
  destHub: string;
  items: PackageRow[];
  emailNotify: boolean;
  remark?: string;
  amount?: number | "";
};
